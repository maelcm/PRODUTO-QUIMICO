@echo off
title Teste - Smart Inventory System
color 0B

echo ========================================
echo   TESTE DE INICIO DO SISTEMA
echo ========================================
echo.

cd /d "%~dp0"
echo Diretorio atual: %CD%
echo.

REM Verificar Python do Anaconda
if exist "%USERPROFILE%\anaconda3\python.exe" (
    echo [OK] Python do Anaconda encontrado
    set "PYTHON_EXE=%USERPROFILE%\anaconda3\python.exe"
    "%PYTHON_EXE%" --version
) else (
    echo [ERRO] Python do Anaconda NAO encontrado
    pause
    exit /b 1
)

echo.
echo Testando Streamlit...
"%PYTHON_EXE%" -m streamlit --version
if errorlevel 1 (
    echo [ERRO] Streamlit nao encontrado!
    pause
    exit /b 1
)

echo.
echo Testando imports do app...
"%PYTHON_EXE%" -c "import streamlit; import pandas; import PIL; print('[OK] Imports basicos funcionam')"
if errorlevel 1 (
    echo [ERRO] Falha nos imports!
    pause
    exit /b 1
)

echo.
echo Testando sintaxe do app.py...
"%PYTHON_EXE%" -m py_compile app.py
if errorlevel 1 (
    echo [ERRO] Erro de sintaxe no app.py!
    pause
    exit /b 1
)
echo [OK] app.py esta sem erros de sintaxe

echo.
echo ========================================
echo   TUDO OK! Iniciando sistema...
echo ========================================
echo.
echo Pressione qualquer tecla para iniciar o Streamlit...
pause >nul

echo.
echo Iniciando...
echo.

"%PYTHON_EXE%" -m streamlit run app.py

pause
