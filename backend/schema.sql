-- ============================================================
-- Vehicle Service & Fuel Mileage Logger
-- Supabase / PostgreSQL Schema Definition
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. VEHICLES TABLE
CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    registration_number VARCHAR(50) NOT NULL UNIQUE,
    vehicle_type VARCHAR(20) NOT NULL CHECK (vehicle_type IN ('Car', 'Bike', 'Truck', 'Other')),
    fuel_type VARCHAR(20) NOT NULL CHECK (fuel_type IN ('Petrol', 'Diesel', 'Electric', 'CNG', 'Hybrid', 'Other')),
    manufacturing_year INTEGER NOT NULL CHECK (manufacturing_year >= 1900 AND manufacturing_year <= 2100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. FUEL LOGS TABLE
CREATE TABLE IF NOT EXISTS fuel_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    refuel_date DATE NOT NULL,
    odometer_reading NUMERIC(10, 2) NOT NULL CHECK (odometer_reading >= 0),
    fuel_quantity NUMERIC(10, 2) NOT NULL CHECK (fuel_quantity > 0),
    price_per_litre NUMERIC(10, 2) NOT NULL CHECK (price_per_litre >= 0),
    total_cost NUMERIC(10, 2) NOT NULL CHECK (total_cost >= 0),
    is_full_tank BOOLEAN NOT NULL DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. SERVICE RECORDS TABLE
CREATE TABLE IF NOT EXISTS service_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    service_date DATE NOT NULL,
    odometer_reading NUMERIC(10, 2) NOT NULL CHECK (odometer_reading >= 0),
    service_type VARCHAR(100) NOT NULL,
    description TEXT,
    service_centre VARCHAR(150),
    service_cost NUMERIC(10, 2) NOT NULL CHECK (service_cost >= 0),
    next_service_due_date DATE,
    next_service_due_odometer NUMERIC(10, 2) CHECK (next_service_due_odometer IS NULL OR next_service_due_odometer >= odometer_reading),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. APP SETTINGS TABLE
CREATE TABLE IF NOT EXISTS app_settings (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'default',
    app_name VARCHAR(100) DEFAULT 'Vehicle Service & Fuel Mileage Logger',
    currency_symbol VARCHAR(10) DEFAULT '₹',
    currency_code VARCHAR(10) DEFAULT 'INR',
    distance_unit VARCHAR(10) DEFAULT 'km',
    fuel_unit VARCHAR(10) DEFAULT 'litres',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_vehicles_registration ON vehicles(registration_number);
CREATE INDEX IF NOT EXISTS idx_fuel_logs_vehicle_date ON fuel_logs(vehicle_id, refuel_date DESC);
CREATE INDEX IF NOT EXISTS idx_fuel_logs_vehicle_odometer ON fuel_logs(vehicle_id, odometer_reading ASC);
CREATE INDEX IF NOT EXISTS idx_service_records_vehicle_date ON service_records(vehicle_id, service_date DESC);
CREATE INDEX IF NOT EXISTS idx_service_records_due_date ON service_records(next_service_due_date);

-- Insert default settings row if not present
INSERT INTO app_settings (id, app_name, currency_symbol, currency_code, distance_unit, fuel_unit)
VALUES ('default', 'Vehicle Service & Fuel Mileage Logger', '₹', 'INR', 'km', 'litres')
ON CONFLICT (id) DO NOTHING;
