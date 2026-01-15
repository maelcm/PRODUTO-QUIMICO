@echo off
title Acessar Sistema Web NF-e
color 0B

cd /d "%~dp0SISTEMA_WEB_NFE"

if not exist "package.json" (
    echo ERRO: Sistema Web NF-e nao encontrado!
    echo Pasta esperada: %~dp0SISTEMA_WEB_NFE
    pause
    exit /b 1
)

echo ========================================
echo   SISTEMA WEB NF-e
echo ========================================
echo.
echo Diretorio: %CD%
echo.

:MENU
cls
echo ========================================
echo   MENU PRINCIPAL
echo ========================================
echo.
echo 1. Setup Completo Automatico (RECOMENDADO)
echo 2. Verificar Setup
echo 3. Instalar Dependencias
echo 4. Criar Banco de Dados
echo 5. Executar Migracoes
echo 6. Iniciar Sistema
echo 7. Sair
echo.
set /p opcao="Escolha uma opcao (1-7): "

if "%opcao%"=="1" (
    call SETUP_COMPLETO_AUTOMATICO.bat
    goto MENU
)

if "%opcao%"=="2" (
    call VERIFICAR_SETUP.bat
    goto MENU
)

if "%opcao%"=="3" (
    call INSTALAR_TUDO.bat
    goto MENU
)

if "%opcao%"=="4" (
    call CRIAR_BANCO.bat
    goto MENU
)

if "%opcao%"=="5" (
    call EXECUTAR_MIGRACOES.bat
    goto MENU
)

if "%opcao%"=="6" (
    call INICIAR_SISTEMA.bat
    goto MENU
)

if "%opcao%"=="7" (
    exit /b 0
)

echo Opcao invalida!
timeout /t 2 >nul
goto MENU
