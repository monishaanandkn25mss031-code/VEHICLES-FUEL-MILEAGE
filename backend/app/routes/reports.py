from fastapi import APIRouter
from typing import List, Dict
from datetime import datetime
from collections import defaultdict
from app.database import db
from app.models import ReportsAnalytics, MonthlyExpense
from app.utils.calculations import compute_mileage_for_vehicle

router = APIRouter(prefix="/reports", tags=["Reports & Analytics"])

@router.get("/analytics", response_model=ReportsAnalytics)
def get_reports_analytics():
    """Retrieve comprehensive financial and performance analytics."""
    vehicles = db.get_vehicles()
    fuel_logs = db.get_fuel_logs()
    service_records = db.get_service_records()

    total_fuel = sum(float(l.get("total_cost", 0)) for l in fuel_logs)
    total_service = sum(float(s.get("service_cost", 0)) for s in service_records)
    total_maint = total_fuel + total_service

    # Monthly aggregation
    monthly_map: Dict[str, Dict[str, float]] = defaultdict(lambda: {"fuel": 0.0, "service": 0.0})
    for l in fuel_logs:
        d = l.get("refuel_date", "")
        if len(d) >= 7:
            monthly_map[d[:7]]["fuel"] += float(l.get("total_cost", 0))

    for s in service_records:
        d = s.get("service_date", "")
        if len(d) >= 7:
            monthly_map[d[:7]]["service"] += float(s.get("service_cost", 0))

    monthly_list: List[MonthlyExpense] = []
    for m in sorted(monthly_map.keys()):
        try:
            m_name = datetime.strptime(m, "%Y-%m").strftime("%b %Y")
        except Exception:
            m_name = m
        fc = round(monthly_map[m]["fuel"], 2)
        sc = round(monthly_map[m]["service"], 2)
        monthly_list.append(
            MonthlyExpense(
                month=m,
                month_name=m_name,
                fuel_expense=fc,
                service_expense=sc,
                total_expense=round(fc + sc, 2),
            )
        )

    # Per-vehicle expense distribution
    vehicle_expenses = []
    for v in vehicles:
        vid = str(v["id"])
        v_fuel = sum(float(l.get("total_cost", 0)) for l in fuel_logs if str(l.get("vehicle_id")) == vid)
        v_service = sum(float(s.get("service_cost", 0)) for s in service_records if str(s.get("vehicle_id")) == vid)
        vehicle_expenses.append({
            "vehicle_id": vid,
            "vehicle_name": v.get("name"),
            "registration_number": v.get("registration_number"),
            "vehicle_type": v.get("vehicle_type"),
            "fuel_cost": round(v_fuel, 2),
            "service_cost": round(v_service, 2),
            "total_cost": round(v_fuel + v_service, 2),
        })

    # Mileage trends over time
    mileage_trends = []
    for v in vehicles:
        vid = str(v["id"])
        v_logs = [l for l in fuel_logs if str(l.get("vehicle_id")) == vid]
        summary = compute_mileage_for_vehicle(v, v_logs)
        for h in summary.history:
            if h.mileage_kmpl is not None:
                mileage_trends.append({
                    "date": h.refuel_date,
                    "vehicle_name": v.get("name"),
                    "mileage_kmpl": h.mileage_kmpl,
                    "distance_km": h.distance_travelled,
                    "fuel_litres": h.fuel_consumed,
                })

    mileage_trends.sort(key=lambda x: x["date"])

    return ReportsAnalytics(
        total_vehicles=len(vehicles),
        total_fuel_cost=round(total_fuel, 2),
        total_service_cost=round(total_service, 2),
        total_maintenance_cost=round(total_maint, 2),
        monthly_expenses=monthly_list,
        vehicle_expenses=vehicle_expenses,
        mileage_trends=mileage_trends,
    )
