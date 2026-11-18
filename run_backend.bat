@echo off
echo ===================================================
echo Starting Vehicle Service & Fuel Mileage Logger Backend
echo ===================================================
cd /d %~dp0backend
"%LOCALAPPDATA%\Programs\Python\Python313\python.exe" -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
pause
