@echo off
title Criar Banco de Dados - Sistema NF-e
color 0E

echo ========================================
echo   CRIAR BANCO DE DADOS MYSQL
echo ========================================
echo.

REM Tentar executar comando MySQL
echo Tentando criar banco de dados 'nfe_system'...
echo.

REM Verificar se MySQL esta disponivel
mysql --version >nul 2>&1
if errorlevel 1 (
    echo MySQL nao encontrado no PATH do sistema.
    echo.
    echo Por favor, crie o banco manualmente:
    echo.
    echo 1. Abra o MySQL (Workbench, linha de comando, etc)
    echo 2. Execute o comando:
    echo    CREATE DATABASE nfe_system;
    echo.
    pause
    exit /b 1
)

echo MySQL encontrado!
echo.
echo Para criar o banco de dados, voce precisa fornecer:
echo - Usuario MySQL (ex: root)
echo - Senha MySQL
echo.

set /p mysql_user="Usuario MySQL (padrao: root): "
if "%mysql_user%"=="" set mysql_user=root

set /p mysql_password="Senha MySQL: "

echo.
echo Criando banco de dados 'nfe_system'...
echo.

REM Tentar criar o banco
echo CREATE DATABASE IF NOT EXISTS nfe_system; | mysql -u %mysql_user% -p%mysql_password% 2>nul

if errorlevel 1 (
    echo.
    echo ERRO ao criar banco de dados!
    echo.
    echo Possiveis causas:
    echo 1. Usuario ou senha incorretos
    echo 2. MySQL nao esta rodando
    echo 3. Usuario nao tem permissao para criar bancos
    echo.
    echo Crie manualmente no MySQL:
    echo   CREATE DATABASE nfe_system;
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo   BANCO DE DADOS CRIADO COM SUCESSO!
echo ========================================
echo.
echo Banco 'nfe_system' esta pronto para uso!
echo.
echo Proximos passos:
echo 1. Configure o arquivo .env com DATABASE_URL
echo 2. Execute: .\EXECUTAR_MIGRACOES.bat
echo    OU
echo    Execute: .\SETUP_COMPLETO_AUTOMATICO.bat
echo.
pause
