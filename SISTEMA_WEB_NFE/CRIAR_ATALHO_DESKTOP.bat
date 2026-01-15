@echo off
title Criar Atalho na Area de Trabalho
color 0B

echo ========================================
echo   CRIAR ATALHO NA AREA DE TRABALHO
echo ========================================
echo.

REM Usar VBScript para criar o atalho
set "script_path=%~dp0"
set "script_name=INICIAR_SISTEMA.bat"
set "desktop=%USERPROFILE%\Desktop"
set "atalho_nome=Sistema Web NF-e.lnk"

echo Criando atalho na area de trabalho...
echo.

REM Criar arquivo VBScript temporario
set "vbs_file=%TEMP%\criar_atalho_nfe.vbs"

(
echo Set oWS = WScript.CreateObject^("WScript.Shell"^)
echo sLinkFile = "%desktop%\%atalho_nome%"
echo Set oLink = oWS.CreateShortcut^(sLinkFile^)
echo.
echo oLink.TargetPath = "%script_path%%script_name%"
echo oLink.WorkingDirectory = "%script_path%"
echo oLink.Description = "Inicia o Sistema Web de Cadastro de NF-e - Produtos Quimicos"
echo oLink.IconLocation = "C:\Windows\System32\shell32.dll,137"
echo oLink.WindowStyle = 1
echo oLink.Save
echo.
echo WScript.Echo "Atalho criado com sucesso!"
) > "%vbs_file%"

REM Executar VBScript
cscript //nologo "%vbs_file%"

REM Limpar arquivo temporario
del "%vbs_file%"

echo.
echo ========================================
echo   ATALHO CRIADO COM SUCESSO!
echo ========================================
echo.
echo O atalho "%atalho_nome%" foi criado na sua area de trabalho.
echo.
echo Agora voce pode:
echo 1. Dar dois cliques no atalho na area de trabalho
echo 2. O sistema sera iniciado automaticamente
echo.
pause
