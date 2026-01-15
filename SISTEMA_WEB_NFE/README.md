# Sistema Web de Cadastro de Notas Fiscais de Produtos Químicos

Sistema completo para gerenciamento de notas fiscais, rastreabilidade e controle de estoque de produtos químicos.

## 🚀 Stack Tecnológica

- **Frontend**: React 19 + Tailwind CSS 4 + TypeScript
- **Backend**: Node.js + Express + tRPC 11
- **Banco de Dados**: MySQL com Drizzle ORM
- **Autenticação**: OAuth (Manus Auth) - *A implementar*
- **Testes**: Vitest

## 📋 Funcionalidades

- ✅ Cadastro de NF-e via chave de acesso (44 dígitos)
- ✅ Upload e parse de XML de NF-e
- ✅ Cadastro manual de produtos
- ✅ Dashboard de rastreabilidade unificado
- ✅ Controle de estoque e gastos diários
- ✅ Cálculo automático de status de validade
- ✅ Histórico completo de movimentações

## 🏗️ Estrutura do Projeto

```
SISTEMA_WEB_NFE/
├── client/          # Frontend React
│   ├── src/
│   │   ├── pages/   # Páginas principais
│   │   ├── components/ # Componentes reutilizáveis
│   │   └── lib/     # Configurações (tRPC, etc)
│   └── package.json
├── server/          # Backend Node.js + tRPC
│   ├── src/
│   │   ├── routers.ts    # Routers tRPC
│   │   ├── db.ts         # Funções de database
│   │   ├── nfe-parser.ts # Parser XML
│   │   └── index.ts      # Servidor Express
│   └── package.json
├── drizzle/         # Schema do banco de dados
│   └── schema.ts
└── package.json     # Scripts principais
```

## 🔧 Instalação

Veja o arquivo `INSTALACAO.md` para instruções detalhadas.

### Passos Rápidos:

```bash
# 1. Instalar dependências
npm install
cd server && npm install
cd ../client && npm install

# 2. Configurar .env
cp .env.example .env
# Editar .env com suas configurações

# 3. Criar banco de dados MySQL
# CREATE DATABASE nfe_system;

# 4. Executar migrações
cd server
npm run db:push

# 5. Iniciar desenvolvimento
cd ..
npm run dev
```

## 📝 Documentação

- `INSTALACAO.md` - Guia completo de instalação
- `DOCUMENTACAO_COMPLETA.md` - Documentação detalhada do sistema

## 🎯 Status do Projeto

### ✅ Concluído
- Schema do banco de dados (Drizzle ORM)
- Funções de database completas
- Parser XML de NF-e
- Routers tRPC (nfe, products, expenses)
- Servidor Express + tRPC
- Estrutura base do frontend React
- Páginas: Home, NfeList
- Componentes: PageHeader

### ⏳ Em Desenvolvimento
- Páginas restantes (NfeCreate, NfeDetail, NfeUploadXml, ManualProductCreate, Traceability, StockControl)
- Autenticação OAuth (Manus Auth)
- Testes automatizados

### 📋 Próximos Passos
1. Completar todas as páginas do frontend
2. Implementar autenticação
3. Adicionar validações e tratamento de erros
4. Escrever testes
5. Deploy e documentação final
