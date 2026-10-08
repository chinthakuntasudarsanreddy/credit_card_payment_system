from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers.dashboard import router as dashboard_router
from app.routers.payments import router as payments_router


app = FastAPI(
    title="Credit Card Payment System - FastAPI",
    description=(
        "FastAPI service for payment processing "
        "and dashboard summary."
    ),
    version="1.0.0",
)


# ============================================================
# CORS CONFIGURATION
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# ROUTERS
# ============================================================

app.include_router(
    payments_router,
    prefix="/api/payments",
    tags=["Payments"],
)

app.include_router(
    dashboard_router,
    prefix="/dashboard",
    tags=["Dashboard"],
)


# ============================================================
# ROOT
# ============================================================

@app.get("/")
def root():
    return {
        "message": "Credit Card Payment FastAPI is running."
    }


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }