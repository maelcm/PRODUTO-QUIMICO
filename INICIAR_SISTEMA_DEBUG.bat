@echo off
title Smart Inventory System - DEBUG
color 0E

REM Garantir que a janela NAO feche automaticamente
setlocal enabledelayedexpansion

echo ========================================
echo   SMART INVENTORY SYSTEM - MODO DEBUG
echo ========================================
echo.

cd /d "%~dp0"
if errorlevel 1 (
    echo ERRO ao mudar para o diretorio!
    pause
    exit /b 1
)

echo Diretorio atual: %CD%
echo.

REM Verificar Python do Anaconda
echo [1/5] Verificando Python...
if exist "%USERPROFILE%\anaconda3\python.exe" (
    echo [OK] Python do Anaconda encontrado!
    set "PYTHON_EXE=%USERPROFILE%\anaconda3\python.exe"
    "%PYTHON_EXE%" --version
) else (
    echo [AVISO] Python do Anaconda nao encontrado, usando Python do sistema...
    set "PYTHON_EXE=python"
    python --version
    if errorlevel 1 (
        echo [ERRO] Python nao encontrado!
        pause
        exit /b 1
    )
)
echo.

echo [2/5] Verificando Streamlit...
"%PYTHON_EXE%" -m streamlit --version
if errorlevel 1 (
    echo [ERRO] Streamlit nao encontrado!
    echo.
    echo Tentando instalar...
    "%PYTHON_EXE%" -m pip install streamlit
    if errorlevel 1 (
        echo [ERRO] Falha ao instalar Streamlit!
        pause
        exit /b 1
    )
) else (
    echo [OK] Streamlit encontrado!
)
echo.

echo [3/5] Verificando arquivo app.py...
if not exist "app.py" (
    echo [ERRO] Arquivo app.py nao encontrado!
    echo Diretorio atual: %CD%
    pause
    exit /b 1
)
echo [OK] app.py encontrado.
echo.

echo [4/5] Testando sintaxe...
"%PYTHON_EXE%" -m py_compile app.py
if errorlevel 1 (
    echo [ERRO] Erro de sintaxe no app.py!
    pause
    exit /b 1
)
echo [OK] Sintaxe correta.
echo.

echo [5/5] Iniciando Streamlit...
echo.
echo ========================================
echo   INICIANDO SISTEMA
echo ========================================
echo.
echo Python: %PYTHON_EXE%
echo Diretorio: %CD%
echo.
echo Esta janela DEVE permanecer aberta!
echo O navegador abrira automaticamente.
echo.
echo Para parar: pressione Ctrl+C
echo.
echo ========================================
echo.

REM Executar e mostrar TODOS os erros
"%PYTHON_EXE%" -m streamlit run app.py --server.headless false

echo.
echo.
echo ========================================
echo   SISTEMA ENCERRADO
echo ========================================
echo.
echo Pressione qualquer tecla para fechar...
pause >nul
