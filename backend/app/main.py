from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import db
from app.routes import vehicles, fuel_logs, mileage, service, dashboard, reports, settings as settings_route

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Professional REST API for tracking vehicle maintenance, fuel costs, and calculating accurate mileage.",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API route modules under /api
app.include_router(vehicles.router, prefix="/api")
app.include_router(fuel_logs.router, prefix="/api")
app.include_router(mileage.router, prefix="/api")
app.include_router(service.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(reports.router, prefix="/api")
app.include_router(settings_route.router, prefix="/api")

@app.get("/", tags=["Root"])
def root_status():
    return {
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs_url": "/docs",
        "database": db.get_database_status(),
        "status": "healthy",
    }

@app.get("/api/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "database": db.get_database_status(),
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
