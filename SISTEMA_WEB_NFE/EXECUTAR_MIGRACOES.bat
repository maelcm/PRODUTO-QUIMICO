@echo off
title Executar Migracoes do Banco de Dados
color 0B

cd /d "%~dp0"

echo ========================================
echo   EXECUTANDO MIGRACOES DO BANCO
echo ========================================
echo.

echo Verificando se estamos no diretorio correto...
if not exist "server" (
    echo ERRO: Pasta 'server' nao encontrada!
    echo.
    echo Certifique-se de estar em: SISTEMA_WEB_NFE
    pause
    exit /b 1
)

echo [OK] Diretorio correto
echo.

echo Verificando Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERRO: Node.js nao encontrado!
    pause
    exit /b 1
)

echo [OK] Node.js encontrado
echo.

echo Verificando dependencias do servidor...
if not exist "server\node_modules" (
    echo AVISO: Dependencias do servidor nao instaladas!
    echo Instalando agora...
    cd server
    call npm install
    cd ..
)

echo.
echo ========================================
echo   EXECUTANDO MIGRACOES
echo ========================================
echo.
echo IMPORTANTE: Certifique-se de ter:
echo 1. Criado o banco MySQL: CREATE DATABASE nfe_system;
echo 2. Configurado o arquivo .env com DATABASE_URL
echo.
pause

cd server
echo.
echo Executando: npm run db:push
echo (Comando: drizzle-kit push:mysql)
echo.
call npm run db:push

if errorlevel 1 (
    echo.
    echo ========================================
    echo   ERRO AO EXECUTAR MIGRACOES
    echo ========================================
    echo.
    echo Possiveis causas:
    echo 1. Banco de dados nao criado
    echo 2. DATABASE_URL incorreto no .env
    echo 3. MySQL nao esta rodando
    echo 4. Usuario/senha incorretos
    echo.
) else (
    echo.
    echo ========================================
    echo   MIGRACOES EXECUTADAS COM SUCESSO!
    echo ========================================
    echo.
)

cd ..
pause
