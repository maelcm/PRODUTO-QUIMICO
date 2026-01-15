@echo off
echo ========================================
echo API OCR - Sistema de Produtos Quimicos
echo ========================================
echo.
echo Iniciando API Python para processamento OCR...
echo.

cd /d "%~dp0"

REM Verificar se Python esta instalado
python --version >nul 2>&1
if errorlevel 1 (
    echo ERRO: Python nao encontrado!
    echo Por favor, instale Python 3.8 ou superior.
    pause
    exit /b 1
)

REM Verificar se as dependencias estao instaladas
python -c "import fastapi" >nul 2>&1
if errorlevel 1 (
    echo Instalando dependencias...
    pip install -r requirements.txt
    if errorlevel 1 (
        echo ERRO: Falha ao instalar dependencias!
        pause
        exit /b 1
    )
)

REM Verificar se o arquivo .env existe
if not exist "..\.env" (
    echo AVISO: Arquivo .env nao encontrado na raiz do projeto!
    echo Certifique-se de configurar as variaveis de ambiente.
    echo.
)

echo.
echo ========================================
echo Iniciando servidor na porta 8000...
echo ========================================
echo.
echo A API estara disponivel em: http://localhost:8000
echo.
echo Para parar o servidor, pressione Ctrl+C
echo.

python main.py

pause
