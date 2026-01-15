@echo off
chcp 65001 >nul
echo ========================================
echo   CONFIGURAR GOOGLE SHEETS
echo ========================================
echo.

cd /d "%~dp0"

REM Verificar se credentials.json existe no sistema antigo
if exist "..\credentials.json" (
    echo [1/3] Copiando credentials.json...
    copy /Y "..\credentials.json" "credentials.json" >nul
    if errorlevel 1 (
        echo ❌ Erro ao copiar credentials.json
        pause
        exit /b 1
    )
    echo ✅ credentials.json copiado com sucesso!
) else (
    echo ⚠️  credentials.json não encontrado no sistema antigo
    echo    Verifique se o arquivo existe em: %~dp0..\credentials.json
    pause
    exit /b 1
)

echo.

REM Ler GOOGLE_SHEETS_ID do sistema antigo
set "SHEETS_ID="
if exist "..\.env" (
    for /f "tokens=2 delims==" %%a in ('findstr /i "GOOGLE_SHEETS_ID" "..\.env"') do (
        set "SHEETS_ID=%%a"
    )
)

if "%SHEETS_ID%"=="" (
    echo [2/3] ⚠️  GOOGLE_SHEETS_ID não encontrado no sistema antigo
    echo.
    echo Por favor, digite o ID da planilha do Google Sheets:
    echo (O ID está na URL: docs.google.com/spreadsheets/d/ID_AQUI/edit)
    set /p SHEETS_ID="ID: "
)

echo.
echo [2/3] Configurando .env...

REM Criar ou atualizar .env
if not exist ".env" (
    echo # Configuração do Google Sheets > .env
    echo USE_GOOGLE_SHEETS=true >> .env
    echo GOOGLE_SHEETS_ID=%SHEETS_ID% >> .env
    echo GOOGLE_CREDENTIALS_PATH=credentials.json >> .env
    echo PORT=3001 >> .env
    echo CLIENT_URL=http://localhost:5173 >> .env
) else (
    REM Atualizar .env existente
    findstr /v /i "USE_GOOGLE_SHEETS GOOGLE_SHEETS_ID GOOGLE_CREDENTIALS_PATH" .env > .env.tmp
    echo USE_GOOGLE_SHEETS=true >> .env.tmp
    echo GOOGLE_SHEETS_ID=%SHEETS_ID% >> .env.tmp
    echo GOOGLE_CREDENTIALS_PATH=credentials.json >> .env.tmp
    move /Y .env.tmp .env >nul
)

echo ✅ .env configurado com sucesso!
echo.

echo [3/3] Lembre-se de compartilhar a planilha do Google Sheets:
echo.
echo 1. Abra o arquivo credentials.json
echo 2. Procure por "client_email" (exemplo: service-account@projeto.iam.gserviceaccount.com)
echo 3. Compartilhe sua planilha do Google Sheets com esse email
echo 4. Dê permissão de "Editor"
echo.

echo ========================================
echo   CONFIGURAÇÃO CONCLUÍDA!
echo ========================================
echo.
echo Próximos passos:
echo 1. Compartilhe a planilha com o email da Service Account
echo 2. Execute: INICIAR_SISTEMA.bat
echo.
pause
