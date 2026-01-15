# Setup Completo Automatico - Sistema NF-e
# Execute: .\SETUP_COMPLETO_AUTOMATICO.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SETUP COMPLETO AUTOMATICO" -ForegroundColor Cyan
Write-Host "  Sistema Web NF-e - Produtos Quimicos" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Navegar para o diretorio do script
Set-Location $PSScriptRoot

# Verificar se esta no diretorio correto
if (-not (Test-Path "package.json")) {
    Write-Host "ERRO: package.json nao encontrado!" -ForegroundColor Red
    Write-Host "Certifique-se de que este script esta na pasta SISTEMA_WEB_NFE" -ForegroundColor Yellow
    Read-Host "Pressione Enter para sair"
    exit 1
}

# Funcao para instalar dependencias
function Install-Dependencies {
    param([string]$Path, [string]$Name, [switch]$LegacyPeerDeps)
    
    Push-Location $Path
    if (-not (Test-Path "node_modules")) {
        Write-Host "Instalando dependencias de $Name..." -ForegroundColor Yellow
        if ($LegacyPeerDeps) {
            npm install --legacy-peer-deps
        } else {
            npm install
        }
        if ($LASTEXITCODE -ne 0) {
            Write-Host "ERRO ao instalar dependencias de $Name!" -ForegroundColor Red
            Pop-Location
            return $false
        }
        Write-Host "[OK] Dependencias de $Name instaladas" -ForegroundColor Green
    } else {
        Write-Host "[OK] Dependencias de $Name ja instaladas" -ForegroundColor Green
    }
    Pop-Location
    return $true
}

# [1/8] Verificar Node.js
Write-Host "[1/8] Verificando Node.js..." -ForegroundColor Cyan
$nodeVersion = node --version 2>$null
if (-not $nodeVersion) {
    Write-Host "ERRO: Node.js nao encontrado!" -ForegroundColor Red
    Write-Host "Por favor, instale o Node.js de: https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "Pressione Enter para sair"
    exit 1
}
Write-Host "[OK] Node.js: $nodeVersion" -ForegroundColor Green
Write-Host ""

# [2/8] Verificar MySQL
Write-Host "[2/8] Verificando MySQL..." -ForegroundColor Cyan
$mysqlVersion = mysql --version 2>$null
if ($mysqlVersion) {
    Write-Host "[OK] MySQL encontrado" -ForegroundColor Green
} else {
    Write-Host "[AVISO] MySQL pode nao estar no PATH" -ForegroundColor Yellow
    Write-Host "Certifique-se de que o MySQL esta instalado e rodando" -ForegroundColor Yellow
}
Write-Host ""

# [3/8] Instalar dependencias principais
Write-Host "[3/8] Instalando dependencias principais..." -ForegroundColor Cyan
if (-not (Install-Dependencies -Path "." -Name "raiz")) {
    Read-Host "Pressione Enter para sair"
    exit 1
}
Write-Host ""

# [4/8] Instalar dependencias do servidor
Write-Host "[4/8] Instalando dependencias do servidor..." -ForegroundColor Cyan
if (-not (Install-Dependencies -Path "server" -Name "servidor")) {
    Read-Host "Pressione Enter para sair"
    exit 1
}
Write-Host ""

# [5/8] Instalar dependencias do cliente
Write-Host "[5/8] Instalando dependencias do cliente..." -ForegroundColor Cyan
if (-not (Install-Dependencies -Path "client" -Name "cliente" -LegacyPeerDeps)) {
    Read-Host "Pressione Enter para sair"
    exit 1
}
Write-Host ""

# [6/8] Configurar .env
Write-Host "[6/8] Configurando arquivo .env..." -ForegroundColor Cyan
if (-not (Test-Path ".env")) {
    Write-Host "Arquivo .env nao encontrado. Criando..." -ForegroundColor Yellow
    
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "[OK] Arquivo .env criado a partir de .env.example" -ForegroundColor Green
    } else {
        $envContent = @"
DATABASE_URL=mysql://root:@localhost:3306/nfe_system
PORT=3001
NODE_ENV=development
CLIENT_URL=http://localhost:5173
"@
        Set-Content -Path ".env" -Value $envContent
        Write-Host "[OK] Arquivo .env criado" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host "  CONFIGURAR .env" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "IMPORTANTE: Configure o arquivo .env com suas credenciais do MySQL!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Abra o arquivo .env e configure:" -ForegroundColor White
    Write-Host '  DATABASE_URL="mysql://usuario:senha@localhost:3306/nfe_system"' -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Exemplo:" -ForegroundColor White
    Write-Host '  DATABASE_URL="mysql://root:minhasenha123@localhost:3306/nfe_system"' -ForegroundColor Cyan
    Write-Host ""
    
    $continuar = Read-Host "Deseja abrir o arquivo .env para editar agora? (S/N)"
    if ($continuar -eq "S" -or $continuar -eq "s") {
        notepad .env
    }
} else {
    Write-Host "[OK] Arquivo .env ja existe" -ForegroundColor Green
}
Write-Host ""

# [7/8] Executar migracoes
Write-Host "[7/8] Executando migracoes do banco de dados..." -ForegroundColor Cyan
Write-Host ""
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "  CONFIGURACAO DO BANCO" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "IMPORTANTE: Antes de continuar, certifique-se de:" -ForegroundColor Yellow
Write-Host "1. MySQL esta instalado e rodando" -ForegroundColor White
Write-Host "2. O banco de dados foi criado:" -ForegroundColor White
Write-Host "   CREATE DATABASE nfe_system;" -ForegroundColor Cyan
Write-Host "3. O arquivo .env esta configurado corretamente" -ForegroundColor White
Write-Host ""

$continuar = Read-Host "Deseja continuar com as migracoes? (S/N)"
if ($continuar -ne "S" -and $continuar -ne "s") {
    Write-Host ""
    Write-Host "Setup pausado. Execute novamente quando estiver pronto." -ForegroundColor Yellow
    Read-Host "Pressione Enter para sair"
    exit 0
}

Write-Host ""
Write-Host "Executando migracoes..." -ForegroundColor Cyan
Set-Location server
npm run db:push
$migrationResult = $LASTEXITCODE
Set-Location ..

if ($migrationResult -ne 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "  ERRO AO EXECUTAR MIGRACOES" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Possiveis causas:" -ForegroundColor Yellow
    Write-Host "1. Banco de dados 'nfe_system' nao foi criado" -ForegroundColor White
    Write-Host "2. DATABASE_URL incorreto no arquivo .env" -ForegroundColor White
    Write-Host "3. MySQL nao esta rodando" -ForegroundColor White
    Write-Host "4. Usuario/senha incorretos no .env" -ForegroundColor White
    Write-Host ""
    Write-Host "Verifique o arquivo .env e tente novamente." -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Pressione Enter para sair"
    exit 1
}

Write-Host "[OK] Migracoes executadas com sucesso!" -ForegroundColor Green
Write-Host ""

# [8/8] Conclusao
Write-Host "[8/8] Setup concluido!" -ForegroundColor Cyan
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  SETUP CONCLUIDO COM SUCESSO!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Pronto para iniciar o sistema!" -ForegroundColor Yellow
Write-Host ""

$iniciar = Read-Host "Deseja iniciar o sistema agora? (S/N)"
if ($iniciar -eq "S" -or $iniciar -eq "s") {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  INICIANDO SISTEMA" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Backend: http://localhost:3001" -ForegroundColor Yellow
    Write-Host "Frontend: http://localhost:5173" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Pressione Ctrl+C para parar o sistema" -ForegroundColor White
    Write-Host ""
    npm run dev
} else {
    Write-Host ""
    Write-Host "Para iniciar o sistema depois, execute:" -ForegroundColor Yellow
    Write-Host "  npm run dev" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Ou use o script: .\INICIAR_SISTEMA.bat" -ForegroundColor Cyan
    Write-Host ""
    Read-Host "Pressione Enter para sair"
}
