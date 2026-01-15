@echo off
chcp 65001 >nul
title INSTALAR DEPENDÊNCIAS - Sistema Web NF-e

echo.
echo ═══════════════════════════════════════════════════════════════
echo   INSTALANDO DEPENDÊNCIAS DO SISTEMA
echo ═══════════════════════════════════════════════════════════════
echo.

cd /d "%~dp0"

echo [1/3] Instalando dependências do servidor...
cd server
call npm install
if errorlevel 1 (
    echo.
    echo ❌ ERRO ao instalar dependências do servidor!
    pause
    exit /b 1
)
cd ..

echo.
echo [2/3] Instalando dependências do cliente...
cd client
call npm install
if errorlevel 1 (
    echo.
    echo ❌ ERRO ao instalar dependências do cliente!
    pause
    exit /b 1
)
cd ..

echo.
echo [3/3] Instalando dependências da raiz...
call npm install
if errorlevel 1 (
    echo.
    echo ❌ ERRO ao instalar dependências da raiz!
    pause
    exit /b 1
)

echo.
echo ═══════════════════════════════════════════════════════════════
echo   ✅ DEPENDÊNCIAS INSTALADAS COM SUCESSO!
echo ═══════════════════════════════════════════════════════════════
echo.
echo Você pode agora:
echo   1. Executar: EXECUTAR_MIGRACOES.bat
echo   2. Executar: INICIAR_SISTEMA.bat
echo.
pause
