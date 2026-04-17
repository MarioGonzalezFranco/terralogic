import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.api.v1.api import api_router
from app.db.session import engine
from app.db.base import Base
from app.core.rate_limit import limiter

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="TerraLogic AI API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── Rate limiter ──────────────────────────────────────────────
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── CORS restrictivo ──────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)

# ── Límite global de tamaño de request body ───────────────────
# Previene ataques de memoria con payloads gigantes
MAX_BODY_SIZE = 15 * 1024 * 1024  # 15 MB máximo

@app.middleware("http")
async def limit_body_size(request: Request, call_next):
    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > MAX_BODY_SIZE:
        return JSONResponse(
            status_code=413,
            content={"detail": "El contenido enviado supera el límite permitido (15MB)."}
        )
    return await call_next(request)

# ── Headers de seguridad HTTP ─────────────────────────────────
@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"]        = "DENY"
    response.headers["X-XSS-Protection"]       = "1; mode=block"
    response.headers["Referrer-Policy"]        = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"]     = "geolocation=(), microphone=(), camera=()"
    return response

# ── Errores sanitizados ───────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"[ERROR] {request.method} {request.url} → {type(exc).__name__}: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Error interno del servidor. Por favor intenta más tarde."},
    )

# ── Archivos estáticos ────────────────────────────────────────
os.makedirs("./uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="./uploads"), name="uploads")

# ── Routers ───────────────────────────────────────────────────
app.include_router(api_router, prefix="/api/v1")

@app.get("/", tags=["Health"])
def root():
    return {"status": "online"}