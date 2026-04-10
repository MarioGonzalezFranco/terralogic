from sqlalchemy import Column, String, DateTime, Text, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
from app.db.session import Base

class User(Base):
    """
    Modelo de usuario definitivo. 
    Solo se crea aquí una vez que el OTP ha sido validado.
    """
    __tablename__ = "users"

    uid = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    display_name = Column(String(150))
    email = Column(String(254), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String, default="client")
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class PendingUser(Base):
    """
    Tabla de pre-registro. 
    Almacena temporalmente los datos antes de la validación por correo.
    """
    __tablename__ = "pending_users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(254), unique=True, index=True, nullable=False)
    display_name = Column(String(150), nullable=False)
    hashed_password = Column(String(255), nullable=False) # Debe coincidir con el tamaño de password_hash
    otp_code = Column(String(6), nullable=False)
    
    # Control de tiempo para la expiración
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())