@echo off
setlocal

cd /d "%~dp0"
set "PORT=8766"
set "DIST_DIR=dist-webapp"
set "ROOT_DIR=%CD%"
set "CHECK_ONLY=0"
if /I "%~1"=="--check" set "CHECK_ONLY=1"

echo ========================================
echo V1 WebApp runner
echo ========================================
echo.

where python >nul 2>nul
if errorlevel 1 (
  echo Python was not found. Please install Python 3.11+ and add it to PATH.
  pause
  exit /b 1
)

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js was not found. Please install Node.js and add it to PATH.
  pause
  exit /b 1
)

if not exist node_modules (
  echo Installing WebApp dependencies...
  call npm.cmd install
  if errorlevel 1 (
    echo npm install failed.
    pause
    exit /b 1
  )
)

if "%CHECK_ONLY%"=="0" (
  echo Cleaning stale WebApp processes...
  powershell -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference = 'Stop'; $root = '%ROOT_DIR%'; $ports = @(8766, 8000, 5173, 5174); $portPids = @(); try { $portPids = @(Get-NetTCPConnection -State Listen -LocalPort $ports -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique) } catch { $portPids = @() }; $processes = @(Get-CimInstance Win32_Process | Where-Object { $_.CommandLine }); $targets = @($processes | Where-Object { ($_.Name -eq 'python.exe' -and ($_.CommandLine -like '*tools\webapp_server.py*' -or $_.CommandLine -like '*tools\dev_webapp.py*')) -or ($_.Name -eq 'node.exe' -and $_.CommandLine -like ('*' + $root + '*node_modules*vite*')) -or (($portPids -contains $_.ProcessId) -and ($_.Name -eq 'python.exe' -or $_.Name -eq 'node.exe')) } | Sort-Object ProcessId -Unique); foreach ($p in $targets) { Write-Host ('Stopping PID ' + $p.ProcessId + ' ' + $p.Name); Stop-Process -Id $p.ProcessId -Force }"
  if errorlevel 1 (
    echo Failed to clean stale WebApp processes.
    pause
    exit /b 1
  )
)

echo Building WebApp...
set "VITE_OUT_DIR=%DIST_DIR%"
call npm.cmd run build
if errorlevel 1 (
  echo WebApp build failed.
  pause
  exit /b 1
)

if "%CHECK_ONLY%"=="1" (
  echo WebApp runner check passed.
  exit /b 0
)

echo Starting WebApp...
set "CACHE_BUST=%RANDOM%%RANDOM%%RANDOM%"
set "BROWSER_URL=http://127.0.0.1:%PORT%/?clear_cache=1&v=%CACHE_BUST%"
echo Browser URL: "%BROWSER_URL%"
start "" powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Sleep -Seconds 2; Start-Process '%BROWSER_URL%'"
python tools\webapp_server.py --port %PORT% --dist-dir "%DIST_DIR%"

endlocal
