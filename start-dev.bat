@echo off
echo Starting Gemini Live API Demo...

echo.
echo Installing backend dependencies...
cd /d "%~dp0"
if not exist node_modules (
    echo Installing frontend dependencies...
    npm install
)

echo.
echo Installing backend dependencies...
if not exist backend-node_modules (
    echo Creating backend package.json...
    copy backend-package.json package-backend.json
    npm install --prefix backend-temp @google/genai express ws cors multer mime uuid dotenv @types/node @types/express @types/ws @types/cors @types/multer @types/uuid tsx typescript
    mkdir backend-node_modules
    xcopy /E /I backend-temp\node_modules backend-node_modules
    rmdir /S /Q backend-temp
)

echo.
echo Setting up environment...
if not exist .env (
    copy .env.example .env
    echo Please edit .env file with your GEMINI_API_KEY
    pause
)

echo.
echo Starting backend server...
start "Backend Server" cmd /k "set NODE_PATH=backend-node_modules && npx tsx server.ts"

echo.
echo Waiting for backend to start...
timeout /t 3 /nobreak > nul

echo.
echo Starting frontend development server...
start "Frontend Server" cmd /k "npm run dev"

echo.
echo Both servers are starting...
echo Frontend: http://localhost:5173
echo Backend: http://localhost:3001
echo Gemini Live Demo: http://localhost:5173/gemini-live
echo.
pause