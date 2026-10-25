@echo off
echo ============================================================
echo   Starting RescuePath: Adaptive Ambulance Routing Platform
echo ============================================================

set ROOT=%~dp0

echo 1. Starting Python FastAPI Routing Service on port 8000...
start "RescuePath - Python Routing Service (Port 8000)" cmd /k "cd /d %ROOT%\routing_service && python main.py"

echo 2. Starting Node.js API Gateway on port 5000...
start "RescuePath - Node.js API Gateway (Port 5000)" cmd /k "cd /d %ROOT%\backend && npm start"

echo 3. Starting React Vite Frontend on port 3000...
start "RescuePath - Frontend Client (Port 3000)" cmd /k "cd /d %ROOT%\frontend && npm run dev"

echo.
echo All services launched!
echo Access the application in your browser at: http://localhost:3000
echo Routing Service API documentation at: http://localhost:8000/docs
echo Backend Gateway health check at: http://localhost:5000/api/health
echo ============================================================
pause
