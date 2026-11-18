from fastapi import APIRouter, HTTPException, status
from typing import List
from app.database import db
from app.models import VehicleCreate, VehicleUpdate, VehicleResponse
from app.utils.calculations import compute_mileage_for_vehicle

router = APIRouter(prefix="/vehicles", tags=["Vehicles"])

def _enrich_vehicle(v: dict) -> dict:
    vid = str(v["id"])
    fuel_logs = db.get_fuel_logs(vehicle_id=vid)
    service_records = db.get_service_records(vehicle_id=vid)

    total_fuel = sum(float(l.get("total_cost", 0)) for l in fuel_logs)
    total_service = sum(float(s.get("service_cost", 0)) for s in service_records)

    # Latest odometer from all logs
    max_odo = 0.0
    for l in fuel_logs:
        max_odo = max(max_odo, float(l.get("odometer_reading") or 0))
    for s in service_records:
        max_odo = max(max_odo, float(s.get("odometer_reading") or 0))

    # Calculate average mileage
    mileage_summary = compute_mileage_for_vehicle(v, fuel_logs)

    v_copy = dict(v)
    v_copy["total_fuel_spent"] = round(total_fuel, 2)
    v_copy["total_service_spent"] = round(total_service, 2)
    v_copy["latest_odometer"] = max_odo
    v_copy["calculated_avg_mileage"] = mileage_summary.average_mileage
    return v_copy

@router.get("", response_model=List[VehicleResponse])
def get_all_vehicles():
    """Retrieve all registered vehicles with computed expense totals and mileage."""
    vehicles = db.get_vehicles()
    return [_enrich_vehicle(v) for v in vehicles]

@router.get("/{vehicle_id}", response_model=VehicleResponse)
def get_vehicle(vehicle_id: str):
    """Retrieve specific vehicle by ID."""
    v = db.get_vehicle(vehicle_id)
    if not v:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vehicle with ID '{vehicle_id}' not found."
        )
    return _enrich_vehicle(v)

@router.post("", response_model=VehicleResponse, status_code=status.HTTP_201_CREATED)
def create_vehicle(payload: VehicleCreate):
    """Register a new vehicle."""
    existing = db.get_vehicle_by_registration(payload.registration_number)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A vehicle with registration number '{payload.registration_number}' already exists."
        )
    new_v = db.create_vehicle(payload.model_dump())
    return _enrich_vehicle(new_v)

@router.put("/{vehicle_id}", response_model=VehicleResponse)
def update_vehicle(vehicle_id: str, payload: VehicleUpdate):
    """Update details of an existing vehicle."""
    existing = db.get_vehicle(vehicle_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vehicle with ID '{vehicle_id}' not found."
        )
    
    update_data = {k: v for k, v in payload.model_dump().items() if v is not None}
    
    # Check registration uniqueness if updated
    if "registration_number" in update_data:
        duplicate = db.get_vehicle_by_registration(update_data["registration_number"], exclude_id=vehicle_id)
        if duplicate:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Registration number '{update_data['registration_number']}' is already assigned to another vehicle."
            )

    updated = db.update_vehicle(vehicle_id, update_data)
    if not updated:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to update vehicle record.")
    return _enrich_vehicle(updated)

@router.delete("/{vehicle_id}", status_code=status.HTTP_200_OK)
def delete_vehicle(vehicle_id: str):
    """Delete a vehicle and its associated logs."""
    existing = db.get_vehicle(vehicle_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vehicle with ID '{vehicle_id}' not found."
        )
    success = db.delete_vehicle(vehicle_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to delete vehicle.")
    return {"message": f"Vehicle '{existing.get('name')}' deleted successfully.", "id": vehicle_id}
