# app/api/v1/endpoints/analysis.py

from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from fastapi.responses import JSONResponse
from PIL import Image
import io

from app.core.gemini_service import analyze_crop_image

router = APIRouter()

ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_SIZE_BYTES     = 10 * 1024 * 1024  # 10 MB
MIN_DIMENSION      = 100               # Mínimo 100x100 px
MAX_DIMENSION      = 10000             # Máximo 10000px por lado


@router.post("/analyze")
async def analyze_image(
    image:      UploadFile = File(...),
    field_name: str        = Form(default="Campo sin nombre"),
):
    # 1. Validar Content-Type declarado
    if image.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(status_code=400, detail="Formato no válido. Usa JPG, PNG o WEBP.")

    # 2. Leer bytes y validar tamaño
    image_bytes = await image.read()
    if len(image_bytes) > MAX_SIZE_BYTES:
        raise HTTPException(status_code=400, detail="La imagen supera el límite de 10MB.")
    if len(image_bytes) < 100:
        raise HTTPException(status_code=400, detail="El archivo es demasiado pequeño para ser una imagen válida.")

    # 3. Validar que sea una imagen REAL con Pillow
    # Esto previene que archivos maliciosos pasen haciéndose pasar por imágenes
    try:
        img = Image.open(io.BytesIO(image_bytes))
        img.verify()  # Verifica la integridad del archivo
        # Re-abrir después de verify() porque verify() cierra el objeto
        img = Image.open(io.BytesIO(image_bytes))
        width, height = img.size
        real_format   = img.format  # JPEG, PNG, WEBP
    except Exception:
        raise HTTPException(status_code=400, detail="El archivo no es una imagen válida.")

    # 4. Validar dimensiones
    if width < MIN_DIMENSION or height < MIN_DIMENSION:
        raise HTTPException(status_code=400, detail=f"La imagen debe tener al menos {MIN_DIMENSION}x{MIN_DIMENSION} píxeles.")
    if width > MAX_DIMENSION or height > MAX_DIMENSION:
        raise HTTPException(status_code=400, detail=f"La imagen supera el tamaño máximo permitido.")

    # 5. Sanitizar el nombre del campo
    field_name = field_name.strip()[:200]  # Máximo 200 caracteres
    if not field_name:
        field_name = "Campo sin nombre"

    # 6. Analizar con Gemini
    result = analyze_crop_image(
        image_bytes=image_bytes,
        mime_type=image.content_type,
    )

    if not result["success"]:
        raise HTTPException(status_code=500, detail=result["error"])

    data = result["data"]

    return JSONResponse({
        "field_name":        field_name,
        "resultado":         data.get("resultado", "Alerta"),
        "enfermedades":      data.get("enfermedades",   {"count": 0, "detalle": "No analizado"}),
        "estres_hidrico":    data.get("estres_hidrico",  {"porcentaje": 0, "nivel": "Bajo"}),
        "plagas":            data.get("plagas",          {"count": 0, "detalle": "No analizado"}),
        "ndvi":              data.get("ndvi", 0.0),
        "cobertura_vegetal": data.get("cobertura_vegetal", 0),
        "insight":           data.get("insight", ""),
        "confianza":         data.get("confianza", 0.0),
        "image_dimensions":  f"{width}x{height}px",
        "image_format":      real_format,
    })