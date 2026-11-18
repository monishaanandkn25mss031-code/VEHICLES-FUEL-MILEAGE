# Vehicle Service & Fuel Mileage Logger

A full-stack, beginner-friendly web application designed to help vehicle owners track fuel expenses, compute accurate fuel economy via the consecutive full-tank methodology, manage workshop service records, and receive timely maintenance reminders.

---

## 1. Key Features

- **Executive Telemetry Dashboard**:
  - Live KPI cards: Total registered vehicles, total fuel spent, verified fleet average mileage, total workshop spend, and combined maintenance expenses.
  - Interactive expenditure chart comparing monthly fuel costs vs service costs in ₹ (INR).
  - High-priority maintenance alert banner flagging upcoming or overdue services.
  - Recent fuel entries and service history quick tables.

- **Vehicle Management**:
  - Register, edit, and delete vehicles with license plate duplicate checks.
  - Fields: Vehicle Name, Brand, Model, Registration Number, Vehicle Type (Car / Bike / Truck / Other), Fuel Type (Petrol / Diesel / Electric / CNG / Hybrid / Other), Manufacturing Year.
  - Telemetry summary per vehicle card: current odometer, average mileage, total fuel cost, and total service cost.

- **Fuel Expense & Refuelling Tracker**:
  - Real-time cost calculation: `Total Cost = Fuel Quantity × Price per Litre`.
  - Full-tank toggle with clear validation and explanation.
  - Filter logs by selected vehicle or view fleet-wide history.
  - Complete edit and delete capabilities with toast notifications and confirmation dialogs.

- **Consecutive Full-Tank Mileage Calculator**:
  - Implementation of the automotive industry standard:
    $$\text{Distance} = \text{Current Odometer} - \text{Previous Odometer}$$
    $$\text{Mileage} = \frac{\text{Distance}}{\text{Current Fuel Quantity}}$$
  - Displays: Latest mileage, average mileage, best recorded mileage, and total tracked distance.
  - Chronological cycle history with status validation (`Valid (Full Tank)`, `First Entry (Baseline)`, `Partial Tank`, `Invalid Decreasing Odometer`).
  - Interactive "What-If" Mileage Simulator allowing drivers to test hypothetical odometer readings and fuel consumption before recording them.

- **Service & Workshop Management**:
  - Log periodic maintenance, oil changes, brake repairs, and workshop invoices.
  - Automated reminder engine: monitors current vehicle odometer and dates against `next_service_due_date` and `next_service_due_odometer`.
  - Flags records as `Overdue` or `Due Soon` (within 14 days or within 500 km).

- **Reports & Financial Analytics**:
  - Monthly fuel vs service expense comparison charts.
  - Mileage efficiency trend graph across refuelling runs.
  - Spending distribution breakdown by vehicle with progress indicators.

- **Localization & Settings**:
  - Currency display configured in Indian Rupees (₹ INR).
  - Units in kilometres (km) and litres (L).
  - Database connection status monitor reporting active engine and backend health.

---

## 2. Technology Stack

- **Frontend**:
  - React 18 (Vite)
  - Styling: Tailwind CSS (Custom Dark Navy `#0b1329` automotive design system)
  - Icons: Lucide React
  - Charts: Recharts (Responsive bar & line charts)
  - API Client: Axios
- **Backend**:
  - Python FastAPI (Fast, modern REST API with Pydantic validation)
  - Uvicorn (ASGI server)
  - Dual-mode database manager:
    - **Supabase (PostgreSQL)** when credentials are provided.
    - **Local SQLite** fallback with automatic schema creation and starter data so the application runs immediately without requiring remote accounts.
  - Swagger UI documentation available at `http://localhost:8000/docs`.

---

## 3. Project Directory Structure

```
project/
├── backend/
│   ├── app/
│   │   ├── routes/
│   │   │   ├── dashboard.py     # KPI stats, monthly chart data, reminders
│   │   │   ├── fuel_logs.py     # Fuel log CRUD & auto-cost calculation
│   │   │   ├── mileage.py       # Mileage summaries & what-if simulator
│   │   │   ├── reports.py       # Comprehensive analytics endpoints
│   │   │   ├── service.py       # Service records CRUD & reminder engine
│   │   │   ├── settings.py      # App settings & status checks
│   │   │   └── vehicles.py      # Vehicle CRUD & fleet summaries
│   │   ├── utils/
│   │   │   └── calculations.py  # Mileage formulas & reminder algorithms
│   │   ├── config.py            # Environment configuration & Supabase detector
│   │   ├── database.py          # Dual database manager (Supabase + SQLite fallback)
│   │   ├── models.py            # Pydantic schemas for data validation
│   │   └── main.py              # FastAPI application & CORS setup
│   ├── requirements.txt         # Python package dependencies
│   ├── .env.example             # Backend environment template
│   └── schema.sql               # PostgreSQL schema for Supabase
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ConfirmModal.jsx # Delete confirmation dialogs
│   │   │   ├── Loading.jsx      # Spinners & skeletons
│   │   │   ├── Modal.jsx        # Reusable modal container
│   │   │   ├── Navbar.jsx       # Top navigation & vehicle filter
│   │   │   ├── Sidebar.jsx      # Automotive sidebar with badges
│   │   │   ├── StatCard.jsx     # KPI metric display cards
│   │   │   └── Toast.jsx        # Toast alerts for feedback
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx    # Overview dashboard & charts
│   │   │   ├── FuelTracker.jsx  # Refuelling logs table & modal
│   │   │   ├── MileageCalc.jsx  # Mileage calculation & simulation
│   │   │   ├── Reports.jsx      # Analytics & trend graphs
│   │   │   ├── ServiceHistory.jsx # Service records & maintenance alerts
│   │   │   ├── Settings.jsx     # Units, currency & connection monitor
│   │   │   └── Vehicles.jsx     # Vehicle cards & add/edit modal
│   │   ├── services/
│   │   │   └── api.js           # Central Axios client
│   │   ├── App.jsx              # Application state & page switcher
│   │   ├── index.css            # Tailwind directives & glow effects
│   │   └── main.jsx             # React DOM root
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── .env.example
│
├── run_backend.bat              # One-click launcher for backend
├── run_frontend.bat             # One-click launcher for frontend
├── schema.sql                   # Standalone Supabase SQL setup script
└── README.md                    # Documentation & setup guide
```

---

## 4. Setup and Installation

### Prerequisites
- **Node.js**: v18 or higher (Detected: Node v24, npm v11)
- **Python**: 3.10+ (Detected: Python 3.13)

### Step 1: Backend Setup

1. Open a terminal and navigate to the `backend/` folder:
   ```sh
   cd backend
   ```
2. Install Python dependencies:
   ```sh
   python -m pip install -r requirements.txt
   ```
3. Start the FastAPI development server:
   ```sh
   python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```
   *The backend will start at `http://localhost:8000`. You can visit `http://localhost:8000/docs` to test all REST endpoints via the Swagger UI.*

### Step 2: Frontend Setup

1. Open a new terminal and navigate to the `frontend/` folder:
   ```sh
   cd frontend
   ```
2. Install Node dependencies (if not already installed):
   ```sh
   npm install
   ```
3. Start the Vite development server:
   ```sh
   npm run dev
   ```
   *The frontend dashboard will be available at `http://localhost:5173`.*

---

## 5. Supabase (PostgreSQL) Integration Guide

The backend includes a **Dual-Mode Database Manager**:
- **Offline / Local Mode**: Uses SQLite (`backend/local_vehicle_logger.db`) by default.
- **Supabase Cloud Mode**: Automatically engages whenever `SUPABASE_URL` and `SUPABASE_KEY` are provided in `backend/.env`.

### Setting Up Supabase:

1. Sign in to your [Supabase Dashboard](https://supabase.com).
2. Create a new project (e.g. `vehicle-logger`).
3. Open the **SQL Editor** in the Supabase navigation menu.
4. Open the [schema.sql](file:///C:/Users/rajvk/OneDrive/Documents/project/schema.sql) file from this repository, copy its contents, paste them into the SQL editor, and click **Run**.
5. Go to **Project Settings → API** in Supabase and copy:
   - **Project URL**
   - **Project API Anon Key**
6. Open `backend/.env` and update the variables:
   ```env
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_KEY=your-supabase-anon-key
   ```
7. Restart the FastAPI backend. The app will log:
   `[Database] Successfully connected to Supabase at https://your-project-id.supabase.co`

---

## 6. API Documentation

Interactive API documentation with request schemas and test runners is automatically available:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

### Primary Endpoints:
- `GET /api/vehicles` - List all vehicles with aggregated totals
- `POST /api/vehicles` - Register a vehicle
- `PUT /api/vehicles/{id}` - Update vehicle details
- `DELETE /api/vehicles/{id}` - Delete vehicle and cascade child logs
- `GET /api/fuel-logs` - Retrieve fuel logs (supports `?vehicle_id=`)
- `POST /api/fuel-logs` - Add fuel entry with automatic `Qty × Price` cost calculation
- `GET /api/mileage` - Summary of consecutive full-tank fuel mileage across vehicles
- `POST /api/mileage/simulate` - Interactive trip and efficiency calculator
- `GET /api/service-records` - Retrieve service history
- `GET /api/service-records/reminders` - Check upcoming & overdue service deadlines
- `GET /api/dashboard/stats` - High-level metrics, charts, and recent activities
- `GET /api/reports/analytics` - Financial and mileage analytics
- `GET /api/settings` & `PUT /api/settings` - Manage units and app title
- `GET /api/settings/status` - Database health and engine status
