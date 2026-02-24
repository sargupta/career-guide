"""
SARGVISION AI — FastAPI Backend
Entry point: uvicorn main:app --reload
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api import (
    users, activities, opportunities, auth, 
    gamification, dashboard, domains, parent,
    learning, achievements, reports, library,
    simplify, mentor, readiness, whatsapp, persona, portfolio, resume, exams, scholarships, teacher, classroom
)
from core.config import settings
from scheduler import start_scheduler, stop_scheduler
from prometheus_fastapi_instrumentator import Instrumentator


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    import logging
    logger = logging.getLogger(__name__)
    logger.info(f"🚀 SARGVISION AI starting in {settings.ENV.upper()} mode")
    
    start_scheduler()
    yield
    # Shutdown
    stop_scheduler()


app = FastAPI(
    title="SARGVISION AI API",
    description="AI-powered career co-pilot for Indian students",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Prometheus Instrumentation
Instrumentator().instrument(app).expose(app)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(users.router, prefix="/users", tags=["Users"])
app.include_router(domains.router, prefix="/domains", tags=["Domains"])
app.include_router(activities.router, prefix="/activities", tags=["Activities"])
app.include_router(opportunities.router, prefix="/opportunities", tags=["Opportunities"])
app.include_router(mentor.router, prefix="/mentor", tags=["Mentor"])
app.include_router(readiness.router, prefix="/readiness", tags=["Readiness"])
app.include_router(learning.router, prefix="/learning", tags=["Learning"])
app.include_router(achievements.router, prefix="/achievements", tags=["Achievements"])
app.include_router(whatsapp.router, prefix="/whatsapp", tags=["WhatsApp"])
app.include_router(persona.router, prefix="/persona", tags=["Persona"])
app.include_router(gamification.router, prefix="/api/gamification", tags=["gamification"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"])
app.include_router(parent.router, prefix="/parent", tags=["Parent"])
app.include_router(reports.router, prefix="/reports", tags=["Reports"])
app.include_router(library.router, prefix="/library", tags=["Library"])
app.include_router(simplify.router, prefix="/simplify", tags=["Simplification"])
app.include_router(portfolio.router, prefix="/portfolio", tags=["Portfolio"])
app.include_router(exams.router, prefix="/exams", tags=["Exams"])
app.include_router(scholarships.router, prefix="/scholarships", tags=["Scholarships"])
app.include_router(teacher.router, prefix="/teacher", tags=["Teacher"])
app.include_router(classroom.router, prefix="/classroom", tags=["Classroom"])


@app.get("/health")
async def health():
    return {"status": "ok", "service": "sargvision-api"}
