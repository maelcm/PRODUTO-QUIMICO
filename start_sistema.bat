@echo off
setlocal

REM Inicia todo o sistema com um clique:
REM - Backend (Node)
REM - Frontend (Vite)
REM - API OCR (Python)

cd /d "%~dp0"

echo ========================================
echo Iniciando Sistema Web NF-e
echo ========================================
echo.

REM Backend
start "Backend" cmd /k "cd /d \"%~dp0SISTEMA_WEB_NFE\server\" && npm run dev"

REM Frontend
start "Frontend" cmd /k "cd /d \"%~dp0SISTEMA_WEB_NFE\client\" && npm run dev -- --host 0.0.0.0 --port 5173"

REM OCR API (se existir)
if exist "%~dp0api_ocr\start_api.bat" (
  start "OCR API" cmd /k "cd /d \"%~dp0api_ocr\" && start_api.bat"
) else (
  echo Aviso: api_ocr\start_api.bat nao encontrado. OCR nao sera iniciado.
)

REM Abrir no navegador
timeout /t 5 >nul
start http://localhost:5173

echo.
echo Tudo iniciado. Se der firewall, permita o acesso.
echo.
endlocal
