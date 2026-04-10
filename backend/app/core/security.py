import jwt
from datetime import datetime, timedelta
from typing import Any, Union
from passlib.context import CryptContext
import os
from dotenv import load_dotenv

load_dotenv()

# Configuración de seguridad
PWD_CONTEXT = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = os.getenv("SECRET_KEY", "terra_logic_super_secret_2026") # Cambia esto en tu .env
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 480  # 8 horas para el turno de trabajo agrícola

def get_password_hash(password: str) -> str:
    """Hashea la contraseña para guardarla segura en Postgres"""
    return PWD_CONTEXT.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Compara la contraseña del login con el hash de la DB"""
    return PWD_CONTEXT.verify(plain_password, hashed_password)

def create_access_token(subject: Union[str, Any], expires_delta: timedelta = None) -> str:
    """Genera el token JWT para el Frontend"""
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt