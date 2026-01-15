@echo off
title Acessar Sistema Web NF-e
color 0B

cd /d "%~dp0SISTEMA_WEB_NFE"

if not exist "package.json" (
    echo ERRO: Sistema Web NF-e nao encontrado na pasta SISTEMA_WEB_NFE!
    echo.
    echo Verifique se a pasta existe.
    pause
    exit /b 1
)

echo ========================================
echo   SISTEMA WEB NF-e
echo ========================================
echo.
echo Diretorio: %CD%
echo.

:menu
echo Escolha uma opcao:
echo.
echo 1. Verificar Setup
echo 2. Instalar Todas as Dependencias
echo 3. Iniciar Sistema
echo 4. Abrir no Windows Explorer
echo 5. Sair
echo.
set /p opcao="Digite o numero da opcao: "

if "%opcao%"=="1" (
    call VERIFICAR_SETUP.bat
    goto menu
)

if "%opcao%"=="2" (
    call INSTALAR_TUDO.bat
    goto menu
)

if "%opcao%"=="3" (
    call INICIAR_SISTEMA.bat
    goto menu
)

if "%opcao%"=="4" (
    explorer .
    goto menu
)

if "%opcao%"=="5" (
    exit /b 0
)

echo Opcao invalida!
goto menu
