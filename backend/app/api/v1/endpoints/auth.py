from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import uuid
from pydantic import BaseModel
from typing import Optional

from app.db.session import get_db
from app.db.models.user import User
from app.schemas.user import UserCreate, UserLogin
from app.core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    decode_token,
)

router = APIRouter()
bearer = HTTPBearer(auto_error=False)


# ── Helper: obtener usuario del token ────────────────────────

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer),
    db: Session = Depends(get_db),
) -> User:
    if not credentials:
        raise HTTPException(status_code=401, detail="Token requerido.")
    payload = decode_token(credentials.credentials)
    if not payload:
        raise HTTPException(status_code=401, detail="Token inválido o expirado.")
    user = db.query(User).filter(User.email == payload.get("sub")).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado.")
    return user


# ── Registro ──────────────────────────────────────────────────

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register_user(request: Request, db: Session = Depends(get_db)):
    try:
        body    = await request.json()
        user_in = UserCreate(**body)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Datos inválidos: {str(e)}")

    if db.query(User).filter(User.email == user_in.email).first():
        raise HTTPException(status_code=400, detail="El correo ya está registrado.")

    raw_role   = getattr(user_in, 'role', 'client') or 'client'
    role_final = raw_role.lower() if raw_role.lower() in ['admin', 'client'] else 'client'

    new_user = User(
        id=uuid.uuid4(),
        email=user_in.email,
        display_name=user_in.display_name,
        password_hash=get_password_hash(user_in.password),
        role=role_final,
    )
    try:
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Error al guardar el usuario.")

    token = create_access_token(subject=new_user.email)
    return {
        "user": {
            "uid":         str(new_user.id),
            "email":       new_user.email,
            "displayName": new_user.display_name,
            "role":        new_user.role,
            "createdAt":   str(new_user.created_at),
        },
        "access_token": token,
        "token_type":   "bearer",
    }


# ── Login ─────────────────────────────────────────────────────

@router.post("/login")
async def login(user_in: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_in.email).first()
    if not user or not verify_password(user_in.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Credenciales inválidas.")

    token = create_access_token(subject=user.email)
    return {
        "user": {
            "uid":         str(user.id),
            "email":       user.email,
            "displayName": user.display_name,
            "role":        user.role,
            "createdAt":   str(user.created_at),
        },
        "access_token": token,
        "token_type":   "bearer",
    }


# ── Perfil del usuario autenticado ────────────────────────────

@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "uid":         str(current_user.id),
        "email":       current_user.email,
        "displayName": current_user.display_name,
        "role":        current_user.role,
        "createdAt":   str(current_user.created_at),
    }


# ── Actualizar nombre de perfil ───────────────────────────────

class UpdateProfilePayload(BaseModel):
    display_name: Optional[str] = None

@router.patch("/me")
def update_me(
    payload: UpdateProfilePayload,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if payload.display_name:
        current_user.display_name = payload.display_name
        db.commit()
        db.refresh(current_user)

    return {
        "uid":         str(current_user.id),
        "email":       current_user.email,
        "displayName": current_user.display_name,
        "role":        current_user.role,
        "createdAt":   str(current_user.created_at),
    }


# ── Cambiar contraseña ────────────────────────────────────────

class ChangePasswordPayload(BaseModel):
    current_password: str
    new_password:     str

@router.post("/me/password")
def change_password(
    payload: ChangePasswordPayload,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Verificar contraseña actual
    if not verify_password(payload.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=400,
            detail="La contraseña actual es incorrecta.",
        )

    if len(payload.new_password) < 6:
        raise HTTPException(
            status_code=400,
            detail="La nueva contraseña debe tener al menos 6 caracteres.",
        )

    # Guardar nueva contraseña hasheada
    current_user.password_hash = get_password_hash(payload.new_password)
    db.commit()

    return {"message": "Contraseña actualizada correctamente."}