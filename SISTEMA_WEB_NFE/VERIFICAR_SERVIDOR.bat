@echo off
chcp 65001 >nul
title VERIFICAR SERVIDOR - Sistema Web NF-e

echo.
echo ═══════════════════════════════════════════════════════════════
echo   VERIFICANDO SE O SERVIDOR ESTÁ RODANDO
echo ═══════════════════════════════════════════════════════════════
echo.

echo Testando conexão com o servidor...
echo.

REM Testar health check
curl -s http://localhost:3001/health >nul 2>&1
if errorlevel 1 (
    echo ❌ Servidor NÃO está respondendo na porta 3001
    echo.
    echo O servidor backend não está rodando ou não está respondendo.
    echo.
    echo Verifique:
    echo   1. O servidor está rodando? (Execute INICIAR_SISTEMA.bat)
    echo   2. Há erros na janela do servidor?
    echo   3. A porta 3001 está livre?
    echo.
    pause
    exit /b 1
)

echo ✅ Servidor está respondendo!
echo.
echo Testando health check:
curl http://localhost:3001/health
echo.
echo.

pause
