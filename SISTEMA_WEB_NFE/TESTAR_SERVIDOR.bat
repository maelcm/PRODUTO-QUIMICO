@echo off
chcp 65001 >nul
title TESTAR SERVIDOR - Sistema Web NF-e

echo.
echo ═══════════════════════════════════════════════════════════════
echo   TESTANDO SERVIDOR
echo ═══════════════════════════════════════════════════════════════
echo.

cd /d "%~dp0"

echo Verificando se o servidor está rodando...
echo.

curl -s http://localhost:3001/health >nul 2>&1
if errorlevel 1 (
    echo ❌ Servidor NÃO está respondendo na porta 3001
    echo.
    echo Verifique:
    echo   1. O servidor está rodando? (Execute INICIAR_SISTEMA.bat)
    echo   2. Há erros no console do servidor?
    echo   3. O banco de dados está configurado corretamente?
    echo.
) else (
    echo ✅ Servidor está respondendo!
    echo.
    echo Testando endpoint de health check:
    curl http://localhost:3001/health
    echo.
    echo.
)

pause
