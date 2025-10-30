@echo off
echo Starting FMCSA HOS Tracker Frontend...
echo.

REM Check if node_modules exists
if not exist "node_modules\" (
    echo Installing npm dependencies...
    npm install
    echo.
)

REM Start React development server
echo Starting React development server...
echo Frontend will be available at: http://localhost:3000
echo.
npm start