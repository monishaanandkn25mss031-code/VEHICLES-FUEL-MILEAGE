@echo off
echo ===================================================
echo Starting Vehicle Service & Fuel Mileage Logger Frontend
echo ===================================================
cd /d %~dp0frontend
call npm.cmd run dev
pause
