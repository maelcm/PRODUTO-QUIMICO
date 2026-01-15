@echo off
title Configurar Arquivo .env
color 0E

echo ========================================
echo   CONFIGURAR ARQUIVO .env
echo ========================================
echo.

cd /d "%~dp0"

if not exist ".env" (
    echo Criando arquivo .env...
    (
        echo DATABASE_URL=mysql://root:@localhost:3306/nfe_system
        echo PORT=3001
        echo NODE_ENV=development
        echo CLIENT_URL=http://localhost:5173
        echo AUTH_SECRET=your-secret-key-change-this-in-production
        echo MANUS_AUTH_CLIENT_ID=
        echo MANUS_AUTH_CLIENT_SECRET=
    ) > .env
    echo Arquivo .env criado!
    echo.
)

echo ========================================
echo   CONFIGURACAO DO BANCO DE DADOS
echo ========================================
echo.
echo Voce precisa configurar o DATABASE_URL com suas credenciais do MySQL.
echo.
echo Formato: mysql://usuario:senha@localhost:3306/nfe_system
echo.
echo Exemplos:
echo   mysql://root:minhasenha123@localhost:3306/nfe_system
echo   mysql://root:@localhost:3306/nfe_system  ^(sem senha^)
echo   mysql://usuario:senha@localhost:3306/nfe_system
echo.
set /p continuar="Deseja configurar agora? (S/N): "

if /i not "%continuar%"=="S" (
    echo.
    echo Arquivo .env mantido com valores padrao.
    echo Configure manualmente editando o arquivo .env
    echo.
    pause
    exit /b 0
)

echo.
set /p db_user="Usuario MySQL (padrao: root): "
if "%db_user%"=="" set db_user=root

set /p db_password="Senha MySQL (deixe vazio se nao tiver): "

set /p db_host="Host MySQL (padrao: localhost): "
if "%db_host%"=="" set db_host=localhost

set /p db_port="Porta MySQL (padrao: 3306): "
if "%db_port%"=="" set db_port=3306

set /p db_name="Nome do banco (padrao: nfe_system): "
if "%db_name%"=="" set db_name=nfe_system

echo.
echo Configurando arquivo .env...

REM Criar arquivo .env com as configuracoes
(
    echo DATABASE_URL=mysql://%db_user%:%db_password%@%db_host%:%db_port%/%db_name%
    echo PORT=3001
    echo NODE_ENV=development
    echo CLIENT_URL=http://localhost:5173
    echo AUTH_SECRET=your-secret-key-change-this-in-production
    echo MANUS_AUTH_CLIENT_ID=
    echo MANUS_AUTH_CLIENT_SECRET=
) > .env

echo.
echo ========================================
echo   CONFIGURACAO CONCLUIDA!
echo ========================================
echo.
echo Arquivo .env configurado com:
echo   DATABASE_URL=mysql://%db_user%:***@%db_host%:%db_port%/%db_name%
echo.
echo IMPORTANTE: Certifique-se de que:
echo 1. O banco de dados '%db_name%' foi criado no MySQL
echo 2. As credenciais estao corretas
echo 3. O MySQL esta rodando
echo.
set /p executar_migracoes="Deseja executar as migracoes agora? (S/N): "

if /i "%executar_migracoes%"=="S" (
    echo.
    echo Executando migracoes...
    cd server
    call npm run db:push
    cd ..
    echo.
)

pause
