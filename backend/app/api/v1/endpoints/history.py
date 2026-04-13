# app/api/v1/endpoints/history.py

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel
import uuid

from app.db.session import get_db
from app.core.security import decode_token

router = APIRouter()
bearer = HTTPBearer(auto_error=False)


# ── Schemas ───────────────────────────────────────────────────

class SaveAnalysisPayload(BaseModel):
    field_name:        str
    resultado:         str
    ndvi:              float
    cobertura_vegetal: int
    enfermedades:      dict   # { count, detalle }
    estres_hidrico:    dict   # { porcentaje, nivel }
    plagas:            dict   # { count, detalle }
    insight:           str
    confianza:         float
    image_url:         Optional[str] = None


# ── Guardar análisis ──────────────────────────────────────────

@router.post("/save")
def save_analysis(
    payload: SaveAnalysisPayload,
    credentials: HTTPAuthorizationCredentials = Depends(bearer),
    db: Session = Depends(get_db),
):
    """Guarda un análisis de Gemini en la base de datos."""

    # Obtener user_id del token (opcional — no bloquea si no hay token)
    user_id = None
    if credentials:
        token_data = decode_token(credentials.credentials)
        if token_data:
            user_id = token_data.get("sub")

    record_id = str(uuid.uuid4())
    now       = datetime.now(timezone.utc)

    db.execute(text("""
        INSERT INTO analysis_records (
            id, field_name, result, ndvi, cobertura,
            diseases_count, enf_detalle,
            water_stress_pct, nivel_estres,
            plagas_count, plagas_detalle,
            ai_insight, confianza,
            image_url, user_id,
            crop, resolution, analysis_type,
            analyzed_at, created_at
        ) VALUES (
            :id, :field_name, :result, :ndvi, :cobertura,
            :diseases_count, :enf_detalle,
            :water_stress_pct, :nivel_estres,
            :plagas_count, :plagas_detalle,
            :ai_insight, :confianza,
            :image_url, :user_id,
            :crop, :resolution, :analysis_type,
            :analyzed_at, :created_at
        )
    """), {
        "id":              record_id,
        "field_name":      payload.field_name,
        "result":          payload.resultado,
        "ndvi":            payload.ndvi,
        "cobertura":       payload.cobertura_vegetal,
        "diseases_count":  payload.enfermedades.get("count", 0),
        "enf_detalle":     payload.enfermedades.get("detalle", ""),
        "water_stress_pct":payload.estres_hidrico.get("porcentaje", 0),
        "nivel_estres":    payload.estres_hidrico.get("nivel", ""),
        "plagas_count":    payload.plagas.get("count", 0),
        "plagas_detalle":  payload.plagas.get("detalle", ""),
        "ai_insight":      payload.insight,
        "confianza":       payload.confianza,
        "image_url":       payload.image_url,
        "user_id":         user_id,
        "crop":            "Sin especificar",
        "resolution":      "N/A",
        "analysis_type":   "Gemini AI",
        "analyzed_at":     now,
        "created_at":      now,
    })
    db.commit()

    # Generar alertas automáticas según resultados de Gemini
    try:
        auto_create_alerts(payload, db)
    except Exception:
        pass  # No interrumpir si falla la generación de alertas

    return {"id": record_id, "message": "Análisis guardado correctamente"}


# ── Listar análisis ───────────────────────────────────────────

@router.get("/list")
def list_analyses(
    skip:  int = 0,
    limit: int = 20,
    credentials: HTTPAuthorizationCredentials = Depends(bearer),
    db: Session = Depends(get_db),
):
    """Devuelve el historial de análisis ordenado por fecha."""

    rows = db.execute(text("""
        SELECT
            id, field_name, result, ndvi, cobertura,
            diseases_count, enf_detalle,
            water_stress_pct, nivel_estres,
            plagas_count, plagas_detalle,
            ai_insight, confianza,
            image_url, analyzed_at
        FROM analysis_records
        ORDER BY analyzed_at DESC
        LIMIT :limit OFFSET :skip
    """), {"limit": limit, "skip": skip}).fetchall()

    total = db.execute(
        text("SELECT COUNT(*) FROM analysis_records")
    ).scalar()

    records = []
    for r in rows:
        analyzed_at = r[14]
        records.append({
            "id":              r[0],
            "field_name":      r[1] or "Sin nombre",
            "result":          r[2],
            "ndvi":            float(r[3]) if r[3] else 0.0,
            "cobertura":       r[4] or 0,
            "diseases_count":  r[5] or 0,
            "enf_detalle":     r[6] or "Ninguna",
            "water_stress_pct":r[7] or 0,
            "nivel_estres":    r[8] or "—",
            "plagas_count":    r[9] or 0,
            "plagas_detalle":  r[10] or "Ninguna",
            "ai_insight":      r[11] or "",
            "confianza":       float(r[12]) if r[12] else 0.0,
            "image_url":       r[13],
            "date":            analyzed_at.strftime("%d %b, %Y") if analyzed_at else "—",
            "time":            analyzed_at.strftime("%I:%M %p") if analyzed_at else "—",
        })

    return {"items": records, "total": total}


# ── Eliminar análisis ─────────────────────────────────────────

@router.delete("/{record_id}")
def delete_analysis(
    record_id: str,
    db: Session = Depends(get_db),
):
    """Elimina un análisis por ID."""
    result = db.execute(
        text("DELETE FROM analysis_records WHERE id = :id"),
        {"id": record_id}
    )
    db.commit()

    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Registro no encontrado.")

    return {"message": "Análisis eliminado correctamente"}


# ── Auto-generar alertas desde análisis de Gemini ─────────────

def auto_create_alerts(payload: SaveAnalysisPayload, db: Session):
    """
    Crea alertas automáticamente según los resultados de Gemini.
    Se llama después de guardar el análisis.
    """
    alerts = []
    field  = payload.field_name

    # Estrés hídrico crítico (> 70%)
    stress = payload.estres_hidrico.get("porcentaje", 0)
    if stress > 70:
        alerts.append({
            "alert_type":  "critical",
            "title":       "Estrés Hídrico Crítico Detectado",
            "field_name":  field,
            "description": f"Gemini detectó un estrés hídrico del {stress}% (nivel {payload.estres_hidrico.get('nivel', '')}) en {field}. Se requiere riego urgente.",
        })
    elif stress > 40:
        alerts.append({
            "alert_type":  "warning",
            "title":       "Estrés Hídrico Moderado",
            "field_name":  field,
            "description": f"Nivel de estrés hídrico: {stress}% en {field}. Considerar aumentar la frecuencia de riego.",
        })

    # Enfermedades detectadas
    enf_count = payload.enfermedades.get("count", 0)
    if enf_count > 0:
        alerts.append({
            "alert_type":  "critical" if enf_count > 1 else "warning",
            "title":       f"Enfermedades Detectadas en {field}",
            "field_name":  field,
            "description": f"Gemini detectó {enf_count} enfermedad(es): {payload.enfermedades.get('detalle', '')}. Inspección y tratamiento recomendados.",
        })

    # Plagas detectadas
    plagas_count = payload.plagas.get("count", 0)
    if plagas_count > 0:
        alerts.append({
            "alert_type":  "critical" if plagas_count > 1 else "warning",
            "title":       f"Presencia de Plagas en {field}",
            "field_name":  field,
            "description": f"Se detectaron {plagas_count} plaga(s): {payload.plagas.get('detalle', '')}. Aplicar medidas de control fitosanitario.",
        })

    # NDVI bajo (cultivo en mal estado)
    if payload.ndvi < 0.3:
        alerts.append({
            "alert_type":  "critical",
            "title":       f"NDVI Crítico en {field}",
            "field_name":  field,
            "description": f"El índice NDVI de {payload.ndvi:.2f} indica vegetación muy deteriorada. Evaluación urgente del cultivo.",
        })
    elif payload.ndvi < 0.5:
        alerts.append({
            "alert_type":  "warning",
            "title":       f"Vigor Vegetal Bajo en {field}",
            "field_name":  field,
            "description": f"NDVI de {payload.ndvi:.2f} sugiere un cultivo con bajo vigor. Revisar nutrición y condiciones del suelo.",
        })

    # Insertar alertas generadas
    now = datetime.now(timezone.utc)
    for alert in alerts:
        db.execute(text("""
            INSERT INTO alerts (alert_type, title, field_name, description, is_read, is_dismissed, created_at)
            VALUES (:alert_type, :title, :field_name, :description, FALSE, FALSE, :created_at)
        """), {**alert, "created_at": now})

    if alerts:
        db.commit()