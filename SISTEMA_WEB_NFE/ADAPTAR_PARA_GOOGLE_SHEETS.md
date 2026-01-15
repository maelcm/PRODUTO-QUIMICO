# ADAPTAÇÃO DO SISTEMA PARA GOOGLE SHEETS

Este documento explica como adaptar o sistema novo (SISTEMA_WEB_NFE) para salvar dados no Google Sheets ao invés de MySQL.

## Estrutura das Planilhas

O sistema criará as seguintes planilhas no Google Sheets:

1. **NF-e Invoices** - Notas Fiscais
2. **NF-e Items** - Itens das Notas Fiscais
3. **Manual Products** - Produtos cadastrados manualmente
4. **Stock Movements** - Movimentações de estoque
5. **Daily Expenses** - Gastos diários

## Configuração Necessária

1. Adicionar ao arquivo `.env` na pasta `SISTEMA_WEB_NFE`:
```
GOOGLE_SHEETS_ID=id_da_sua_planilha_google_sheets
GOOGLE_CREDENTIALS_PATH=credentials.json
```

2. Copiar o arquivo `credentials.json` (do sistema antigo) para a pasta `SISTEMA_WEB_NFE`

3. Compartilhar a planilha do Google Sheets com o email da Service Account (que está no credentials.json)

## Status da Implementação

- ✅ Serviço Google Sheets criado (`sheets-service.ts`)
- ⏳ Adaptação das funções de banco de dados (em progresso)
- ⏳ Testes de salvamento
