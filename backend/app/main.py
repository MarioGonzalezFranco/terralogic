import os
import re
import time
from collections import defaultdict
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
    docs_url=None,      # ← Deshabilita /docs en producción
    redoc_url=None,     # ← Deshabilita /redoc en producción
    openapi_url=None,   # ← Oculta el schema OpenAPI
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

# ── Registro de IPs sospechosas (en memoria) ──────────────────
_suspicious_ips: dict[str, dict] = defaultdict(lambda: {"count": 0, "blocked_until": 0})
SUSPICIOUS_THRESHOLD = 10   # intentos antes de bloqueo temporal
BLOCK_SECONDS        = 300  # 5 minutos de bloqueo

# ── User-Agents de herramientas de ataque conocidas ───────────
MALICIOUS_UA_PATTERNS = [
    r"nikto", r"sqlmap", r"nmap", r"masscan", r"hydra",
    r"burpsuite", r"metasploit", r"dirbuster", r"gobuster",
    r"wfuzz", r"nuclei", r"acunetix", r"nessus", r"openvas",
    r"zgrab", r"python-requests/2\.2[0-9]",  # versiones antiguas usadas en scripts
]

# ── Patrones WAF — payloads comunes de inyección ──────────────
WAF_PATTERNS = [
    # SQL Injection
    r"(union[\s\+%20]+select|select[\s\+%20]+from|drop[\s\+%20]+table|insert[\s\+%20]+into|delete[\s\+%20]+from)",
    r"(union\s+select|select\s+from|drop\s+table|insert\s+into|delete\s+from)",
    r"(--|;--|'--|#|/\*|\*/)",
    r"(or\s+1=1|and\s+1=1|or\s+'1'='1)",
    r"(sleep\s*\(|benchmark\s*\(|waitfor\s+delay)",
    r"(%20union%20|%20select%20|%20from%20|%20where%20)",
    # XSS
    r"(<script|javascript:|onerror=|onload=|onclick=|alert\s*\()",
    r"(document\.cookie|window\.location|eval\s*\()",
    # Path traversal
    r"(\.\./|\.\.\\|%2e%2e%2f|%252e%252e)",
    # Command injection
    r"(;\s*cat\s|;\s*ls\s|;\s*pwd|;\s*id\s|&&\s*id|`id`|\$\(id\))",
    # SSRF básico
    r"(169\.254\.169\.254|metadata\.google|localhost:(?!5173|3000|8000))",
]

COMPILED_WAF     = [re.compile(p, re.IGNORECASE) for p in WAF_PATTERNS]
COMPILED_UA      = [re.compile(p, re.IGNORECASE) for p in MALICIOUS_UA_PATTERNS]


def get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def flag_ip(ip: str):
    """Incrementa el contador de comportamiento sospechoso de una IP."""
    entry = _suspicious_ips[ip]
    entry["count"] += 1
    if entry["count"] >= SUSPICIOUS_THRESHOLD:
        entry["blocked_until"] = time.time() + BLOCK_SECONDS
        print(f"[SECURITY] IP bloqueada por comportamiento sospechoso: {ip}")


def is_ip_blocked(ip: str) -> bool:
    entry = _suspicious_ips.get(ip)
    if not entry:
        return False
    if entry["blocked_until"] > time.time():
        return True
    # Bloqueo expirado — resetear
    if entry["blocked_until"] > 0:
        entry["count"]         = 0
        entry["blocked_until"] = 0
    return False


# ── MIDDLEWARE 1: Bloqueo de IPs y User-Agents maliciosos ─────
@app.middleware("http")
async def security_gate(request: Request, call_next):
    ip = get_client_ip(request)

    # 1. Verificar IP bloqueada
    if is_ip_blocked(ip):
        print(f"[SECURITY] Request bloqueado — IP en lista negra: {ip}")
        return JSONResponse(status_code=403, content={"detail": "Acceso denegado."})

    # 2. Detectar User-Agents de herramientas de ataque
    ua = request.headers.get("User-Agent", "")
    for pattern in COMPILED_UA:
        if pattern.search(ua):
            flag_ip(ip)
            print(f"[SECURITY] User-Agent malicioso detectado: {ua} desde {ip}")
            return JSONResponse(status_code=403, content={"detail": "Acceso denegado."})

    # 3. WAF — inspeccionar URL completa y query params por separado
    full_url   = str(request.url)
    query_str  = str(request.url.query)

    for pattern in COMPILED_WAF:
        if pattern.search(full_url) or pattern.search(query_str):
            flag_ip(ip)
            print(f"[WAF] Payload sospechoso en URL/params desde {ip}: {full_url[:200]}")
            return JSONResponse(status_code=400, content={"detail": "Solicitud no válida."})

    # 4. WAF — inspeccionar body en requests POST/PUT/PATCH
    if request.method in ("POST", "PUT", "PATCH"):
        content_type = request.headers.get("content-type", "")
        if "application/json" in content_type:
            try:
                body_bytes = await request.body()
                body_str   = body_bytes.decode("utf-8", errors="ignore")
                for pattern in COMPILED_WAF:
                    if pattern.search(body_str):
                        flag_ip(ip)
                        print(f"[WAF] Payload sospechoso en body desde {ip}")
                        return JSONResponse(status_code=400, content={"detail": "Solicitud no válida."})
                # Reconstruir el request con el body ya leído
                async def receive():
                    return {"type": "http.request", "body": body_bytes}
                request._receive = receive
            except Exception:
                pass

    return await call_next(request)


# ── MIDDLEWARE 2: Límite de tamaño de request ─────────────────
MAX_BODY_SIZE = 15 * 1024 * 1024  # 15 MB

@app.middleware("http")
async def limit_body_size(request: Request, call_next):
    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > MAX_BODY_SIZE:
        return JSONResponse(
            status_code=413,
            content={"detail": "El contenido enviado supera el límite permitido (15MB)."}
        )
    return await call_next(request)


# ── MIDDLEWARE 3: Headers de seguridad HTTP ───────────────────
@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)

    # Ocultar información del servidor
    response.headers["Server"]                    = "TerraLogic"
    response.headers["X-Powered-By"]              = ""

    # Headers estándar
    response.headers["X-Content-Type-Options"]    = "nosniff"
    response.headers["X-Frame-Options"]           = "DENY"
    response.headers["X-XSS-Protection"]          = "1; mode=block"
    response.headers["Referrer-Policy"]           = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"]        = "geolocation=(), microphone=(), camera=()"

    # Content-Security-Policy — previene XSS avanzado
    response.headers["Content-Security-Policy"]   = (
        "default-src 'none'; "
        "script-src 'none'; "
        "object-src 'none'; "
        "frame-ancestors 'none';"
    )

    # HSTS — forzar HTTPS (activo para producción)
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"

    # Prevenir caché de respuestas sensibles
    if request.url.path.startswith("/api/v1/auth"):
        response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate"
        response.headers["Pragma"]        = "no-cache"

    return response


# ── Errores sanitizados ───────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    ip = get_client_ip(request)
    print(f"[ERROR] {request.method} {request.url} → {type(exc).__name__}: {exc} | IP: {ip}")
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