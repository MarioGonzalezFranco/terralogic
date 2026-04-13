# app/api/v1/endpoints/analysis.py

from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from fastapi.responses import JSONResponse
from app.core.gemini_service import analyze_crop_image

router = APIRouter()

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_SIZE_MB   = 10


@router.post("/analyze")
async def analyze_image(
    image: UploadFile = File(...),
    field_name: str   = Form(default="Campo sin nombre"),
):
    """
    Recibe una imagen del dron y la analiza con Gemini.
    Devuelve enfermedades, estrés hídrico, plagas, NDVI e insight.
    """
    # Validar tipo de archivo
    if image.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Formato no válido. Usa JPG, PNG o WEBP."
        )

    # Leer bytes y validar tamaño
    image_bytes = await image.read()
    size_mb = len(image_bytes) / (1024 * 1024)
    if size_mb > MAX_SIZE_MB:
        raise HTTPException(
            status_code=400,
            detail=f"La imagen supera el límite de {MAX_SIZE_MB}MB."
        )

    # Analizar con Gemini
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
        "enfermedades":      data.get("enfermedades", {"count": 0, "detalle": "No analizado"}),
        "estres_hidrico":    data.get("estres_hidrico", {"porcentaje": 0, "nivel": "Bajo"}),
        "plagas":            data.get("plagas", {"count": 0, "detalle": "No analizado"}),
        "ndvi":              data.get("ndvi", 0.0),
        "cobertura_vegetal": data.get("cobertura_vegetal", 0),
        "insight":           data.get("insight", "No se pudo generar un insight."),
        "confianza":         data.get("confianza", 0.0),
    })