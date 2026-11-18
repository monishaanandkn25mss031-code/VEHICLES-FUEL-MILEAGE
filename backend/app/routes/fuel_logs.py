from fastapi import APIRouter, HTTPException, Query, status
from typing import List, Optional
from app.database import db
from app.models import FuelLogCreate, FuelLogUpdate, FuelLogResponse
from app.utils.calculations import calculate_fuel_cost

router = APIRouter(prefix="/fuel-logs", tags=["Fuel Logs"])

def _enrich_fuel_log(log: dict, vehicle_cache: Optional[dict] = None) -> dict:
    vid = str(log.get("vehicle_id"))
    v_name = "Unknown Vehicle"
    if vehicle_cache is not None and vid in vehicle_cache:
        v_name = vehicle_cache[vid].get("name", v_name)
    else:
        v = db.get_vehicle(vid)
        if v:
            v_name = v.get("name", v_name)

    log_copy = dict(log)
    log_copy["vehicle_name"] = v_name
    return log_copy

@router.get("", response_model=List[FuelLogResponse])
def get_fuel_logs(vehicle_id: Optional[str] = Query(None, description="Filter logs by vehicle ID")):
    """Retrieve all fuel logs, optionally filtered by vehicle ID."""
    logs = db.get_fuel_logs(vehicle_id=vehicle_id)
    vehicles = {str(v["id"]): v for v in db.get_vehicles()}
    return [_enrich_fuel_log(l, vehicles) for l in logs]

@router.get("/{log_id}", response_model=FuelLogResponse)
def get_fuel_log(log_id: str):
    """Retrieve a single fuel log entry by ID."""
    log = db.get_fuel_log(log_id)
    if not log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Fuel log entry with ID '{log_id}' not found."
        )
    return _enrich_fuel_log(log)

@router.post("", response_model=FuelLogResponse, status_code=status.HTTP_201_CREATED)
def create_fuel_log(payload: FuelLogCreate):
    """Record a new fuel refill entry with automatic total cost calculation."""
    # Ensure vehicle exists
    vehicle = db.get_vehicle(payload.vehicle_id)
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vehicle with ID '{payload.vehicle_id}' does not exist."
        )

    data = payload.model_dump()
    # Enforce auto calculation: Total Cost = Fuel Quantity × Price per Litre
    if data.get("total_cost") is None or float(data.get("total_cost", 0)) <= 0:
        data["total_cost"] = calculate_fuel_cost(payload.fuel_quantity, payload.price_per_litre)

    new_log = db.create_fuel_log(data)
    return _enrich_fuel_log(new_log)

@router.put("/{log_id}", response_model=FuelLogResponse)
def update_fuel_log(log_id: str, payload: FuelLogUpdate):
    """Update an existing fuel log entry."""
    existing = db.get_fuel_log(log_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Fuel log with ID '{log_id}' not found."
        )

    update_data = {k: v for k, v in payload.model_dump().items() if v is not None}
    
    if "vehicle_id" in update_data:
        vehicle = db.get_vehicle(update_data["vehicle_id"])
        if not vehicle:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Vehicle with ID '{update_data['vehicle_id']}' does not exist."
            )

    updated = db.update_fuel_log(log_id, update_data)
    if not updated:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to update fuel log.")
    return _enrich_fuel_log(updated)

@router.delete("/{log_id}", status_code=status.HTTP_200_OK)
def delete_fuel_log(log_id: str):
    """Delete a fuel log entry."""
    existing = db.get_fuel_log(log_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Fuel log with ID '{log_id}' not found."
        )
    success = db.delete_fuel_log(log_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to delete fuel log.")
    return {"message": "Fuel log entry deleted successfully.", "id": log_id}
