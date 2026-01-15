@echo off
title Configuracao Completa Automatica
color 0B

echo ========================================
echo   CONFIGURACAO COMPLETA AUTOMATICA
echo ========================================
echo.

cd /d "%~dp0"

echo [1/5] Verificando arquivo .env...
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
    echo [OK] Arquivo .env criado
) else (
    echo [OK] Arquivo .env ja existe
)
echo.

echo [2/5] Verificando dependencias principais...
if not exist "node_modules" (
    echo Instalando dependencias principais...
    call npm install
    if errorlevel 1 (
        echo ERRO ao instalar dependencias principais!
        pause
        exit /b 1
    )
    echo [OK] Dependencias principais instaladas
) else (
    echo [OK] Dependencias principais ja instaladas
)
echo.

echo [3/5] Verificando dependencias do servidor...
if not exist "server\node_modules" (
    echo Instalando dependencias do servidor...
    cd server
    call npm install
    cd ..
    if errorlevel 1 (
        echo ERRO ao instalar dependencias do servidor!
        pause
        exit /b 1
    )
    echo [OK] Dependencias do servidor instaladas
) else (
    echo [OK] Dependencias do servidor ja instaladas
)
echo.

echo [4/5] Verificando dependencias do cliente...
if not exist "client\node_modules" (
    echo Instalando dependencias do cliente...
    cd client
    call npm install --legacy-peer-deps
    cd ..
    if errorlevel 1 (
        echo ERRO ao instalar dependencias do cliente!
        pause
        exit /b 1
    )
    echo [OK] Dependencias do cliente instaladas
) else (
    echo [OK] Dependencias do cliente ja instaladas
)
echo.

echo [5/5] Configuracao do banco de dados...
echo.
echo ========================================
echo   IMPORTANTE: CONFIGURAR DATABASE_URL
echo ========================================
echo.
echo O arquivo .env foi criado com valores padrao.
echo.
echo ANTES DE EXECUTAR AS MIGRACOES:
echo.
echo 1. Configure o DATABASE_URL no arquivo .env
echo    Formato: mysql://usuario:senha@localhost:3306/nfe_system
echo.
echo 2. Crie o banco de dados no MySQL:
echo    CREATE DATABASE nfe_system;
echo.
echo 3. Execute as migracoes:
echo    EXECUTAR_MIGRACOES.bat
echo.
echo ========================================
echo.
echo Deseja abrir o arquivo .env para editar agora? (S/N)
set /p abrir="> "

if /i "%abrir%"=="S" (
    echo Abrindo arquivo .env...
    notepad .env
    echo.
    echo Arquivo .env editado!
    echo.
)

echo.
echo ========================================
echo   CONFIGURACAO CONCLUIDA!
echo ========================================
echo.
echo Proximos passos:
echo 1. Configure o DATABASE_URL no .env (se ainda nao fez)
echo 2. Crie o banco de dados: CRIAR_BANCO.bat
echo 3. Execute migracoes: EXECUTAR_MIGRACOES.bat
echo 4. Inicie o sistema: INICIAR_SISTEMA.bat
echo.
echo OU execute tudo de uma vez: SETUP_COMPLETO_AUTOMATICO.bat
echo.
pause
