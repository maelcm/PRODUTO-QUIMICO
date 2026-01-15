@echo off
title Criar Banco de Dados Automatico
color 0E

echo ========================================
echo   CRIAR BANCO DE DADOS MYSQL
echo ========================================
echo.

cd /d "%~dp0"

REM Tentar ler configuracoes do .env
set DB_USER=root
set DB_PASSWORD=
set DB_HOST=localhost
set DB_PORT=3306
set DB_NAME=nfe_system

if exist ".env" (
    echo Lendo configuracoes do arquivo .env...
    for /f "tokens=2 delims==" %%a in ('findstr "DATABASE_URL" .env') do (
        set DB_URL=%%a
    )
    REM Extrair dados da URL (formato: mysql://user:password@host:port/database)
    REM Simplificado - assume formato padrao
)

echo.
echo Configuracao atual:
echo   Usuario: %DB_USER%
echo   Host: %DB_HOST%
echo   Porta: %DB_PORT%
echo   Banco: %DB_NAME%
echo.

set /p confirm="Deseja usar estas configuracoes? (S/N): "
if /i not "%confirm%"=="S" (
    echo.
    set /p DB_USER="Usuario MySQL (padrao: root): "
    if "%DB_USER%"=="" set DB_USER=root
    
    set /p DB_PASSWORD="Senha MySQL (deixe vazio se nao tiver): "
    
    set /p DB_HOST="Host MySQL (padrao: localhost): "
    if "%DB_HOST%"=="" set DB_HOST=localhost
    
    set /p DB_NAME="Nome do banco (padrao: nfe_system): "
    if "%DB_NAME%"=="" set DB_NAME=nfe_system
)

echo.
echo Tentando criar banco de dados '%DB_NAME%'...
echo.

REM Verificar se MySQL esta disponivel
mysql --version >nul 2>&1
if errorlevel 1 (
    echo MySQL nao encontrado no PATH do sistema.
    echo.
    echo ========================================
    echo   CRIAR BANCO MANUALMENTE
    echo ========================================
    echo.
    echo Execute no MySQL (Workbench, linha de comando, etc):
    echo.
    echo   CREATE DATABASE IF NOT EXISTS %DB_NAME%;
    echo.
    echo Depois disso, continue com as migracoes:
    echo   EXECUTAR_MIGRACOES.bat
    echo.
    pause
    exit /b 0
)

REM Tentar criar o banco
if "%DB_PASSWORD%"=="" (
    echo CREATE DATABASE IF NOT EXISTS %DB_NAME%; | mysql -u %DB_USER% -h %DB_HOST% -P %DB_PORT% 2>nul
) else (
    echo CREATE DATABASE IF NOT EXISTS %DB_NAME%; | mysql -u %DB_USER% -p%DB_PASSWORD% -h %DB_HOST% -P %DB_PORT% 2>nul
)

if errorlevel 1 (
    echo.
    echo ========================================
    echo   ERRO AO CRIAR BANCO
    echo ========================================
    echo.
    echo Possiveis causas:
    echo 1. Usuario ou senha incorretos
    echo 2. MySQL nao esta rodando
    echo 3. Usuario nao tem permissao para criar bancos
    echo 4. Banco ja existe
    echo.
    echo ========================================
    echo   CRIAR MANUALMENTE
    echo ========================================
    echo.
    echo Execute no MySQL:
    echo.
    echo   CREATE DATABASE IF NOT EXISTS %DB_NAME%;
    echo.
    echo Ou use o MySQL Workbench para criar o banco.
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo   BANCO DE DADOS CRIADO COM SUCESSO!
echo ========================================
echo.
echo Banco '%DB_NAME%' esta pronto para uso!
echo.
echo Proximo passo: Executar migracoes
echo.
set /p executar_migracoes="Deseja executar as migracoes agora? (S/N): "

if /i "%executar_migracoes%"=="S" (
    echo.
    echo Executando migracoes...
    call EXECUTAR_MIGRACOES.bat
) else (
    echo.
    echo Para executar migracoes depois, use:
    echo   EXECUTAR_MIGRACOES.bat
    echo.
)

pause
