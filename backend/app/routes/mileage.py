from fastapi import APIRouter, HTTPException, status
from typing import List, Optional
from pydantic import BaseModel, Field
from app.database import db
from app.models import VehicleMileageSummary
from app.utils.calculations import compute_mileage_for_vehicle

router = APIRouter(prefix="/mileage", tags=["Mileage Calculator"])

class SimulationRequest(BaseModel):
    current_odometer: float = Field(..., ge=0, description="Current odometer reading in km")
    previous_odometer: float = Field(..., ge=0, description="Previous full-tank odometer reading in km")
    fuel_consumed: float = Field(..., gt=0, description="Fuel filled in litres")

class SimulationResponse(BaseModel):
    distance_travelled: float
    fuel_consumed: float
    mileage_kmpl: Optional[float]
    is_valid: bool
    status: str
    message: str

@router.get("", response_model=List[VehicleMileageSummary])
def get_all_vehicles_mileage():
    """Retrieve fuel mileage summaries for all registered vehicles."""
    vehicles = db.get_vehicles()
    summaries = []
    for v in vehicles:
        vid = str(v["id"])
        logs = db.get_fuel_logs(vehicle_id=vid)
        summary = compute_mileage_for_vehicle(v, logs)
        summaries.append(summary)
    return summaries

@router.get("/{vehicle_id}", response_model=VehicleMileageSummary)
def get_vehicle_mileage(vehicle_id: str):
    """Retrieve detailed mileage calculations and full history for a specific vehicle."""
    vehicle = db.get_vehicle(vehicle_id)
    if not vehicle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vehicle with ID '{vehicle_id}' not found."
        )
    logs = db.get_fuel_logs(vehicle_id=vehicle_id)
    return compute_mileage_for_vehicle(vehicle, logs)

@router.post("/simulate", response_model=SimulationResponse)
def simulate_mileage(payload: SimulationRequest):
    """
    Interactive test/simulation endpoint to verify mileage for hypothetical
    odometer and fuel inputs.
    """
    distance = payload.current_odometer - payload.previous_odometer
    if distance < 0:
        return SimulationResponse(
            distance_travelled=distance,
            fuel_consumed=payload.fuel_consumed,
            mileage_kmpl=None,
            is_valid=False,
            status="Invalid Decreasing Odometer",
            message="Current odometer reading must be greater than previous reading."
        )
    if payload.fuel_consumed <= 0:
        return SimulationResponse(
            distance_travelled=distance,
            fuel_consumed=payload.fuel_consumed,
            mileage_kmpl=None,
            is_valid=False,
            status="Invalid Fuel Quantity",
            message="Fuel consumed must be greater than zero."
        )

    mileage = round(distance / payload.fuel_consumed, 2)
    return SimulationResponse(
        distance_travelled=round(distance, 2),
        fuel_consumed=round(payload.fuel_consumed, 2),
        mileage_kmpl=mileage,
        is_valid=True,
        status="Valid Calculation",
        message=f"Calculated mileage: {mileage} km/litre over {distance} km using {payload.fuel_consumed} litres."
    )
