@echo off
title Smart Inventory System
color 0A

echo ========================================
echo   SMART INVENTORY SYSTEM
echo   Iniciando sistema...
echo ========================================
echo.

cd /d "%~dp0"

echo Tentando usar Anaconda Python...
where python >nul 2>&1
if errorlevel 1 (
    echo Python nao encontrado no PATH.
    echo Tentando usar Python do Anaconda...
    if exist "C:\Users\%USERNAME%\anaconda3\python.exe" (
        set "PATH=C:\Users\%USERNAME%\anaconda3;C:\Users\%USERNAME%\anaconda3\Scripts;%PATH%"
        echo Python do Anaconda encontrado!
    ) else (
        echo ERRO: Python nao encontrado!
        pause
        exit /b 1
    )
)

python --version
echo.

echo Verificando Streamlit...
python -m streamlit --version >nul 2>&1
if errorlevel 1 (
    echo Streamlit nao encontrado. Instalando...
    python -m pip install streamlit openai pandas gspread google-auth google-auth-oauthlib google-auth-httplib2 Pillow python-dotenv unidecode
    if errorlevel 1 (
        echo.
        echo ERRO: Falha ao instalar dependencias!
        echo.
        echo Por favor, execute manualmente no Anaconda Prompt:
        echo   pip install streamlit openai pandas gspread
        echo.
        pause
        exit /b 1
    )
)

echo.
echo Streamlit encontrado! Iniciando sistema...
echo O sistema abrira automaticamente no seu navegador.
echo.
echo Para parar o sistema, pressione Ctrl+C nesta janela.
echo.

python -m streamlit run app.py

if errorlevel 1 (
    echo.
    echo ========================================
    echo   ERRO ao iniciar o sistema!
    echo ========================================
    echo.
    pause
)
