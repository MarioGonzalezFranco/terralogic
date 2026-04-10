from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

# Cargamos variables de entorno
load_dotenv()

# Priorizamos la URL del .env. 
# NOTA: Asegúrate que en tu .env sea "terralogic" y no "terralogic_db"
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(SQLALCHEMY_DATABASE_URL)

if not SQLALCHEMY_DATABASE_URL:
    # Fallback de seguridad para desarrollo
    SQLALCHEMY_DATABASE_URL = "postgresql://postgres:root123@127.0.0.1:5432/terralogic"

# CONFIGURACIÓN INDUSTRIAL DEL ENGINE
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    # El parámetro 'client_encoding' fuerza a que la comunicación sea UTF-8 
    # y evita el error de decodificación en Windows (byte 0xf3)
    connect_args={
        "options": "-c client_encoding=utf8"
    },
    # pool_pre_ping verifica que la conexión siga viva antes de usarla (evita cuellos de botella)
    pool_pre_ping=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    """
    Dependency para FastAPI que garantiza el cierre de la sesión 
    después de cada petición, evitando fugas de memoria.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()