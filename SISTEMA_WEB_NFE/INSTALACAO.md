# 📦 Guia de Instalação - Sistema Web de NF-e

## Pré-requisitos

- Node.js 18+ instalado
- MySQL 8.0+ instalado e rodando
- npm ou yarn

## Passo a Passo

### 1. Instalar Dependências

```bash
# Na raiz do projeto
npm install

# No servidor
cd server
npm install

# No cliente
cd ../client
npm install
```

### 2. Configurar Banco de Dados

1. Crie um banco de dados MySQL:
```sql
CREATE DATABASE nfe_system;
```

2. Configure a URL de conexão no arquivo `.env`:
```
DATABASE_URL="mysql://usuario:senha@localhost:3306/nfe_system"
```

### 3. Executar Migrações

```bash
cd server
npm run db:push
```

Isso criará todas as tabelas no banco de dados.

### 4. Configurar Variáveis de Ambiente

Copie `.env.example` para `.env` e preencha as variáveis necessárias:

- `DATABASE_URL`: URL de conexão com MySQL
- `AUTH_SECRET`: Chave secreta para autenticação
- `MANUS_AUTH_CLIENT_ID`: ID do cliente OAuth
- `MANUS_AUTH_CLIENT_SECRET`: Secret do cliente OAuth

### 5. Iniciar o Sistema

```bash
# Na raiz do projeto
npm run dev
```

Isso iniciará:
- Backend na porta 3001
- Frontend na porta 5173 (ou outra porta disponível)

### 6. Acessar o Sistema

Abra seu navegador em: `http://localhost:5173`

## Estrutura de Pastas

```
SISTEMA_WEB_NFE/
├── client/          # Frontend React
├── server/          # Backend Node.js
├── drizzle/         # Schema do banco
└── shared/          # Código compartilhado
```

## Próximos Passos

Após a instalação, consulte `DOCUMENTACAO.md` para entender como usar o sistema.
