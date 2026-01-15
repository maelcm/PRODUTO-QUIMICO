@echo off
title Resolver Problema - Arquivo .env
color 0C

echo ========================================
echo   RESOLVER PROBLEMA - ARQUIVO .env
echo ========================================
echo.

cd /d "%~dp0"

echo Este script vai:
echo 1. Verificar se o arquivo .env existe
echo 2. Criar o arquivo .env se necessario
echo 3. Instalar dotenv no servidor
echo 4. Verificar se tudo esta configurado
echo.
pause

REM Verificar .env
if not exist ".env" (
    echo [1/4] Arquivo .env nao encontrado. Criando...
    call CONFIGURAR_ENV.bat
) else (
    echo [1/4] Arquivo .env encontrado!
)

echo.
echo [2/4] Instalando dotenv no servidor...
cd server
call npm install dotenv
cd ..

echo.
echo [3/4] Verificando estrutura...
if exist "server\node_modules\dotenv" (
    echo [OK] dotenv instalado no servidor
) else (
    echo [AVISO] dotenv pode nao estar instalado corretamente
)

echo.
echo [4/4] Verificando arquivo .env...
if exist ".env" (
    echo [OK] Arquivo .env existe
    echo.
    echo Conteudo do arquivo .env:
    echo ----------------------------------------
    type .env
    echo ----------------------------------------
) else (
    echo [ERRO] Arquivo .env nao encontrado!
)

echo.
echo ========================================
echo   VERIFICACAO CONCLUIDA
echo ========================================
echo.
echo Se tudo estiver OK, tente iniciar o sistema novamente:
echo   INICIAR_SISTEMA.bat
echo.
pause
