# 📝 Passo a Passo - Configuração Completa

## ✅ PASSO 1: Instalação (JÁ FEITO!)

As dependências já foram instaladas com sucesso!

## 📋 PASSO 2: Configurar Banco de Dados MySQL

### 2.1 Criar o Banco

Abra o MySQL e execute:
```sql
CREATE DATABASE nfe_system;
```

### 2.2 Configurar Arquivo .env

1. Na pasta `SISTEMA_WEB_NFE`, copie o arquivo de exemplo:
   ```bash
   copy .env.example .env
   ```

2. Edite o arquivo `.env` e configure:
   ```env
   DATABASE_URL="mysql://seu_usuario:sua_senha@localhost:3306/nfe_system"
   PORT=3001
   NODE_ENV=development
   ```

   **Exemplo:**
   ```env
   DATABASE_URL="mysql://root:minhasenha@localhost:3306/nfe_system"
   ```

## 🔧 PASSO 3: Executar Migrações

```bash
cd server
npm run db:push
```

Isso criará todas as tabelas no banco de dados.

## 🚀 PASSO 4: Iniciar o Sistema

### Opção A: Usar Script (Recomendado)
```bash
.\INICIAR_SISTEMA.bat
```

### Opção B: Comando Manual
```bash
npm run dev
```

Isso iniciará:
- **Backend**: http://localhost:3001
- **Frontend**: http://localhost:5173

## 🔐 PASSO 5: Configurar Autenticação (Temporário)

Por enquanto, para testar, configure no console do navegador (F12):

```javascript
localStorage.setItem('userId', '1');
localStorage.setItem('userEmail', 'teste@exemplo.com');
localStorage.setItem('userName', 'Usuário Teste');
```

Depois recarregue a página.

## ✅ Verificar se Está Funcionando

1. Acesse: http://localhost:5173
2. Você deve ver a página inicial com os cards
3. Tente navegar pelas páginas
4. Teste cadastrar uma nota fiscal

## 🐛 Problemas Comuns

### Erro: "Cannot connect to MySQL"
- Verifique se MySQL está rodando
- Confirme usuário e senha no `.env`
- Verifique se o banco `nfe_system` existe

### Erro: "Port already in use"
- Altere a porta no `.env` (PORT=3002)
- Ou feche a aplicação que está usando a porta

### Frontend não conecta com backend
- Verifique se ambos estão rodando
- Confirme as URLs nos logs do terminal

## 📚 Documentação

- `README.md` - Visão geral
- `COMECAR_USAR.md` - Guia de uso
- `DOCUMENTACAO_COMPLETA.md` - Documentação detalhada
