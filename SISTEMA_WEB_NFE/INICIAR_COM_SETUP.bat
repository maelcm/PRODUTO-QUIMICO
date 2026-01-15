@echo off
title Iniciar Sistema com Setup Automatico
color 0B

echo ========================================
echo   INICIANDO SISTEMA COM SETUP AUTOMATICO
echo ========================================
echo.

cd /d "%~dp0"

REM Verificar se .env existe
if not exist ".env" (
    echo Arquivo .env nao encontrado!
    echo.
    echo Executando configuracao automatica...
    echo.
    call CONFIGURAR_ENV.bat
    
    REM Verificar novamente
    if not exist ".env" (
        echo.
        echo ERRO: Nao foi possivel criar o arquivo .env
        echo Execute manualmente: CONFIGURAR_ENV.bat
        pause
        exit /b 1
    )
)

REM Verificar dependencias
if not exist "node_modules" (
    echo Dependencias nao encontradas. Instalando...
    call npm install
    if errorlevel 1 (
        echo ERRO ao instalar dependencias!
        echo Execute: INSTALAR_TUDO.bat
        pause
        exit /b 1
    )
)

if not exist "server\node_modules" (
    echo Instalando dependencias do servidor...
    cd server
    call npm install
    cd ..
)

if not exist "client\node_modules" (
    echo Instalando dependencias do cliente...
    cd client
    call npm install --legacy-peer-deps
    cd ..
)

REM Iniciar sistema
echo.
echo ========================================
echo   INICIANDO SISTEMA
echo ========================================
echo.
echo Backend: http://localhost:3001
echo Frontend: http://localhost:5173
echo.
call npm run dev

pause
