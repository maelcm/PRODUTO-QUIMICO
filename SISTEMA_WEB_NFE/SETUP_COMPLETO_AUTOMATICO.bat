@echo off
title Setup Completo Automatico - Sistema NF-e
color 0B
setlocal enabledelayedexpansion

echo ========================================
echo   SETUP COMPLETO AUTOMATICO
echo   Sistema Web NF-e - Produtos Quimicos
echo ========================================
echo.

REM Navegar para o diretorio do script
cd /d "%~dp0"

REM Verificar se esta no diretorio correto
if not exist "package.json" (
    echo ERRO: Nao encontrado package.json!
    echo Certifique-se de que este script esta na pasta SISTEMA_WEB_NFE
    pause
    exit /b 1
)

echo [1/8] Verificando Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERRO: Node.js nao encontrado!
    echo.
    echo Por favor, instale o Node.js de: https://nodejs.org/
    pause
    exit /b 1
)
echo [OK] Node.js encontrado
node --version
echo.

echo [2/8] Verificando MySQL...
REM Tentar verificar se MySQL esta instalado (via comando)
mysql --version >nul 2>&1
if errorlevel 1 (
    echo [AVISO] MySQL pode nao estar no PATH do sistema
    echo Por favor, certifique-se de que o MySQL esta instalado e rodando
    echo.
) else (
    echo [OK] MySQL encontrado
    mysql --version
)
echo.

echo [3/8] Instalando dependencias principais...
if not exist "node_modules" (
    echo Instalando...
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

echo [4/8] Instalando dependencias do servidor...
cd server
if not exist "node_modules" (
    echo Instalando...
    call npm install
    if errorlevel 1 (
        echo ERRO ao instalar dependencias do servidor!
        cd ..
        pause
        exit /b 1
    )
    echo [OK] Dependencias do servidor instaladas
) else (
    echo [OK] Dependencias do servidor ja instaladas
)
cd ..
echo.

echo [5/8] Instalando dependencias do cliente...
cd client
if not exist "node_modules" (
    echo Instalando...
    call npm install --legacy-peer-deps
    if errorlevel 1 (
        echo ERRO ao instalar dependencias do cliente!
        cd ..
        pause
        exit /b 1
    )
    echo [OK] Dependencias do cliente instaladas
) else (
    echo [OK] Dependencias do cliente ja instaladas
)
cd ..
echo.

echo [6/8] Configurando arquivo .env...
if not exist ".env" (
    echo Arquivo .env nao encontrado. Criando...
    if exist ".env.example" (
        copy ".env.example" ".env" >nul
        echo [OK] Arquivo .env criado a partir de .env.example
        echo.
        echo IMPORTANTE: Configure o arquivo .env com suas credenciais!
        echo.
        echo Abra o arquivo .env e configure:
        echo   DATABASE_URL="mysql://usuario:senha@localhost:3306/nfe_system"
        echo.
        echo Exemplo:
        echo   DATABASE_URL="mysql://root:minhasenha123@localhost:3306/nfe_system"
        echo.
        pause
    ) else (
        echo [AVISO] Arquivo .env.example nao encontrado
        echo Criando .env basico...
        (
            echo DATABASE_URL=mysql://root:^@localhost:3306/nfe_system
            echo PORT=3001
            echo NODE_ENV=development
            echo CLIENT_URL=http://localhost:5173
        ) > .env
        echo [OK] Arquivo .env criado
        echo.
        echo IMPORTANTE: Configure o arquivo .env com suas credenciais do MySQL!
        echo.
        pause
    )
) else (
    echo [OK] Arquivo .env ja existe
)
echo.

echo [7/8] Verificando banco de dados...
echo.
echo ========================================
echo   CONFIGURACAO DO BANCO DE DADOS
echo ========================================
echo.
echo IMPORTANTE: Antes de continuar, certifique-se de:
echo.
echo 1. MySQL esta instalado e rodando
echo 2. Voce tem credenciais de acesso ao MySQL
echo 3. O arquivo .env esta configurado corretamente
echo.
echo Para criar o banco de dados, execute no MySQL:
echo   CREATE DATABASE nfe_system;
echo.
set /p continuar="Deseja continuar com as migracoes? (S/N): "
if /i not "%continuar%"=="S" (
    echo.
    echo Setup pausado. Execute novamente quando estiver pronto.
    pause
    exit /b 0
)
echo.

echo Executando migracoes do banco de dados...
cd server
call npm run db:push
if errorlevel 1 (
    echo.
    echo ========================================
    echo   ERRO AO EXECUTAR MIGRACOES
    echo ========================================
    echo.
    echo Possiveis causas:
    echo 1. Banco de dados 'nfe_system' nao foi criado
    echo 2. DATABASE_URL incorreto no arquivo .env
    echo 3. MySQL nao esta rodando
    echo 4. Usuario/senha incorretos no .env
    echo.
    echo Verifique o arquivo .env e tente novamente.
    cd ..
    pause
    exit /b 1
)
echo [OK] Migracoes executadas com sucesso!
cd ..
echo.

echo [8/8] Setup concluido!
echo.
echo ========================================
echo   SETUP CONCLUIDO COM SUCESSO!
echo ========================================
echo.
echo Pronto para iniciar o sistema!
echo.
set /p iniciar="Deseja iniciar o sistema agora? (S/N): "
if /i "%iniciar%"=="S" (
    echo.
    echo ========================================
    echo   INICIANDO SISTEMA
    echo ========================================
    echo.
    echo Backend: http://localhost:3001
    echo Frontend: http://localhost:5173
    echo.
    echo Pressione Ctrl+C para parar o sistema
    echo.
    call npm run dev
) else (
    echo.
    echo Para iniciar o sistema depois, execute:
    echo   npm run dev
    echo.
    echo Ou use o script: INICIAR_SISTEMA.bat
    echo.
)

pause
