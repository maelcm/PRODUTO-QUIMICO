@echo off
title Smart Inventory System
color 0A
setlocal

REM Garantir que nao feche automaticamente
echo.
echo ========================================
echo   SMART INVENTORY SYSTEM
echo ========================================
echo.

cd /d "%~dp0"
echo Diretorio: %CD%
echo.

REM Usar Python do Anaconda
set "PYTHON_EXE=%USERPROFILE%\anaconda3\python.exe"

if not exist "%PYTHON_EXE%" (
    echo ERRO: Python do Anaconda nao encontrado!
    echo Caminho esperado: %PYTHON_EXE%
    echo.
    pause
    exit /b 1
)

echo Python encontrado: %PYTHON_EXE%
"%PYTHON_EXE%" --version
echo.

echo Verificando Streamlit...
"%PYTHON_EXE%" -m streamlit --version
if errorlevel 1 (
    echo ERRO: Streamlit nao encontrado!
    pause
    exit /b 1
)
echo.

echo Iniciando sistema...
echo.
echo IMPORTANTE: Mantenha esta janela aberta!
echo.
echo ========================================
echo.

"%PYTHON_EXE%" -m streamlit run app.py

echo.
echo Sistema encerrado.
pause
