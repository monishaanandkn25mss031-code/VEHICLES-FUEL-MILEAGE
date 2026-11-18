from fastapi import APIRouter
from typing import List, Dict
from datetime import datetime
from collections import defaultdict
from app.database import db
from app.models import DashboardStats, MonthlyExpense, FuelLogResponse, ServiceRecordResponse
from app.utils.calculations import compute_mileage_for_vehicle, compute_service_reminders

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/stats", response_model=DashboardStats)
def get_dashboard_statistics():
    """Retrieve all high-level KPI cards, recent activities, reminders, and monthly expenses."""
    vehicles = db.get_vehicles()
    fuel_logs = db.get_fuel_logs()
    service_records = db.get_service_records()

    total_vehicles = len(vehicles)
    total_fuel_expenses = sum(float(l.get("total_cost", 0)) for l in fuel_logs)
    total_service_expenses = sum(float(s.get("service_cost", 0)) for s in service_records)
    total_overall_expenses = total_fuel_expenses + total_service_expenses

    # Compute overall fleet average mileage across valid calculations
    valid_mileages = []
    for v in vehicles:
        vid = str(v["id"])
        v_logs = [l for l in fuel_logs if str(l.get("vehicle_id")) == vid]
        summary = compute_mileage_for_vehicle(v, v_logs)
        if summary.average_mileage is not None:
            valid_mileages.append(summary.average_mileage)

    average_mileage = (
        round(sum(valid_mileages) / len(valid_mileages), 2)
        if valid_mileages
        else None
    )

    # Monthly breakdown for chart
    monthly_data: Dict[str, Dict[str, float]] = defaultdict(lambda: {"fuel": 0.0, "service": 0.0})

    for l in fuel_logs:
        refuel_date = l.get("refuel_date", "")
        if len(refuel_date) >= 7:
            month_key = refuel_date[:7]  # "YYYY-MM"
            monthly_data[month_key]["fuel"] += float(l.get("total_cost", 0))

    for s in service_records:
        service_date = s.get("service_date", "")
        if len(service_date) >= 7:
            month_key = service_date[:7]  # "YYYY-MM"
            monthly_data[month_key]["service"] += float(s.get("service_cost", 0))

    monthly_expenses_list: List[MonthlyExpense] = []
    # Sort months chronologically
    for m in sorted(monthly_data.keys()):
        try:
            m_date = datetime.strptime(m, "%Y-%m")
            m_name = m_date.strftime("%b %Y")
        except Exception:
            m_name = m

        fuel_cost = round(monthly_data[m]["fuel"], 2)
        service_cost = round(monthly_data[m]["service"], 2)
        monthly_expenses_list.append(
            MonthlyExpense(
                month=m,
                month_name=m_name,
                fuel_expense=fuel_cost,
                service_expense=service_cost,
                total_expense=round(fuel_cost + service_cost, 2),
            )
        )

    # Vehicle lookup for attaching names
    v_map = {str(v["id"]): v.get("name", "Vehicle") for v in vehicles}

    # Recent fuel entries (top 5)
    recent_fuel = []
    for l in fuel_logs[:5]:
        item = dict(l)
        item["vehicle_name"] = v_map.get(str(l.get("vehicle_id")), "Vehicle")
        recent_fuel.append(item)

    # Recent service records (top 5)
    recent_service = []
    for s in service_records[:5]:
        item = dict(s)
        item["vehicle_name"] = v_map.get(str(s.get("vehicle_id")), "Vehicle")
        recent_service.append(item)

    # Reminders
    reminders = compute_service_reminders(vehicles, service_records, fuel_logs)

    return DashboardStats(
        total_vehicles=total_vehicles,
        total_fuel_expenses=round(total_fuel_expenses, 2),
        average_fuel_mileage=average_mileage,
        total_service_expenses=round(total_service_expenses, 2),
        total_overall_expenses=round(total_overall_expenses, 2),
        recent_fuel_entries=recent_fuel,
        recent_service_records=recent_service,
        upcoming_reminders=reminders,
        monthly_expenses=monthly_expenses_list,
    )
