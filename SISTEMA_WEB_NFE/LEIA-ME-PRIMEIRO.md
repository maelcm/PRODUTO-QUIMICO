# 🎯 LEIA-ME PRIMEIRO - Sistema Web NF-e

## ✅ INSTALAÇÃO CONCLUÍDA!

Todas as dependências foram instaladas com sucesso!

## 📍 Você está no diretório correto!

**Localização:** `C:\Users\Info\PRODUTO QUIMICO\SISTEMA_WEB_NFE`

## 🚀 PRÓXIMOS PASSOS (IMPORTANTE!)

### 1. Criar Banco de Dados MySQL

Execute no MySQL:
```sql
CREATE DATABASE nfe_system;
```

### 2. Configurar Arquivo .env

Na pasta atual, crie o arquivo `.env`:

```env
DATABASE_URL="mysql://seu_usuario:sua_senha@localhost:3306/nfe_system"
PORT=3001
NODE_ENV=development
CLIENT_URL="http://localhost:5173"
```

**Exemplo real:**
```env
DATABASE_URL="mysql://root:minhasenha123@localhost:3306/nfe_system"
PORT=3001
NODE_ENV=development
CLIENT_URL="http://localhost:5173"
```

### 3. Executar Migrações

No terminal, execute:
```bash
cd server
npm run db:push
cd ..
```

Isso criará todas as tabelas no banco.

### 4. Iniciar o Sistema

**Opção A - Script Automático (Recomendado):**
```bash
.\INICIAR_SISTEMA.bat
```

**Opção B - Comando Manual:**
```bash
npm run dev
```

O sistema iniciará:
- ✅ Backend: http://localhost:3001
- ✅ Frontend: http://localhost:5173

## 🔐 Autenticação (Temporário para Teste)

Para testar o sistema, configure no console do navegador (F12 → Console):

```javascript
localStorage.setItem('userId', '1');
localStorage.setItem('userEmail', 'teste@exemplo.com');
localStorage.setItem('userName', 'Usuário Teste');
```

Depois recarregue a página.

## ✅ Verificação

Depois de iniciar, você deve ver:
1. ✅ Terminal mostrando "Servidor rodando na porta 3001"
2. ✅ Terminal mostrando "Local: http://localhost:5173"
3. ✅ Navegador aberto automaticamente
4. ✅ Página inicial com cards de funcionalidades

## 📚 Documentação Completa

- `README.md` - Visão geral do sistema
- `COMECAR_USAR.md` - Como usar cada funcionalidade
- `PASSO_A_PASSO.md` - Guia passo a passo completo
- `DOCUMENTACAO_COMPLETA.md` - Documentação técnica

## 🆘 Problemas?

Veja `GUIA_RAPIDO.md` ou `STATUS_INSTALACAO.md` para troubleshooting.
