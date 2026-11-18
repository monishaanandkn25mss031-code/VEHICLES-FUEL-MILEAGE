import os
import sqlite3
import uuid
from typing import List, Dict, Any, Optional
from datetime import datetime
from app.config import settings

# Attempt importing supabase client
try:
    from supabase import create_client, Client
    HAS_SUPABASE_LIB = True
except ImportError:
    HAS_SUPABASE_LIB = False
    Client = Any

class DatabaseManager:
    def __init__(self):
        self.mode: str = "sqlite"
        self.supabase_client: Optional[Client] = None
        self._init_connection()

    def _init_connection(self):
        if settings.is_supabase_configured and HAS_SUPABASE_LIB:
            try:
                self.supabase_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
                # Quick probe to test connection
                self.supabase_client.table("app_settings").select("id").limit(1).execute()
                self.mode = "supabase"
                print(f"[Database] Successfully connected to Supabase at {settings.SUPABASE_URL}")
                return
            except Exception as e:
                print(f"[Database] Notice: Supabase connection failed ({e}). Defaulting to local SQLite database.")
        
        self.mode = "sqlite"
        self._init_sqlite()
        print(f"[Database] Operating in SQLite mode: {settings.LOCAL_DB_PATH}")

    def _get_sqlite_conn(self) -> sqlite3.Connection:
        conn = sqlite3.connect(str(settings.LOCAL_DB_PATH))
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON;")
        return conn

    def _init_sqlite(self):
        """Create SQLite tables if they do not exist."""
        with self._get_sqlite_conn() as conn:
            cursor = conn.cursor()
            # Vehicles table
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS vehicles (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                brand TEXT NOT NULL,
                model TEXT NOT NULL,
                registration_number TEXT UNIQUE NOT NULL,
                vehicle_type TEXT NOT NULL,
                fuel_type TEXT NOT NULL,
                manufacturing_year INTEGER NOT NULL,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            );
            """)

            # Fuel logs table
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS fuel_logs (
                id TEXT PRIMARY KEY,
                vehicle_id TEXT NOT NULL,
                refuel_date TEXT NOT NULL,
                odometer_reading REAL NOT NULL,
                fuel_quantity REAL NOT NULL,
                price_per_litre REAL NOT NULL,
                total_cost REAL NOT NULL,
                is_full_tank INTEGER NOT NULL DEFAULT 1,
                notes TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
            );
            """)

            # Service records table
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS service_records (
                id TEXT PRIMARY KEY,
                vehicle_id TEXT NOT NULL,
                service_date TEXT NOT NULL,
                odometer_reading REAL NOT NULL,
                service_type TEXT NOT NULL,
                description TEXT,
                service_centre TEXT,
                service_cost REAL NOT NULL,
                next_service_due_date TEXT,
                next_service_due_odometer REAL,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
            );
            """)

            # App settings table
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS app_settings (
                id TEXT PRIMARY KEY,
                app_name TEXT DEFAULT 'Vehicle Service & Fuel Mileage Logger',
                currency_symbol TEXT DEFAULT '₹',
                currency_code TEXT DEFAULT 'INR',
                distance_unit TEXT DEFAULT 'km',
                fuel_unit TEXT DEFAULT 'litres',
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            );
            """)

            # Seed default app settings
            cursor.execute("SELECT id FROM app_settings WHERE id = 'default'")
            if not cursor.fetchone():
                cursor.execute("""
                INSERT INTO app_settings (id, app_name, currency_symbol, currency_code, distance_unit, fuel_unit)
                VALUES ('default', 'Vehicle Service & Fuel Mileage Logger', '₹', 'INR', 'km', 'litres')
                """)

            # Check if any vehicle exists; if empty, insert starter vehicle for easy demo
            cursor.execute("SELECT count(*) as count FROM vehicles")
            if cursor.fetchone()["count"] == 0:
                self._seed_initial_demo_data(cursor)

            conn.commit()

    def _seed_initial_demo_data(self, cursor: sqlite3.Cursor):
        """Seed sample vehicle and entries to show initial calculations and graphs."""
        v1_id = str(uuid.uuid4())
        v2_id = str(uuid.uuid4())

        cursor.execute("""
        INSERT INTO vehicles (id, name, brand, model, registration_number, vehicle_type, fuel_type, manufacturing_year)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (v1_id, "City Cruiser", "Honda", "City ZX", "KA-01-MJ-5501", "Car", "Petrol", 2023))

        cursor.execute("""
        INSERT INTO vehicles (id, name, brand, model, registration_number, vehicle_type, fuel_type, manufacturing_year)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (v2_id, "Daily Commuter", "TVS", "Jupiter 125", "KA-05-EX-9922", "Bike", "Petrol", 2022))

        # Sample fuel logs for Honda City (Consecutive full tanks to demonstrate mileage calculation)
        logs = [
            (str(uuid.uuid4()), v1_id, "2026-09-01", 12500.0, 35.0, 102.50, 3587.50, 1, "First baseline fill up"),
            (str(uuid.uuid4()), v1_id, "2026-09-18", 13020.0, 32.5, 103.00, 3347.50, 1, "Highway trip refill (520km on 32.5L = 16.0 km/l)"),
            (str(uuid.uuid4()), v1_id, "2026-10-05", 13515.0, 31.0, 102.80, 3186.80, 1, "City commute (495km on 31.0L = 15.97 km/l)"),
            (str(uuid.uuid4()), v1_id, "2026-10-25", 14060.0, 33.0, 103.20, 3405.60, 1, "Festival run (545km on 33.0L = 16.52 km/l)"),
            (str(uuid.uuid4()), v2_id, "2026-10-10", 4200.0, 5.0, 102.50, 512.50, 1, "Scooter tankful"),
            (str(uuid.uuid4()), v2_id, "2026-10-28", 4425.0, 4.8, 103.00, 494.40, 1, "Monthly refuel (225km on 4.8L = 46.88 km/l)"),
        ]
        for log in logs:
            cursor.execute("""
            INSERT INTO fuel_logs (id, vehicle_id, refuel_date, odometer_reading, fuel_quantity, price_per_litre, total_cost, is_full_tank, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, log)

        # Sample service records
        services = [
            (str(uuid.uuid4()), v1_id, "2026-06-15", 10000.0, "Periodic Maintenance", "Engine oil, oil filter, wheel alignment", "Honda Authorized Service Center", 4850.0, "2026-12-15", 20000.0),
            (str(uuid.uuid4()), v2_id, "2026-07-20", 3500.0, "Standard 2nd Service", "Engine oil change and brake adjustment", "TVS Service Point", 850.0, "2026-11-25", 5000.0),
        ]
        for s in services:
            cursor.execute("""
            INSERT INTO service_records (id, vehicle_id, service_date, odometer_reading, service_type, description, service_centre, service_cost, next_service_due_date, next_service_due_odometer)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, s)

    # -------------------------------------------------------------
    # VEHICLES
    # -------------------------------------------------------------
    def get_vehicles(self) -> List[Dict[str, Any]]:
        if self.mode == "supabase" and self.supabase_client:
            res = self.supabase_client.table("vehicles").select("*").order("created_at", desc=False).execute()
            return res.data or []
        else:
            with self._get_sqlite_conn() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM vehicles ORDER BY created_at ASC")
                return [dict(row) for row in cursor.fetchall()]

    def get_vehicle(self, vehicle_id: str) -> Optional[Dict[str, Any]]:
        if self.mode == "supabase" and self.supabase_client:
            res = self.supabase_client.table("vehicles").select("*").eq("id", vehicle_id).execute()
            return res.data[0] if res.data else None
        else:
            with self._get_sqlite_conn() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM vehicles WHERE id = ?", (vehicle_id,))
                row = cursor.fetchone()
                return dict(row) if row else None

    def get_vehicle_by_registration(self, reg_no: str, exclude_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        clean_reg = reg_no.strip().upper()
        if self.mode == "supabase" and self.supabase_client:
            query = self.supabase_client.table("vehicles").select("*").ilike("registration_number", clean_reg)
            if exclude_id:
                query = query.neq("id", exclude_id)
            res = query.execute()
            return res.data[0] if res.data else None
        else:
            with self._get_sqlite_conn() as conn:
                cursor = conn.cursor()
                if exclude_id:
                    cursor.execute("SELECT * FROM vehicles WHERE UPPER(registration_number) = ? AND id != ?", (clean_reg, exclude_id))
                else:
                    cursor.execute("SELECT * FROM vehicles WHERE UPPER(registration_number) = ?", (clean_reg,))
                row = cursor.fetchone()
                return dict(row) if row else None

    def create_vehicle(self, data: Dict[str, Any]) -> Dict[str, Any]:
        vehicle_id = data.get("id") or str(uuid.uuid4())
        data["id"] = vehicle_id
        data["registration_number"] = data["registration_number"].strip().upper()
        now = datetime.now().isoformat()
        data["created_at"] = now
        data["updated_at"] = now

        if self.mode == "supabase" and self.supabase_client:
            res = self.supabase_client.table("vehicles").insert(data).execute()
            return res.data[0] if res.data else data
        else:
            with self._get_sqlite_conn() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                INSERT INTO vehicles (id, name, brand, model, registration_number, vehicle_type, fuel_type, manufacturing_year, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    data["id"], data["name"], data["brand"], data["model"],
                    data["registration_number"], data["vehicle_type"], data["fuel_type"],
                    data["manufacturing_year"], data["created_at"], data["updated_at"]
                ))
                conn.commit()
                return data

    def update_vehicle(self, vehicle_id: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        data["updated_at"] = datetime.now().isoformat()
        if "registration_number" in data and data["registration_number"]:
            data["registration_number"] = data["registration_number"].strip().upper()

        if self.mode == "supabase" and self.supabase_client:
            res = self.supabase_client.table("vehicles").update(data).eq("id", vehicle_id).execute()
            return res.data[0] if res.data else None
        else:
            with self._get_sqlite_conn() as conn:
                cursor = conn.cursor()
                fields = [f"{k} = ?" for k in data.keys()]
                values = list(data.values()) + [vehicle_id]
                cursor.execute(f"UPDATE vehicles SET {', '.join(fields)} WHERE id = ?", values)
                conn.commit()
                return self.get_vehicle(vehicle_id)

    def delete_vehicle(self, vehicle_id: str) -> bool:
        if self.mode == "supabase" and self.supabase_client:
            res = self.supabase_client.table("vehicles").delete().eq("id", vehicle_id).execute()
            return bool(res.data)
        else:
            with self._get_sqlite_conn() as conn:
                cursor = conn.cursor()
                # SQLite cascade handles child rows when foreign_keys enabled
                cursor.execute("DELETE FROM vehicles WHERE id = ?", (vehicle_id,))
                conn.commit()
                return cursor.rowcount > 0

    # -------------------------------------------------------------
    # FUEL LOGS
    # -------------------------------------------------------------
    def get_fuel_logs(self, vehicle_id: Optional[str] = None) -> List[Dict[str, Any]]:
        if self.mode == "supabase" and self.supabase_client:
            query = self.supabase_client.table("fuel_logs").select("*")
            if vehicle_id:
                query = query.eq("vehicle_id", vehicle_id)
            res = query.order("refuel_date", desc=True).execute()
            return res.data or []
        else:
            with self._get_sqlite_conn() as conn:
                cursor = conn.cursor()
                if vehicle_id:
                    cursor.execute("SELECT * FROM fuel_logs WHERE vehicle_id = ? ORDER BY refuel_date DESC, odometer_reading DESC", (vehicle_id,))
                else:
                    cursor.execute("SELECT * FROM fuel_logs ORDER BY refuel_date DESC, odometer_reading DESC")
                rows = cursor.fetchall()
                result = []
                for r in rows:
                    item = dict(r)
                    item["is_full_tank"] = bool(item["is_full_tank"])
                    result.append(item)
                return result

    def get_fuel_log(self, log_id: str) -> Optional[Dict[str, Any]]:
        if self.mode == "supabase" and self.supabase_client:
            res = self.supabase_client.table("fuel_logs").select("*").eq("id", log_id).execute()
            return res.data[0] if res.data else None
        else:
            with self._get_sqlite_conn() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM fuel_logs WHERE id = ?", (log_id,))
                row = cursor.fetchone()
                if row:
                    item = dict(row)
                    item["is_full_tank"] = bool(item["is_full_tank"])
                    return item
                return None

    def create_fuel_log(self, data: Dict[str, Any]) -> Dict[str, Any]:
        log_id = data.get("id") or str(uuid.uuid4())
        data["id"] = log_id
        data["created_at"] = datetime.now().isoformat()
        # Guarantee cost calculation
        qty = float(data.get("fuel_quantity", 0))
        price = float(data.get("price_per_litre", 0))
        if "total_cost" not in data or data["total_cost"] is None or float(data["total_cost"]) <= 0:
            data["total_cost"] = round(qty * price, 2)
        else:
            data["total_cost"] = round(float(data["total_cost"]), 2)

        if self.mode == "supabase" and self.supabase_client:
            res = self.supabase_client.table("fuel_logs").insert(data).execute()
            return res.data[0] if res.data else data
        else:
            with self._get_sqlite_conn() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                INSERT INTO fuel_logs (id, vehicle_id, refuel_date, odometer_reading, fuel_quantity, price_per_litre, total_cost, is_full_tank, notes, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    data["id"], data["vehicle_id"], data["refuel_date"],
                    data["odometer_reading"], data["fuel_quantity"], data["price_per_litre"],
                    data["total_cost"], 1 if data.get("is_full_tank", True) else 0,
                    data.get("notes"), data["created_at"]
                ))
                conn.commit()
                return data

    def update_fuel_log(self, log_id: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        # Re-evaluate total cost if quantity or price changed
        if "fuel_quantity" in data or "price_per_litre" in data:
            current = self.get_fuel_log(log_id)
            if current:
                qty = float(data.get("fuel_quantity", current["fuel_quantity"]))
                price = float(data.get("price_per_litre", current["price_per_litre"]))
                data["total_cost"] = round(qty * price, 2)

        if self.mode == "supabase" and self.supabase_client:
            res = self.supabase_client.table("fuel_logs").update(data).eq("id", log_id).execute()
            return res.data[0] if res.data else None
        else:
            with self._get_sqlite_conn() as conn:
                cursor = conn.cursor()
                if "is_full_tank" in data:
                    data["is_full_tank"] = 1 if data["is_full_tank"] else 0
                fields = [f"{k} = ?" for k in data.keys()]
                values = list(data.values()) + [log_id]
                cursor.execute(f"UPDATE fuel_logs SET {', '.join(fields)} WHERE id = ?", values)
                conn.commit()
                return self.get_fuel_log(log_id)

    def delete_fuel_log(self, log_id: str) -> bool:
        if self.mode == "supabase" and self.supabase_client:
            res = self.supabase_client.table("fuel_logs").delete().eq("id", log_id).execute()
            return bool(res.data)
        else:
            with self._get_sqlite_conn() as conn:
                cursor = conn.cursor()
                cursor.execute("DELETE FROM fuel_logs WHERE id = ?", (log_id,))
                conn.commit()
                return cursor.rowcount > 0

    # -------------------------------------------------------------
    # SERVICE RECORDS
    # -------------------------------------------------------------
    def get_service_records(self, vehicle_id: Optional[str] = None) -> List[Dict[str, Any]]:
        if self.mode == "supabase" and self.supabase_client:
            query = self.supabase_client.table("service_records").select("*")
            if vehicle_id:
                query = query.eq("vehicle_id", vehicle_id)
            res = query.order("service_date", desc=True).execute()
            return res.data or []
        else:
            with self._get_sqlite_conn() as conn:
                cursor = conn.cursor()
                if vehicle_id:
                    cursor.execute("SELECT * FROM service_records WHERE vehicle_id = ? ORDER BY service_date DESC, odometer_reading DESC", (vehicle_id,))
                else:
                    cursor.execute("SELECT * FROM service_records ORDER BY service_date DESC, odometer_reading DESC")
                return [dict(r) for r in cursor.fetchall()]

    def get_service_record(self, record_id: str) -> Optional[Dict[str, Any]]:
        if self.mode == "supabase" and self.supabase_client:
            res = self.supabase_client.table("service_records").select("*").eq("id", record_id).execute()
            return res.data[0] if res.data else None
        else:
            with self._get_sqlite_conn() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM service_records WHERE id = ?", (record_id,))
                row = cursor.fetchone()
                return dict(row) if row else None

    def create_service_record(self, data: Dict[str, Any]) -> Dict[str, Any]:
        record_id = data.get("id") or str(uuid.uuid4())
        data["id"] = record_id
        data["created_at"] = datetime.now().isoformat()
        data["service_cost"] = round(float(data.get("service_cost", 0)), 2)

        if self.mode == "supabase" and self.supabase_client:
            res = self.supabase_client.table("service_records").insert(data).execute()
            return res.data[0] if res.data else data
        else:
            with self._get_sqlite_conn() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                INSERT INTO service_records (id, vehicle_id, service_date, odometer_reading, service_type, description, service_centre, service_cost, next_service_due_date, next_service_due_odometer, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    data["id"], data["vehicle_id"], data["service_date"],
                    data["odometer_reading"], data["service_type"], data.get("description"),
                    data.get("service_centre"), data["service_cost"],
                    data.get("next_service_due_date"), data.get("next_service_due_odometer"),
                    data["created_at"]
                ))
                conn.commit()
                return data

    def update_service_record(self, record_id: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        if "service_cost" in data and data["service_cost"] is not None:
            data["service_cost"] = round(float(data["service_cost"]), 2)

        if self.mode == "supabase" and self.supabase_client:
            res = self.supabase_client.table("service_records").update(data).eq("id", record_id).execute()
            return res.data[0] if res.data else None
        else:
            with self._get_sqlite_conn() as conn:
                cursor = conn.cursor()
                fields = [f"{k} = ?" for k in data.keys()]
                values = list(data.values()) + [record_id]
                cursor.execute(f"UPDATE service_records SET {', '.join(fields)} WHERE id = ?", values)
                conn.commit()
                return self.get_service_record(record_id)

    def delete_service_record(self, record_id: str) -> bool:
        if self.mode == "supabase" and self.supabase_client:
            res = self.supabase_client.table("service_records").delete().eq("id", record_id).execute()
            return bool(res.data)
        else:
            with self._get_sqlite_conn() as conn:
                cursor = conn.cursor()
                cursor.execute("DELETE FROM service_records WHERE id = ?", (record_id,))
                conn.commit()
                return cursor.rowcount > 0

    # -------------------------------------------------------------
    # APP SETTINGS
    # -------------------------------------------------------------
    def get_settings(self) -> Dict[str, Any]:
        default_settings = {
            "id": "default",
            "app_name": "Vehicle Service & Fuel Mileage Logger",
            "currency_symbol": settings.DEFAULT_CURRENCY_SYMBOL,
            "currency_code": settings.DEFAULT_CURRENCY_CODE,
            "distance_unit": settings.DEFAULT_DISTANCE_UNIT,
            "fuel_unit": settings.DEFAULT_FUEL_UNIT,
        }
        if self.mode == "supabase" and self.supabase_client:
            try:
                res = self.supabase_client.table("app_settings").select("*").eq("id", "default").execute()
                if res.data:
                    return res.data[0]
            except Exception:
                pass
            return default_settings
        else:
            with self._get_sqlite_conn() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM app_settings WHERE id = 'default'")
                row = cursor.fetchone()
                return dict(row) if row else default_settings

    def update_settings(self, data: Dict[str, Any]) -> Dict[str, Any]:
        data["updated_at"] = datetime.now().isoformat()
        if self.mode == "supabase" and self.supabase_client:
            res = self.supabase_client.table("app_settings").upsert({"id": "default", **data}).execute()
            return res.data[0] if res.data else self.get_settings()
        else:
            with self._get_sqlite_conn() as conn:
                cursor = conn.cursor()
                fields = [f"{k} = ?" for k in data.keys()]
                values = list(data.values())
                cursor.execute(f"UPDATE app_settings SET {', '.join(fields)} WHERE id = 'default'", values)
                conn.commit()
                return self.get_settings()

    def get_database_status(self) -> Dict[str, Any]:
        return {
            "engine": "Supabase (PostgreSQL)" if self.mode == "supabase" else "Local SQLite (Development Fallback)",
            "mode": self.mode,
            "supabase_configured": settings.is_supabase_configured,
            "url": settings.SUPABASE_URL if settings.is_supabase_configured else "Not Configured",
            "status": "Online and Operational",
        }

db = DatabaseManager()
