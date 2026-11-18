from typing import List, Dict, Any, Optional
from datetime import date, datetime
from app.models import MileageHistoryItem, VehicleMileageSummary, ReminderItem

def calculate_fuel_cost(quantity: float, price_per_litre: float) -> float:
    """Calculate total fuel cost: Total Cost = Fuel Quantity × Price per Litre"""
    if quantity <= 0 or price_per_litre < 0:
        return 0.0
    return round(quantity * price_per_litre, 2)

def compute_mileage_for_vehicle(vehicle: Dict[str, Any], logs: List[Dict[str, Any]]) -> VehicleMileageSummary:
    """
    Calculates mileage using consecutive full-tank odometer readings and fuel consumed.
    Formula:
      Distance = Current Odometer - Previous Odometer
      Mileage = Distance / Current Refuel Quantity
    """
    # Sort logs chronologically and by odometer reading
    sorted_logs = sorted(
        logs,
        key=lambda x: (x.get("refuel_date", ""), float(x.get("odometer_reading", 0)))
    )

    history: List[MileageHistoryItem] = []
    valid_mileages: List[float] = []
    total_valid_distance = 0.0
    total_valid_fuel = 0.0
    total_overall_cost = 0.0

    for i, curr in enumerate(sorted_logs):
        fuel_qty = float(curr.get("fuel_quantity", 0))
        total_overall_cost += float(curr.get("total_cost", 0))
        curr_odo = float(curr.get("odometer_reading", 0))
        is_full = bool(curr.get("is_full_tank", True))

        if i == 0:
            # Baseline entry
            history.append(
                MileageHistoryItem(
                    log_id=str(curr.get("id")),
                    vehicle_id=str(vehicle.get("id")),
                    vehicle_name=vehicle.get("name", "Vehicle"),
                    refuel_date=str(curr.get("refuel_date")),
                    current_odometer=curr_odo,
                    previous_odometer=None,
                    distance_travelled=None,
                    fuel_consumed=fuel_qty,
                    mileage_kmpl=None,
                    is_full_tank=is_full,
                    status="First Entry (Baseline Odometer)",
                )
            )
            continue

        prev = sorted_logs[i - 1]
        prev_odo = float(prev.get("odometer_reading", 0))
        prev_is_full = bool(prev.get("is_full_tank", True))
        distance = curr_odo - prev_odo

        # Edge case validations
        if distance < 0:
            status = "Invalid: Decreasing Odometer"
            mileage = None
        elif fuel_qty <= 0:
            status = "Invalid: Zero/Negative Fuel"
            mileage = None
        elif not is_full or not prev_is_full:
            status = "Partial Tank: Mileage Skipped"
            mileage = None
        else:
            mileage = round(distance / fuel_qty, 2)
            status = "Valid (Full Tank)"
            valid_mileages.append(mileage)
            total_valid_distance += distance
            total_valid_fuel += fuel_qty

        history.append(
            MileageHistoryItem(
                log_id=str(curr.get("id")),
                vehicle_id=str(vehicle.get("id")),
                vehicle_name=vehicle.get("name", "Vehicle"),
                refuel_date=str(curr.get("refuel_date")),
                current_odometer=curr_odo,
                previous_odometer=prev_odo,
                distance_travelled=distance if distance >= 0 else None,
                fuel_consumed=fuel_qty,
                mileage_kmpl=mileage,
                is_full_tank=is_full,
                status=status,
            )
        )

    # Calculate overall aggregates
    latest_mileage = valid_mileages[-1] if valid_mileages else None
    avg_mileage = (
        round(total_valid_distance / total_valid_fuel, 2)
        if total_valid_fuel > 0
        else None
    )
    best_mileage = max(valid_mileages) if valid_mileages else None
    worst_mileage = min(valid_mileages) if valid_mileages else None

    explanation = (
        "Accurate fuel mileage calculation relies on consecutive full-tank refills. "
        "The distance travelled is calculated as (Current Odometer - Previous Odometer), "
        "and mileage equals Distance / Fuel Consumed. Partial refills and decreasing odometer "
        "readings are flagged and excluded to prevent skewed results."
    )

    # Return in reverse chronological order for recent display
    return VehicleMileageSummary(
        vehicle_id=str(vehicle.get("id")),
        vehicle_name=vehicle.get("name", "Vehicle"),
        registration_number=vehicle.get("registration_number", ""),
        latest_mileage=latest_mileage,
        average_mileage=avg_mileage,
        best_mileage=best_mileage,
        worst_mileage=worst_mileage,
        total_distance_tracked=round(total_valid_distance, 2),
        total_fuel_consumed=round(total_valid_fuel, 2),
        total_fuel_cost=round(total_overall_cost, 2),
        valid_calculation_count=len(valid_mileages),
        history=list(reversed(history)),
        explanation=explanation,
    )

def compute_service_reminders(
    vehicles: List[Dict[str, Any]],
    service_records: List[Dict[str, Any]],
    fuel_logs: List[Dict[str, Any]],
) -> List[ReminderItem]:
    """
    Generates intelligent reminders based on due dates and odometer readings.
    """
    today = date.today()
    reminders: List[ReminderItem] = []

    # Map current maximum odometer reading per vehicle
    current_odometer_map: Dict[str, float] = {}
    for v in vehicles:
        current_odometer_map[str(v.get("id"))] = 0.0

    for f in fuel_logs:
        vid = str(f.get("vehicle_id"))
        odo = float(f.get("odometer_reading") or 0)
        if vid in current_odometer_map:
            current_odometer_map[vid] = max(current_odometer_map[vid], odo)

    for s in service_records:
        vid = str(s.get("vehicle_id"))
        odo = float(s.get("odometer_reading") or 0)
        if vid in current_odometer_map:
            current_odometer_map[vid] = max(current_odometer_map[vid], odo)

    # Build vehicle lookup
    vehicle_map = {str(v.get("id")): v for v in vehicles}

    for s in service_records:
        due_date_str = s.get("next_service_due_date")
        due_odo = s.get("next_service_due_odometer")

        # Skip if neither due date nor due odometer is set
        if not due_date_str and due_odo is None:
            continue

        vid = str(s.get("vehicle_id"))
        vehicle = vehicle_map.get(vid)
        if not vehicle:
            continue

        current_odo = current_odometer_map.get(vid, 0.0)

        days_left: Optional[int] = None
        if due_date_str:
            try:
                due_date_obj = date.fromisoformat(str(due_date_str))
                days_left = (due_date_obj - today).days
            except Exception:
                days_left = None

        km_left: Optional[float] = None
        if due_odo is not None and float(due_odo) > 0:
            km_left = round(float(due_odo) - current_odo, 1)

        # Determine urgency status
        is_date_overdue = days_left is not None and days_left < 0
        is_odo_overdue = km_left is not None and km_left < 0

        is_date_soon = days_left is not None and 0 <= days_left <= 15
        is_odo_soon = km_left is not None and 0 <= km_left <= 500

        if is_date_overdue or is_odo_overdue:
            urgency = "urgent"
            alerts = []
            if is_date_overdue:
                alerts.append(f"Overdue by {abs(days_left)} days")
            if is_odo_overdue:
                alerts.append(f"Overdue by {abs(km_left)} km")
            alert_message = " & ".join(alerts)
        elif is_date_soon or is_odo_soon:
            urgency = "due_soon"
            alerts = []
            if is_date_soon:
                alerts.append(f"Due in {days_left} days")
            if is_odo_soon:
                alerts.append(f"Due in {km_left} km")
            alert_message = " & ".join(alerts)
        else:
            urgency = "normal"
            parts = []
            if days_left is not None:
                parts.append(f"{days_left} days left")
            if km_left is not None:
                parts.append(f"{km_left} km remaining")
            alert_message = ", ".join(parts) if parts else "Scheduled"

        reminders.append(
            ReminderItem(
                id=str(s.get("id")),
                vehicle_id=vid,
                vehicle_name=vehicle.get("name", "Vehicle"),
                registration_number=vehicle.get("registration_number", ""),
                service_type=s.get("service_type", "General Service"),
                service_date=str(s.get("service_date")),
                next_service_due_date=str(due_date_str) if due_date_str else None,
                next_service_due_odometer=float(due_odo) if due_odo is not None else None,
                current_odometer=current_odo,
                days_left=days_left,
                km_left=km_left,
                urgency=urgency,
                alert_message=alert_message,
            )
        )

    # Sort reminders: urgent first, then due_soon, then normal
    urgency_weight = {"urgent": 0, "due_soon": 1, "normal": 2, "completed": 3}
    reminders.sort(
        key=lambda r: (
            urgency_weight.get(r.urgency, 9),
            r.days_left if r.days_left is not None else 99999,
            r.km_left if r.km_left is not None else 99999,
        )
    )

    return reminders
