from typing import Optional, List, Literal
from datetime import date, datetime
from pydantic import BaseModel, Field, field_validator

# -------------------------------------------------------------
# Vehicle Models
# -------------------------------------------------------------
VehicleType = Literal["Car", "Bike", "Truck", "Other"]
FuelType = Literal["Petrol", "Diesel", "Electric", "CNG", "Hybrid", "Other"]

class VehicleBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Friendly vehicle name e.g. 'Daily Commute Swift'")
    brand: str = Field(..., min_length=1, max_length=100, description="Brand/Manufacturer e.g. 'Maruti Suzuki'")
    model: str = Field(..., min_length=1, max_length=100, description="Model e.g. 'Swift VXi'")
    registration_number: str = Field(..., min_length=1, max_length=50, description="License plate e.g. 'MH 12 AB 1234'")
    vehicle_type: VehicleType = Field(default="Car")
    fuel_type: FuelType = Field(default="Petrol")
    manufacturing_year: int = Field(..., ge=1900, le=2100, description="Year of manufacture")

    @field_validator("registration_number")
    @classmethod
    def clean_reg_no(cls, v: str) -> str:
        return v.strip().upper()

class VehicleCreate(VehicleBase):
    pass

class VehicleUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    brand: Optional[str] = Field(None, min_length=1, max_length=100)
    model: Optional[str] = Field(None, min_length=1, max_length=100)
    registration_number: Optional[str] = Field(None, min_length=1, max_length=50)
    vehicle_type: Optional[VehicleType] = None
    fuel_type: Optional[FuelType] = None
    manufacturing_year: Optional[int] = Field(None, ge=1900, le=2100)

class VehicleResponse(VehicleBase):
    id: str
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    total_fuel_spent: Optional[float] = 0.0
    total_service_spent: Optional[float] = 0.0
    latest_odometer: Optional[float] = 0.0
    calculated_avg_mileage: Optional[float] = None

# -------------------------------------------------------------
# Fuel Log Models
# -------------------------------------------------------------
class FuelLogBase(BaseModel):
    vehicle_id: str
    refuel_date: str = Field(..., description="Date of refuelling (YYYY-MM-DD)")
    odometer_reading: float = Field(..., ge=0, description="Odometer reading in km")
    fuel_quantity: float = Field(..., gt=0, description="Fuel volume in litres")
    price_per_litre: float = Field(..., ge=0, description="Fuel price per litre in currency")
    is_full_tank: bool = Field(default=True, description="Whether the tank was filled up to the brim")
    notes: Optional[str] = Field(None, max_length=500)

class FuelLogCreate(FuelLogBase):
    total_cost: Optional[float] = Field(None, description="Optional override; auto-calculated if None")

    @field_validator("refuel_date")
    @classmethod
    def validate_date(cls, v: str) -> str:
        try:
            date.fromisoformat(v)
        except Exception:
            raise ValueError("Invalid date format. Expected YYYY-MM-DD")
        return v

class FuelLogUpdate(BaseModel):
    vehicle_id: Optional[str] = None
    refuel_date: Optional[str] = None
    odometer_reading: Optional[float] = Field(None, ge=0)
    fuel_quantity: Optional[float] = Field(None, gt=0)
    price_per_litre: Optional[float] = Field(None, ge=0)
    total_cost: Optional[float] = Field(None, ge=0)
    is_full_tank: Optional[bool] = None
    notes: Optional[str] = None

class FuelLogResponse(FuelLogBase):
    id: str
    total_cost: float
    created_at: Optional[str] = None
    vehicle_name: Optional[str] = None
    calculated_distance: Optional[float] = None
    calculated_mileage: Optional[float] = None

# -------------------------------------------------------------
# Service Record Models
# -------------------------------------------------------------
class ServiceRecordBase(BaseModel):
    vehicle_id: str
    service_date: str = Field(..., description="Date of service (YYYY-MM-DD)")
    odometer_reading: float = Field(..., ge=0, description="Odometer at service time")
    service_type: str = Field(..., min_length=1, max_length=100, description="e.g. Periodic Service, Oil Change, Tyre Replacement")
    description: Optional[str] = Field(None, max_length=1000)
    service_centre: Optional[str] = Field(None, max_length=150)
    service_cost: float = Field(..., ge=0, description="Cost in currency")
    next_service_due_date: Optional[str] = Field(None, description="Next service due date (YYYY-MM-DD)")
    next_service_due_odometer: Optional[float] = Field(None, ge=0, description="Target odometer for next service")

class ServiceRecordCreate(ServiceRecordBase):
    @field_validator("service_date")
    @classmethod
    def validate_service_date(cls, v: str) -> str:
        try:
            date.fromisoformat(v)
        except Exception:
            raise ValueError("Invalid service_date format. Expected YYYY-MM-DD")
        return v

class ServiceRecordUpdate(BaseModel):
    vehicle_id: Optional[str] = None
    service_date: Optional[str] = None
    odometer_reading: Optional[float] = Field(None, ge=0)
    service_type: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    service_centre: Optional[str] = None
    service_cost: Optional[float] = Field(None, ge=0)
    next_service_due_date: Optional[str] = None
    next_service_due_odometer: Optional[float] = Field(None, ge=0)

class ServiceRecordResponse(ServiceRecordBase):
    id: str
    created_at: Optional[str] = None
    vehicle_name: Optional[str] = None
    status: Optional[str] = "Normal"

# -------------------------------------------------------------
# App Settings
# -------------------------------------------------------------
class AppSettings(BaseModel):
    id: str = "default"
    app_name: str = "Vehicle Service & Fuel Mileage Logger"
    currency_symbol: str = "₹"
    currency_code: str = "INR"
    distance_unit: str = "km"
    fuel_unit: str = "litres"
    updated_at: Optional[str] = None

class AppSettingsUpdate(BaseModel):
    app_name: Optional[str] = None
    currency_symbol: Optional[str] = None
    currency_code: Optional[str] = None
    distance_unit: Optional[str] = None
    fuel_unit: Optional[str] = None

# -------------------------------------------------------------
# Mileage Calculation & Analysis Models
# -------------------------------------------------------------
class MileageHistoryItem(BaseModel):
    log_id: str
    vehicle_id: str
    vehicle_name: str
    refuel_date: str
    current_odometer: float
    previous_odometer: Optional[float] = None
    distance_travelled: Optional[float] = None
    fuel_consumed: float
    mileage_kmpl: Optional[float] = None
    is_full_tank: bool
    status: str  # "Valid", "First Entry (Baseline)", "Partial Tank", "Decreasing Odometer"

class VehicleMileageSummary(BaseModel):
    vehicle_id: str
    vehicle_name: str
    registration_number: str
    latest_mileage: Optional[float] = None
    average_mileage: Optional[float] = None
    best_mileage: Optional[float] = None
    worst_mileage: Optional[float] = None
    total_distance_tracked: float = 0.0
    total_fuel_consumed: float = 0.0
    total_fuel_cost: float = 0.0
    valid_calculation_count: int = 0
    history: List[MileageHistoryItem] = []
    explanation: str

# -------------------------------------------------------------
# Reminders & Dashboard Models
# -------------------------------------------------------------
class ReminderItem(BaseModel):
    id: str
    vehicle_id: str
    vehicle_name: str
    registration_number: str
    service_type: str
    service_date: str
    next_service_due_date: Optional[str] = None
    next_service_due_odometer: Optional[float] = None
    current_odometer: float
    days_left: Optional[int] = None
    km_left: Optional[float] = None
    urgency: Literal["urgent", "due_soon", "normal", "completed"] = "normal"
    alert_message: str

class MonthlyExpense(BaseModel):
    month: str  # YYYY-MM
    month_name: str # e.g. "Oct 2026"
    fuel_expense: float = 0.0
    service_expense: float = 0.0
    total_expense: float = 0.0

class DashboardStats(BaseModel):
    total_vehicles: int
    total_fuel_expenses: float
    average_fuel_mileage: Optional[float] = None
    total_service_expenses: float
    total_overall_expenses: float
    recent_fuel_entries: List[FuelLogResponse] = []
    recent_service_records: List[ServiceRecordResponse] = []
    upcoming_reminders: List[ReminderItem] = []
    monthly_expenses: List[MonthlyExpense] = []

class ReportsAnalytics(BaseModel):
    total_vehicles: int
    total_fuel_cost: float
    total_service_cost: float
    total_maintenance_cost: float
    monthly_expenses: List[MonthlyExpense]
    vehicle_expenses: List[dict]
    mileage_trends: List[dict]
