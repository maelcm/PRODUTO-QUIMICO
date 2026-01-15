# Script PowerShell para criar atalho na área de trabalho
# Execute: powershell -ExecutionPolicy Bypass -File criar_atalho_desktop.ps1

$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut([Environment]::GetFolderPath("Desktop") + "\Smart Inventory System.lnk")
$Shortcut.TargetPath = (Resolve-Path "INICIAR_SISTEMA.bat").Path
$Shortcut.WorkingDirectory = $PSScriptRoot
$Shortcut.Description = "Inicia o Smart Inventory System - Sistema de Controle de Estoque"
$Shortcut.IconLocation = "C:\Windows\System32\shell32.dll,137"  # Ícone de pasta/computador
$Shortcut.Save()

Write-Host "Atalho criado com sucesso na area de trabalho!" -ForegroundColor Green
Write-Host "Nome: Smart Inventory System.lnk" -ForegroundColor Yellow
Write-Host ""
Write-Host "Agora voce pode abrir o sistema com um duplo clique no atalho!" -ForegroundColor Cyan
