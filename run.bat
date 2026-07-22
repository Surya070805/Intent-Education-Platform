@echo off
echo Starting Bloom Intent Education Platform...

echo Starting Backend Server...
start cmd /k "call .venv\Scripts\activate.bat && cd backend && uvicorn main:app --reload"

echo Starting Frontend Web App...
start cmd /k "cd web && npm run dev"

echo Both servers are starting up in separate windows!
echo You can view the web app at http://localhost:5173
