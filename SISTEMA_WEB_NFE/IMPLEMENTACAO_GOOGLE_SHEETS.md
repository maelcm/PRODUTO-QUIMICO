# IMPLEMENTAÇÃO DO GOOGLE SHEETS

## ✅ O QUE FOI FEITO

1. **Biblioteca googleapis instalada** no servidor Node.js
2. **Serviço Google Sheets criado** (`server/src/sheets-service.ts`)
   - Autenticação com Service Account
   - Funções para ler/escrever planilhas
   - Criação automática de planilhas
   
3. **Módulo db-sheets.ts criado** (`server/src/db-sheets.ts`)
   - Implementa todas as funções de banco de dados usando Google Sheets
   - Planilhas criadas automaticamente:
     - NF-e_Invoices
     - NF-e_Items
     - Manual_Products
     - Daily_Expenses
     - Users

## ⚠️ STATUS ATUAL

**A implementação está completa, mas NÃO ESTÁ ATIVA.**

O sistema ainda usa MySQL (db.ts). Para ativar Google Sheets, é necessário:

1. Configurar variáveis de ambiente
2. Atualizar routers.ts para usar db-sheets.ts ao invés de db.ts
3. Testar a integração

## 📋 PRÓXIMOS PASSOS

1. **Configurar .env**:
   ```
   GOOGLE_SHEETS_ID=seu_id_aqui
   GOOGLE_CREDENTIALS_PATH=credentials.json
   USE_GOOGLE_SHEETS=true
   ```

2. **Copiar credentials.json**:
   - Do sistema antigo para: `SISTEMA_WEB_NFE\credentials.json`

3. **Compartilhar planilha**:
   - Abrir credentials.json
   - Pegar o email da Service Account (client_email)
   - Compartilhar planilha do Google Sheets com esse email

4. **Atualizar código** (ainda não feito):
   - Modificar `server/src/routers.ts` para usar `db-sheets` quando `USE_GOOGLE_SHEETS=true`
   - Ou criar um wrapper que escolhe entre db.ts e db-sheets.ts

## 🔧 LIMITAÇÕES CONHECIDAS

- Delete não está implementado (Google Sheets requer reescrever toda a planilha)
- Performance pode ser menor que MySQL para grandes volumes
- Não há transações (cada operação é independente)
