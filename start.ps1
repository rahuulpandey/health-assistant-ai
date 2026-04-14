# NIDAN.ai - Startup Script
# Run this file to start both frontend and backend

# =============================================
# REPLACE THESE VALUES WITH YOUR ACTUAL KEYS
# =============================================
$DATABASE_URL = "postgresql://neondb_owner:npg_jew6R5dumyPh@ep-old-base-a1l8s8z4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
$GEMINI_API_KEY = "AIzaSyCV_Nsd15HpvKktyZxzlgUUUSmKyS-dI1Y"
$CLERK_SECRET_KEY = "sk_test_F8Rdr8OO8f9dYb14Y7wohMUPMWHkfNfQq6LZjd9KGO"
CLERK_PUBLISHABLE_KEY=pk_test_dmFzdC1hYXJkdmFyay02Ni5jbGVyay5hY2NvdW50cy5kZXYk
# =============================================

Write-Host "Starting NIDAN.ai..." -ForegroundColor Cyan

# Start Backend in a new PowerShell window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "
  cd '$PSScriptRoot';
  `$env:DATABASE_URL='$DATABASE_URL';
  `$env:AI_INTEGRATIONS_GEMINI_API_KEY='$GEMINI_API_KEY';
  `$env:AI_INTEGRATIONS_GEMINI_BASE_URL='https://generativelanguage.googleapis.com/v1beta';
  `$env:CLERK_SECRET_KEY='$CLERK_SECRET_KEY';
  `$env:PORT='3001';
  Write-Host 'Starting Backend on port 3001...' -ForegroundColor Green;
  pnpm --filter @workspace/api-server run dev
"

# Wait a moment before starting frontend
Start-Sleep -Seconds 2

# Start Frontend in a new PowerShell window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "
  cd '$PSScriptRoot';
  `$env:PORT='3000';
  `$env:BASE_PATH='/';
  Write-Host 'Starting Frontend on port 3000...' -ForegroundColor Green;
  pnpm --filter @workspace/nidan-ai run dev
"

Write-Host "Both servers starting!" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Yellow
Write-Host "Backend:  http://localhost:3001" -ForegroundColor Yellow