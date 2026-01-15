# Script PowerShell para facilitar o uso do sistema
# Execute: .\COMANDOS_POWERSHELL.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SISTEMA WEB NF-e - PRODUTOS QUIMICOS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se está no diretório correto
if (-not (Test-Path "package.json")) {
    Write-Host "AVISO: package.json nao encontrado!" -ForegroundColor Yellow
    Write-Host "Navegando para SISTEMA_WEB_NFE..." -ForegroundColor Yellow
    if (Test-Path "..\SISTEMA_WEB_NFE\package.json") {
        Set-Location "..\SISTEMA_WEB_NFE"
    } elseif (Test-Path "SISTEMA_WEB_NFE\package.json") {
        Set-Location "SISTEMA_WEB_NFE"
    } else {
        Write-Host "ERRO: Nao foi possivel encontrar o sistema!" -ForegroundColor Red
        Write-Host "Por favor, navegue manualmente para: C:\Users\Info\PRODUTO QUIMICO\SISTEMA_WEB_NFE" -ForegroundColor Yellow
        exit
    }
}

Write-Host "Diretorio atual: $(Get-Location)" -ForegroundColor Green
Write-Host ""

function Show-Menu {
    Write-Host "Escolha uma opcao:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Verificar Setup" -ForegroundColor White
    Write-Host "2. Instalar Todas as Dependencias" -ForegroundColor White
    Write-Host "3. Iniciar Sistema (Backend + Frontend)" -ForegroundColor White
    Write-Host "4. Executar Migracoes do Banco" -ForegroundColor White
    Write-Host "5. Abrir Windows Explorer" -ForegroundColor White
    Write-Host "6. Sair" -ForegroundColor White
    Write-Host ""
}

function Verify-Setup {
    Write-Host "Verificando Node.js..." -ForegroundColor Cyan
    $nodeVersion = node --version 2>$null
    if ($nodeVersion) {
        Write-Host "[OK] Node.js: $nodeVersion" -ForegroundColor Green
    } else {
        Write-Host "[ERRO] Node.js nao encontrado!" -ForegroundColor Red
        return $false
    }
    
    Write-Host "Verificando npm..." -ForegroundColor Cyan
    $npmVersion = npm --version 2>$null
    if ($npmVersion) {
        Write-Host "[OK] npm: $npmVersion" -ForegroundColor Green
    } else {
        Write-Host "[ERRO] npm nao encontrado!" -ForegroundColor Red
        return $false
    }
    
    Write-Host "Verificando estrutura..." -ForegroundColor Cyan
    if (Test-Path "server") { Write-Host "[OK] Pasta server existe" -ForegroundColor Green }
    if (Test-Path "client") { Write-Host "[OK] Pasta client existe" -ForegroundColor Green }
    if (Test-Path ".env") { Write-Host "[OK] Arquivo .env existe" -ForegroundColor Green } else { Write-Host "[AVISO] Arquivo .env nao encontrado" -ForegroundColor Yellow }
    
    return $true
}

function Install-Dependencies {
    Write-Host "Instalando dependencias principais..." -ForegroundColor Cyan
    npm install
    if ($LASTEXITCODE -ne 0) { return $false }
    
    Write-Host "Instalando dependencias do servidor..." -ForegroundColor Cyan
    Set-Location server
    npm install
    Set-Location ..
    if ($LASTEXITCODE -ne 0) { return $false }
    
    Write-Host "Instalando dependencias do cliente..." -ForegroundColor Cyan
    Set-Location client
    npm install
    Set-Location ..
    if ($LASTEXITCODE -ne 0) { return $false }
    
    Write-Host "[OK] Todas as dependencias instaladas!" -ForegroundColor Green
    return $true
}

function Run-Migrations {
    Write-Host "Executando migracoes do banco de dados..." -ForegroundColor Cyan
    Set-Location server
    npm run db:push
    $result = $LASTEXITCODE
    Set-Location ..
    return ($result -eq 0)
}

function Start-System {
    Write-Host "Iniciando sistema..." -ForegroundColor Cyan
    Write-Host "Backend: http://localhost:3001" -ForegroundColor Yellow
    Write-Host "Frontend: http://localhost:5173" -ForegroundColor Yellow
    Write-Host ""
    npm run dev
}

# Menu principal
do {
    Show-Menu
    $opcao = Read-Host "Digite o numero da opcao"
    
    switch ($opcao) {
        "1" {
            Verify-Setup
            Write-Host ""
            Read-Host "Pressione Enter para continuar"
        }
        "2" {
            Install-Dependencies
            Write-Host ""
            Read-Host "Pressione Enter para continuar"
        }
        "3" {
            Start-System
        }
        "4" {
            Run-Migrations
            Write-Host ""
            Read-Host "Pressione Enter para continuar"
        }
        "5" {
            explorer .
        }
        "6" {
            Write-Host "Saindo..." -ForegroundColor Yellow
            exit
        }
        default {
            Write-Host "Opcao invalida!" -ForegroundColor Red
            Start-Sleep -Seconds 1
        }
    }
} while ($true)
