@echo off
title Verificacao de Setup - Sistema NF-e
color 0E

echo ========================================
echo   VERIFICACAO DE CONFIGURACAO
echo ========================================
echo.

cd /d "%~dp0"

echo [1/6] Verificando Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo [X] Node.js NAO encontrado!
    echo     Instale de: https://nodejs.org/
    goto :end
) else (
    echo [OK] Node.js encontrado:
    node --version
)
echo.

echo [2/6] Verificando npm...
npm --version >nul 2>&1
if errorlevel 1 (
    echo [X] npm NAO encontrado!
    goto :end
) else (
    echo [OK] npm encontrado:
    npm --version
)
echo.

echo [3/6] Verificando estrutura de pastas...
if exist "server" (
    echo [OK] Pasta server existe
) else (
    echo [X] Pasta server NAO encontrada!
    goto :end
)

if exist "client" (
    echo [OK] Pasta client existe
) else (
    echo [X] Pasta client NAO encontrada!
    goto :end
)

if exist "drizzle" (
    echo [OK] Pasta drizzle existe
) else (
    echo [X] Pasta drizzle NAO encontrada!
    goto :end
)
echo.

echo [4/6] Verificando arquivos de configuracao...
if exist "package.json" (
    echo [OK] package.json existe
) else (
    echo [X] package.json NAO encontrado!
    goto :end
)

if exist "server\package.json" (
    echo [OK] server/package.json existe
) else (
    echo [X] server/package.json NAO encontrado!
    goto :end
)

if exist "client\package.json" (
    echo [OK] client/package.json existe
) else (
    echo [X] client/package.json NAO encontrado!
    goto :end
)

if exist ".env" (
    echo [OK] Arquivo .env existe
) else (
    echo [AVISO] Arquivo .env NAO encontrado!
    echo         Copie .env.example para .env e configure
)
echo.

echo [5/6] Verificando dependencias instaladas...
if exist "node_modules" (
    echo [OK] Dependencias principais instaladas
) else (
    echo [AVISO] Dependencias principais NAO instaladas
    echo         Execute: npm install
)

if exist "server\node_modules" (
    echo [OK] Dependencias do servidor instaladas
) else (
    echo [AVISO] Dependencias do servidor NAO instaladas
    echo         Execute: cd server ^&^& npm install
)

if exist "client\node_modules" (
    echo [OK] Dependencias do cliente instaladas
) else (
    echo [AVISO] Dependencias do cliente NAO instaladas
    echo         Execute: cd client ^&^& npm install
)
echo.

echo [6/6] Verificando banco de dados...
echo [INFO] Verifique manualmente se:
echo        - MySQL esta instalado e rodando
echo        - Banco de dados 'nfe_system' foi criado
echo        - Arquivo .env tem DATABASE_URL configurado
echo        - Migracoes foram executadas (npm run db:push)
echo.

:end
echo ========================================
echo   VERIFICACAO CONCLUIDA
echo ========================================
echo.
pause
