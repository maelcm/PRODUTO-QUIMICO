@echo off
chcp 65001 >nul
title VERIFICAR BANCO DE DADOS - Sistema Web NF-e

echo.
echo ═══════════════════════════════════════════════════════════════
echo   VERIFICANDO CONEXÃO COM BANCO DE DADOS
echo ═══════════════════════════════════════════════════════════════
echo.

echo Verificando se o servidor está rodando...
echo.

curl -s http://localhost:3001/health >nul 2>&1
if errorlevel 1 (
    echo ❌ Servidor não está rodando na porta 3001
    echo.
    echo Por favor:
    echo   1. Execute INICIAR_SISTEMA.bat primeiro
    echo   2. Aguarde o servidor iniciar completamente
    echo   3. Execute este script novamente
    echo.
    pause
    exit /b 1
)

echo ✅ Servidor está rodando
echo.
echo Testando conexão com banco de dados...
echo.

curl -s http://localhost:3001/test-db
echo.
echo.

pause
