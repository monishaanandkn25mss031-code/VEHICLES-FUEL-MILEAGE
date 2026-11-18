from fastapi import APIRouter
from app.database import db
from app.models import AppSettings, AppSettingsUpdate

router = APIRouter(prefix="/settings", tags=["Settings"])

@router.get("", response_model=AppSettings)
def get_settings():
    """Retrieve current application configuration and display units."""
    return db.get_settings()

@router.put("", response_model=AppSettings)
def update_settings(payload: AppSettingsUpdate):
    """Update application name, currency symbol, distance unit, or fuel unit."""
    data = {k: v for k, v in payload.model_dump().items() if v is not None}
    return db.update_settings(data)

@router.get("/status")
def get_system_status():
    """Check backend operational status and database connection details."""
    return db.get_database_status()
