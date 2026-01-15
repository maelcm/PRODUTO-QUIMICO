# ✅ PROBLEMA RESOLVIDO - Arquivo .env

## O que foi feito:

1. ✅ **Arquivo `.env` criado automaticamente** na raiz do projeto `SISTEMA_WEB_NFE`
2. ✅ **dotenv instalado** no servidor para carregar as variáveis de ambiente
3. ✅ **Código atualizado** para carregar o `.env` corretamente
4. ✅ **Scripts melhorados** para criar o `.env` automaticamente

## Próximos Passos:

### 1. Configurar o DATABASE_URL

Abra o arquivo `.env` na pasta `SISTEMA_WEB_NFE` e configure:

```env
DATABASE_URL=mysql://usuario:senha@localhost:3306/nfe_system
```

**Exemplos:**
- Sem senha: `DATABASE_URL=mysql://root:@localhost:3306/nfe_system`
- Com senha: `DATABASE_URL=mysql://root:minhasenha123@localhost:3306/nfe_system`

### 2. Opções para Configurar:

**Opção A: Script Automático (RECOMENDADO)**
```bash
CONFIGURAR_ENV.bat
```

**Opção B: Editar Manualmente**
Abra o arquivo `.env` com o Bloco de Notas ou seu editor preferido.

### 3. Criar o Banco de Dados

Antes de iniciar, crie o banco de dados no MySQL:

```sql
CREATE DATABASE nfe_system;
```

Ou use o script:
```bash
CRIAR_BANCO.bat
```

### 4. Executar Migrações

Depois de configurar o `.env` e criar o banco:

```bash
EXECUTAR_MIGRACOES.bat
```

### 5. Iniciar o Sistema

Depois de tudo configurado:

```bash
INICIAR_SISTEMA.bat
```

Ou use o atalho na área de trabalho: **"Sistema Web NF-e"**

---

## Scripts Disponíveis:

- `CONFIGURAR_ENV.bat` - Configura o arquivo .env interativamente
- `CRIAR_BANCO.bat` - Cria o banco de dados MySQL
- `EXECUTAR_MIGRACOES.bat` - Executa as migrações do Drizzle
- `INICIAR_SISTEMA.bat` - Inicia o sistema (backend + frontend)
- `SETUP_COMPLETO_AUTOMATICO.bat` - Faz tudo automaticamente
- `RESOLVER_PROBLEMA_ENV.bat` - Resolve problemas com .env

---

## Estrutura do Arquivo .env:

```env
DATABASE_URL=mysql://root:@localhost:3306/nfe_system
PORT=3001
NODE_ENV=development
CLIENT_URL=http://localhost:5173
AUTH_SECRET=your-secret-key-change-this-in-production
MANUS_AUTH_CLIENT_ID=
MANUS_AUTH_CLIENT_SECRET=
```

---

## Verificar se Está Funcionando:

1. Execute: `INICIAR_SISTEMA.bat`
2. Deve aparecer no console:
   ```
   🔧 Carregando configurações de: [caminho]\.env
   📦 DATABASE_URL: Configurado ✓
   🚀 Servidor rodando na porta 3001
   ```

Se aparecer `DATABASE_URL: NÃO CONFIGURADO ✗`, verifique o arquivo `.env`.

---

## Problemas Comuns:

❌ **"Erro ao conectar ao banco"**
→ Verifique se o MySQL está rodando
→ Verifique se o DATABASE_URL está correto
→ Verifique se o banco `nfe_system` foi criado

❌ **"Arquivo .env não encontrado"**
→ Execute: `RESOLVER_PROBLEMA_ENV.bat`

❌ **"Porta já em uso"**
→ Feche outras aplicações usando as portas 3001 ou 5173

---

✅ **Agora você pode iniciar o sistema!**
