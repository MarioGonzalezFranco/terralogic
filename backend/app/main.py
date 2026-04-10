from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.api import api_router # Importaremos el router central

app = FastAPI(
    title="TerraLogic AI API",
    description="Backend industrial para monitoreo agrícola con IA",
    version="1.0.0"
)

# Configuración de CORS: Vital para que tu Frontend no sea bloqueado
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # En producción cambia esto a la URL de tu frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Endpoint de prueba para verificar que el motor está encendido
@app.get("/")
async def root():
    return {"status": "online", "message": "TerraLogic AI API is running"}

# Incluimos las rutas de la API
app.include_router(api_router, prefix="/api/v1")