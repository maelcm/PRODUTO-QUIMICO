@echo off
title Smart Inventory System
color 0A

REM Garantir que a janela nao feche automaticamente
setlocal enabledelayedexpansion

echo ========================================
echo   SMART INVENTORY SYSTEM
echo   Iniciando sistema...
echo ========================================
echo.

cd /d "%~dp0"
echo Diretorio: %CD%
echo.

echo Verificando Python...
REM Usar Anaconda se disponivel (onde o Streamlit ja esta instalado)
if exist "%USERPROFILE%\anaconda3\python.exe" (
    echo [OK] Python do Anaconda detectado!
    set "PYTHON_EXE=%USERPROFILE%\anaconda3\python.exe"
    set "PATH=%USERPROFILE%\anaconda3;%USERPROFILE%\anaconda3\Scripts;%USERPROFILE%\anaconda3\Library\bin;%PATH%"
    "%PYTHON_EXE%" --version
) else (
    echo Procurando Python do sistema...
    set "PYTHON_EXE=python"
    python --version
    if errorlevel 1 (
        echo.
        echo ========================================
        echo   ERRO: Python nao encontrado!
        echo ========================================
        echo Por favor, instale o Python ou adicione ao PATH.
        echo.
        pause
        exit /b 1
    )
)
echo.

echo Verificando Streamlit...
"%PYTHON_EXE%" -m streamlit --version
if errorlevel 1 (
    echo.
    echo [AVISO] Streamlit nao encontrado neste Python.
    echo Tentando instalar dependencias...
    echo.
    echo Isso pode demorar alguns minutos...
    "%PYTHON_EXE%" -m pip install --upgrade pip
    "%PYTHON_EXE%" -m pip install streamlit openai pandas gspread google-auth google-auth-oauthlib google-auth-httplib2 Pillow python-dotenv unidecode
    if errorlevel 1 (
        echo.
        echo ========================================
        echo   ERRO: Falha ao instalar dependencias!
        echo ========================================
        echo.
        echo Solucoes:
        echo 1. Execute manualmente: pip install streamlit openai pandas
        echo 2. Ou use o Anaconda Prompt
        echo.
        pause
        exit /b 1
    )
    echo.
    echo [OK] Dependencias instaladas!
) else (
    echo [OK] Streamlit encontrado!
)
echo.

echo Verificando sintaxe do app.py...
"%PYTHON_EXE%" -m py_compile app.py
if errorlevel 1 (
    echo.
    echo ========================================
    echo   ERRO: Erro de sintaxe no app.py!
    echo ========================================
    echo Verifique o arquivo app.py para erros.
    echo.
    pause
    exit /b 1
)
echo [OK] Sintaxe correta.
echo.

echo ========================================
echo   INICIANDO SISTEMA
echo ========================================
echo.
echo Python usado: %PYTHON_EXE%
echo.
echo IMPORTANTE:
echo - Esta janela DEVE permanecer aberta
echo - O navegador abrira automaticamente
echo - Para parar: pressione Ctrl+C
echo.
echo Aguarde alguns segundos...
echo.
echo ========================================
echo.

REM Executar Streamlit (isso mantem a janela aberta)
"%PYTHON_EXE%" -m streamlit run app.py --server.headless false

REM Se chegou aqui, o Streamlit foi fechado
echo.
echo ========================================
echo   Sistema foi encerrado.
echo ========================================
echo.
pause
