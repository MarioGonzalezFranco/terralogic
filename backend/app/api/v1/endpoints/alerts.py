# app/api/v1/endpoints/alerts.py

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import datetime, timezone
from pydantic import BaseModel
from typing import Optional

from app.db.session import get_db
from app.core.security import decode_token

router = APIRouter()
bearer = HTTPBearer(auto_error=False)


# ── Schemas ───────────────────────────────────────────────────

class CreateAlertPayload(BaseModel):
    alert_type:  str   # critical | warning | info
    title:       str
    field_name:  str
    description: str


# ── Crear alerta ──────────────────────────────────────────────

@router.post("/", status_code=201)
def create_alert(
    payload: CreateAlertPayload,
    db: Session = Depends(get_db),
):
    db.execute(text("""
        INSERT INTO alerts (alert_type, title, field_name, description, is_read, is_dismissed, created_at)
        VALUES (:alert_type, :title, :field_name, :description, FALSE, FALSE, :created_at)
    """), {
        "alert_type":  payload.alert_type,
        "title":       payload.title,
        "field_name":  payload.field_name,
        "description": payload.description,
        "created_at":  datetime.now(timezone.utc),
    })
    db.commit()
    return {"message": "Alerta creada"}


# ── Listar alertas activas ────────────────────────────────────

@router.get("/")
def list_alerts(db: Session = Depends(get_db)):
    rows = db.execute(text("""
        SELECT id, alert_type, title, field_name, description, is_read, created_at
        FROM alerts
        WHERE is_dismissed = FALSE
        ORDER BY created_at DESC
        LIMIT 50
    """)).fetchall()

    alerts = []
    for r in rows:
        created_at = r[6]
        # Calcular tiempo relativo
        now   = datetime.now(timezone.utc)
        diff  = now - (created_at if created_at.tzinfo else created_at.replace(tzinfo=timezone.utc))
        mins  = int(diff.total_seconds() / 60)
        if mins < 60:
            time_str = f"Hace {mins} min" if mins > 0 else "Ahora"
        elif mins < 1440:
            time_str = f"Hace {mins // 60} hora{'s' if mins // 60 > 1 else ''}"
        else:
            time_str = f"Hace {mins // 1440} día{'s' if mins // 1440 > 1 else ''}"

        alerts.append({
            "id":          str(r[0]),
            "type":        r[1],
            "title":       r[2],
            "field":       r[3] or "Sin campo",
            "desc":        r[4],
            "is_read":     r[5],
            "time":        time_str,
        })

    return {"items": alerts, "total": len(alerts)}


# ── Marcar como leída ─────────────────────────────────────────

@router.patch("/{alert_id}/read")
def mark_read(alert_id: str, db: Session = Depends(get_db)):
    db.execute(
        text("UPDATE alerts SET is_read = TRUE WHERE id = :id"),
        {"id": alert_id}
    )
    db.commit()
    return {"message": "Alerta marcada como leída"}


# ── Descartar alerta ──────────────────────────────────────────

@router.delete("/{alert_id}")
def dismiss_alert(alert_id: str, db: Session = Depends(get_db)):
    result = db.execute(
        text("UPDATE alerts SET is_dismissed = TRUE, dismissed_at = :now WHERE id = :id"),
        {"id": alert_id, "now": datetime.now(timezone.utc)}
    )
    db.commit()
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Alerta no encontrada")
    return {"message": "Alerta descartada"}


# ── Descartar todas ───────────────────────────────────────────

@router.delete("/")
def dismiss_all(db: Session = Depends(get_db)):
    db.execute(
        text("UPDATE alerts SET is_dismissed = TRUE, dismissed_at = :now WHERE is_dismissed = FALSE"),
        {"now": datetime.now(timezone.utc)}
    )
    db.commit()
    return {"message": "Todas las alertas descartadas"}