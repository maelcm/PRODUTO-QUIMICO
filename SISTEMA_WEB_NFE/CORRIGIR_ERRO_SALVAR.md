# CORREÇÃO DO ERRO AO SALVAR NOTA

## ❌ Erro Atual

O erro acontece porque:
1. O MySQL não está configurado (sem senha, acesso negado)
2. O código ainda está usando MySQL (db.ts) 
3. O Drizzle ORM não consegue funcionar sem conexão MySQL válida

## ✅ Soluções Possíveis

### Opção 1: Configurar MySQL (Recomendado para produção)
1. Adicionar senha do MySQL no arquivo `.env`:
   ```
   DATABASE_URL=mysql://root:SUA_SENHA@localhost:3306/nfe_system
   ```
2. Ou configurar MySQL sem senha (menos seguro)

### Opção 2: Usar Google Sheets
1. Adicionar ao `.env`:
   ```
   USE_GOOGLE_SHEETS=true
   GOOGLE_SHEETS_ID=seu_id_aqui
   GOOGLE_CREDENTIALS_PATH=credentials.json
   ```
2. Copiar `credentials.json` para `SISTEMA_WEB_NFE/`
3. Compartilhar planilha com o email da Service Account

### Opção 3: Correção Temporária
Modificar o código para usar Google Sheets quando MySQL falhar (implementação mais complexa).

## 🔧 Implementação Atual

O código já tenta detectar `USE_GOOGLE_SHEETS=true`, mas:
- Por padrão, usa MySQL
- Se MySQL falhar, o erro acontece antes de tentar Google Sheets
- Precisa configurar explicitamente `USE_GOOGLE_SHEETS=true` no `.env`
