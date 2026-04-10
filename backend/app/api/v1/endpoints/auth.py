from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
import uuid
import json

# Dependencias internas
from app.db.session import get_db
from app.db.models.user import User
from app.schemas.user import UserCreate, UserLogin
from app.core.security import (
    get_password_hash, 
    verify_password, 
    create_access_token
)

router = APIRouter()

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register_user(request: Request, db: Session = Depends(get_db)):
    """
    Registra un nuevo usuario mapeando los roles según el ENUM de la DB: {admin, client}
    """
    # 1. Extracción y Validación
    try:
        body = await request.json()
        user_in = UserCreate(**body)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Datos inválidos: {str(e)}"
        )

    # 2. Verificación de duplicados
    user_exists = db.query(User).filter(User.email == user_in.email).first()
    if user_exists:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El correo electrónico ya está registrado."
        )

    # 3. Lógica de Mapeo de Roles
    raw_role = getattr(user_in, 'role', 'client') or 'client'
    role_final = raw_role.lower() if raw_role.lower() in ['admin', 'client'] else 'client'

    # 4. Creación del modelo (Usando uid y convirtiendo a string para la DB)
    new_user = User(
        uid=str(uuid.uuid4()), 
        email=user_in.email,
        display_name=user_in.display_name,
        password_hash=get_password_hash(user_in.password),
        role=role_final
    )
    
    try:
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
    except Exception as e:
        db.rollback()
        print(f"❌ ERROR DE DB: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error de integridad al guardar el usuario."
        )

    # 5. Generación de Token
    access_token = create_access_token(subject=new_user.email)

    return {
        "user": {
            "uid": str(new_user.uid), # <-- Corregido: de .id a .uid
            "email": new_user.email,
            "displayName": new_user.display_name,
            "role": new_user.role,
            "createdAt": str(new_user.created_at)
        },
        "access_token": access_token,
        "token_type": "bearer"
    }

@router.post("/login")
async def login(user_in: UserLogin, db: Session = Depends(get_db)):
    """
    Autentica al usuario y devuelve sus datos.
    """
    user = db.query(User).filter(User.email == user_in.email).first()
    
    if not user or not verify_password(user_in.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales inválidas."
        )

    access_token = create_access_token(subject=user.email)

    return {
        "user": {
            "uid": str(user.uid), # <-- Corregido: de .id a .uid
            "email": user.email,
            "displayName": user.display_name,
            "role": user.role,
            "createdAt": str(user.created_at)
        },
        "access_token": access_token,
        "token_type": "bearer"
    }