# app/core/gemini_service.py
#
# Analiza imágenes de cultivos usando Gemini 2.5 Flash.
# Devuelve un JSON estructurado con los resultados.

import os
import base64
import json
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL   = "gemini-2.5-flash"

client = genai.Client(api_key=GEMINI_API_KEY)

PROMPT = """
Eres un experto agrónomo con especialización en análisis de imágenes multiespectrales de cultivos.
Analiza esta imagen de cultivo capturada por un dron y proporciona un diagnóstico detallado.

Responde ÚNICAMENTE con un JSON válido con esta estructura exacta, sin texto adicional:

{
  "resultado": "Saludable" | "Alerta" | "Estrés",
  "enfermedades": {
    "count": número entero (0-10),
    "detalle": "descripción breve o 'Ninguna detectada'"
  },
  "estres_hidrico": {
    "porcentaje": número entero (0-100),
    "nivel": "Bajo" | "Moderado" | "Alto" | "Crítico"
  },
  "plagas": {
    "count": número entero (0-10),
    "detalle": "descripción breve o 'Ninguna detectada'"
  },
  "ndvi": número decimal entre 0.0 y 1.0,
  "cobertura_vegetal": número entero (0-100),
  "insight": "Recomendación específica de 1-2 oraciones para el agricultor basada en lo observado.",
  "confianza": número decimal entre 0.0 y 1.0
}

Basa tu análisis en colores, texturas, patrones y cualquier anomalía visible en la imagen.
Si la imagen no es de un cultivo, devuelve resultado "Alerta" con insight explicando que la imagen no es válida.
"""


def analyze_crop_image(image_bytes: bytes, mime_type: str = "image/jpeg") -> dict:
    """
    Analiza una imagen de cultivo con Gemini.

    Args:
        image_bytes: Bytes de la imagen
        mime_type: Tipo MIME (image/jpeg, image/png, image/webp)

    Returns:
        dict con los resultados del análisis
    """
    try:
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=[
                types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
                PROMPT,
            ],
        )

        raw = response.text.strip()

        # Limpiar posibles bloques de código markdown
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]

        result = json.loads(raw.strip())
        return {"success": True, "data": result}

    except json.JSONDecodeError as e:
        return {
            "success": False,
            "error": f"Gemini devolvió una respuesta no válida: {e}",
            "raw": response.text if 'response' in locals() else ""
        }
    except Exception as e:
        error_msg = str(e)
        if "429" in error_msg:
            return {"success": False, "error": "Límite de cuota de Gemini alcanzado. Intenta en unos minutos."}
        return {"success": False, "error": f"Error al analizar la imagen: {error_msg}"}