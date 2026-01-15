# 🚀 Guia Rápido - Como Iniciar o Sistema

## ⚠️ IMPORTANTE: Você precisa estar no diretório correto!

O sistema está na pasta **`SISTEMA_WEB_NFE`**, não na raiz do projeto.

## 📍 Localização Correta

```
C:\Users\Info\PRODUTO QUIMICO\
└── SISTEMA_WEB_NFE\          ← VOCÊ PRECISA ESTAR AQUI!
    ├── server\
    ├── client\
    └── package.json
```

## 🎯 Método Mais Fácil (Recomendado)

### 1. Abrir o Windows Explorer
- Navegue até: `C:\Users\Info\PRODUTO QUIMICO\SISTEMA_WEB_NFE`
- Dê duplo clique em: **`INSTALAR_TUDO.bat`**
- Aguarde a instalação terminar
- Depois, dê duplo clique em: **`INICIAR_SISTEMA.bat`**

## 💻 Método via Terminal/PowerShell

### Passo 1: Navegar para o diretório correto

```powershell
cd "C:\Users\Info\PRODUTO QUIMICO\SISTEMA_WEB_NFE"
```

### Passo 2: Verificar setup

```powershell
.\VERIFICAR_SETUP.bat
```

### Passo 3: Instalar dependências (se necessário)

```powershell
.\INSTALAR_TUDO.bat
```

### Passo 4: Configurar banco de dados

```powershell
# Criar banco MySQL primeiro (no MySQL)
# CREATE DATABASE nfe_system;

# Executar migrações
cd server
npm run db:push
cd ..
```

### Passo 5: Iniciar sistema

```powershell
npm run dev
```

Ou simplesmente:

```powershell
.\INICIAR_SISTEMA.bat
```

## 📋 Checklist Antes de Iniciar

- [ ] Node.js instalado (`node --version`)
- [ ] MySQL instalado e rodando
- [ ] Banco de dados `nfe_system` criado
- [ ] Arquivo `.env` configurado (copiar de `.env.example`)
- [ ] Dependências instaladas (`npm install`)
- [ ] Migrações executadas (`npm run db:push` no servidor)

## 🔧 Comandos Úteis

```powershell
# Verificar Node.js
node --version

# Verificar npm
npm --version

# Instalar dependências principais
npm install

# Instalar dependências do servidor
cd server
npm install

# Instalar dependências do cliente
cd client
npm install

# Executar migrações do banco
cd server
npm run db:push

# Iniciar desenvolvimento
cd ..
npm run dev
```

## ❓ Problemas Comuns

### "package.json não encontrado"
- **Solução:** Você está no diretório errado! Vá para `SISTEMA_WEB_NFE`

### "server não encontrado"
- **Solução:** Você está na raiz do projeto. Execute: `cd SISTEMA_WEB_NFE`

### "npm não é reconhecido"
- **Solução:** Instale o Node.js de https://nodejs.org/

### Erro de conexão com banco
- **Solução:** Verifique o arquivo `.env` e se o MySQL está rodando
