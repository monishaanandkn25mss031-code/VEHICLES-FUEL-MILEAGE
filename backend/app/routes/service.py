from fastapi import APIRouter, HTTPException, Query, status
from typing import List, Optional
from app.database import db
from app.models import ServiceRecordCreate, ServiceRecordUpdate, ServiceRecordResponse, ReminderItem
from app.utils.calculations import compute_service_reminders

router = APIRouter(prefix="/service-records", tags=["Service Records"])

def _enrich_service_record(rec: dict, vehicle_cache: Optional[dict] = None) -> dict:
    vid = str(rec.get("vehicle_id"))
    v_name = "Unknown Vehicle"
    if vehicle_cache is not None and vid in vehicle_cache:
        v_name = vehicle_cache[vid].get("name", v_name)
    else:
        v = db.get_vehicle(vid)
        if v:
            v_name = v.get("name", v_name)

    rec_copy = dict(rec)
    rec_copy["vehicle_name"] = v_name
    return rec_copy

@router.get("", response_model=List[ServiceRecordResponse])
def get_service_records(vehicle_id: Optional[str] = Query(None, description="Filter records by vehicle ID")):
    """Retrieve all service records, optionally filtered by vehicle ID."""
    records = db.get_service_records(vehicle_id=vehicle_id)
    vehicles = {str(v["id"]): v for v in db.get_vehicles()}
    return [_enrich_service_record(r, vehicles) for r in records]

@router.get("/reminders", response_model=List[ReminderItem])
def get_upcoming_reminders():
    """Compute and retrieve upcoming vehicle service reminders based on due date and odometer readings."""
    vehicles = db.get_vehicles()
    services = db.get_service_records()
    fuel_logs = db.get_fuel_logs()
    return compute_service_reminders(vehicles, services, fuel_logs)

@router.get("/{record_id}", response_model=ServiceRecordResponse)
def get_service_record(record_id: str):
    """Retrieve a single service record by ID."""
    rec = db.get_service_record(record_id)
    if not rec:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Service record with ID '{record_id}' not found."
        )
    return _enrich_service_record(rec)

@router.post("", response_model=ServiceRecordResponse, status_code=status.HTTP_201_CREATED)
def create_service_record(payload: ServiceRecordCreate):
    """Record a new service maintenance entry."""
    vehicle = db.get_vehicle(payload.vehicle_id)
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vehicle with ID '{payload.vehicle_id}' does not exist."
        )

    # Validate next service odometer reading if provided
    if payload.next_service_due_odometer is not None and payload.next_service_due_odometer < payload.odometer_reading:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Next service due odometer reading cannot be less than current service odometer reading."
        )

    new_rec = db.create_service_record(payload.model_dump())
    return _enrich_service_record(new_rec)

@router.put("/{record_id}", response_model=ServiceRecordResponse)
def update_service_record(record_id: str, payload: ServiceRecordUpdate):
    """Update an existing service record."""
    existing = db.get_service_record(record_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Service record with ID '{record_id}' not found."
        )

    update_data = {k: v for k, v in payload.model_dump().items() if v is not None}
    
    if "vehicle_id" in update_data:
        vehicle = db.get_vehicle(update_data["vehicle_id"])
        if not vehicle:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Vehicle with ID '{update_data['vehicle_id']}' does not exist."
            )

    updated = db.update_service_record(record_id, update_data)
    if not updated:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to update service record.")
    return _enrich_service_record(updated)

@router.delete("/{record_id}", status_code=status.HTTP_200_OK)
def delete_service_record(record_id: str):
    """Delete a service record entry."""
    existing = db.get_service_record(record_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Service record with ID '{record_id}' not found."
        )
    success = db.delete_service_record(record_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to delete service record.")
    return {"message": "Service record deleted successfully.", "id": record_id}
