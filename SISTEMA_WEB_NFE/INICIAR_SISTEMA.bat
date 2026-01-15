@echo off
title Sistema Web NF-e - Produtos Quimicos
color 0A

echo ========================================
echo   SISTEMA WEB NF-e - PRODUTOS QUIMICOS
echo ========================================
echo.

cd /d "%~dp0"

echo Verificando Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERRO: Node.js nao encontrado!
    echo Por favor, instale o Node.js de https://nodejs.org/
    pause
    exit /b 1
)

node --version
echo.

echo Verificando dependencias...
if not exist "node_modules" (
    echo Dependencias principais nao encontradas. Instalando...
    call npm install
    if errorlevel 1 (
        echo ERRO ao instalar dependencias principais!
        echo Execute: SETUP_COMPLETO_AUTOMATICO.bat
        pause
        exit /b 1
    )
)

if not exist "server\node_modules" (
    echo Dependencias do servidor nao encontradas. Instalando...
    cd server
    call npm install
    cd ..
    if errorlevel 1 (
        echo ERRO ao instalar dependencias do servidor!
        echo Execute: SETUP_COMPLETO_AUTOMATICO.bat
        pause
        exit /b 1
    )
)

if not exist "client\node_modules" (
    echo Dependencias do cliente nao encontradas. Instalando...
    cd client
    call npm install --legacy-peer-deps
    cd ..
    if errorlevel 1 (
        echo ERRO ao instalar dependencias do cliente!
        echo Execute: SETUP_COMPLETO_AUTOMATICO.bat
        pause
        exit /b 1
    )
)

echo.
echo ========================================
echo   INICIANDO SISTEMA
echo ========================================
echo.
echo Backend: http://localhost:3001
echo Frontend: http://localhost:5173
echo.
echo IMPORTANTE:
echo - Mantenha esta janela aberta enquanto usar o sistema
echo - Para parar o sistema, pressione Ctrl+C
echo - O navegador abrira automaticamente em alguns segundos
echo.
echo ========================================
echo.

REM Verificar se .env existe
if not exist ".env" (
    echo AVISO: Arquivo .env nao encontrado!
    echo.
    echo Criando arquivo .env automaticamente...
    (
        echo DATABASE_URL=mysql://root:@localhost:3306/nfe_system
        echo PORT=3001
        echo NODE_ENV=development
        echo CLIENT_URL=http://localhost:5173
        echo AUTH_SECRET=your-secret-key-change-this-in-production
        echo MANUS_AUTH_CLIENT_ID=
        echo MANUS_AUTH_CLIENT_SECRET=
    ) > .env
    echo Arquivo .env criado com valores padrao!
    echo.
    echo IMPORTANTE: Configure o DATABASE_URL no arquivo .env antes de continuar!
    echo Execute: CONFIGURAR_ENV.bat para configurar corretamente.
    echo.
    pause
)

REM Abrir navegador automaticamente após alguns segundos (em background)
powershell -Command "Start-Sleep -Seconds 8; Start-Process 'http://localhost:5173'" >nul 2>&1

REM Iniciar sistema (isso mantém a janela aberta e mostra os logs)
call npm run dev

if errorlevel 1 (
    echo.
    echo ========================================
    echo   ERRO AO INICIAR SISTEMA
    echo ========================================
    echo.
    echo Possiveis causas:
    echo 1. Dependencias nao instaladas - Execute: SETUP_COMPLETO_AUTOMATICO.bat
    echo 2. Porta ja em uso - Feche outras aplicacoes
    echo 3. Banco de dados nao configurado - Execute: SETUP_COMPLETO_AUTOMATICO.bat
    echo.
)

pause
