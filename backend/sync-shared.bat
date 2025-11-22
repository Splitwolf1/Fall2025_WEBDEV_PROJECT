@echo off
REM Sync shared modules to all services
REM Run this script whenever you update files in backend\shared\

echo Syncing shared modules to all services...

for %%s in (order-service user-service product-service health-service delivery-service notification-service chatbot-service) do (
  echo   Copying to %%s...
  if not exist "services\%%s\shared" mkdir "services\%%s\shared"
  copy /Y "shared\*.ts" "services\%%s\shared\" >nul
)

echo.
echo All shared modules synced successfully!
echo.
echo Files synced:
dir /B shared\*.ts
