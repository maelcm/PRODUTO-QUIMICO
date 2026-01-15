@echo off
title Instalacao Completa - Sistema NF-e
color 0B

echo ========================================
echo   INSTALACAO COMPLETA DO SISTEMA
echo ========================================
echo.

cd /d "%~dp0"

echo Verificando Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERRO: Node.js nao encontrado!
    echo.
    echo Por favor, instale o Node.js de:
    echo https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo [OK] Node.js encontrado
node --version
echo.

echo ========================================
echo   PASSO 1: Instalando dependencias principais
echo ========================================
echo.
call npm install
if errorlevel 1 (
    echo ERRO ao instalar dependencias principais!
    pause
    exit /b 1
)
echo [OK] Dependencias principais instaladas
echo.

echo ========================================
echo   PASSO 2: Instalando dependencias do servidor
echo ========================================
echo.
cd server
call npm install
if errorlevel 1 (
    echo ERRO ao instalar dependencias do servidor!
    cd ..
    pause
    exit /b 1
)
cd ..
echo [OK] Dependencias do servidor instaladas
echo.

echo ========================================
echo   PASSO 3: Instalando dependencias do cliente
echo ========================================
echo.
cd client
call npm install
if errorlevel 1 (
    echo ERRO ao instalar dependencias do cliente!
    cd ..
    pause
    exit /b 1
)
cd ..
echo [OK] Dependencias do cliente instaladas
echo.

echo ========================================
echo   INSTALACAO CONCLUIDA!
echo ========================================
echo.
echo Proximos passos:
echo 1. Configure o arquivo .env (copie de .env.example)
echo 2. Crie o banco MySQL: CREATE DATABASE nfe_system;
echo 3. Execute as migracoes: cd server ^&^& npm run db:push
echo 4. Inicie o sistema: npm run dev
echo.
pause
