# COMO ATIVAR GOOGLE SHEETS NO SISTEMA

## ⚠️ ATENÇÃO: Implementação em Progresso

A adaptação para Google Sheets está sendo implementada. Por enquanto, o sistema ainda usa MySQL.

## Passos para quando estiver pronto:

1. **Copiar credentials.json**
   - Copie o arquivo `credentials.json` do sistema antigo (Python)
   - Para: `SISTEMA_WEB_NFE\credentials.json`

2. **Configurar .env**
   - Abra: `SISTEMA_WEB_NFE\.env`
   - Adicione:
     ```
     GOOGLE_SHEETS_ID=seu_id_da_planilha
     GOOGLE_CREDENTIALS_PATH=credentials.json
     USE_GOOGLE_SHEETS=true
     ```

3. **Compartilhar planilha**
   - Abra `credentials.json`
   - Procure por `client_email`
   - Compartilhe sua planilha do Google Sheets com esse email
   - Dê permissão de "Editor"

4. **Reiniciar sistema**
   - Feche o sistema atual
   - Execute: `INICIAR_SISTEMA.bat`

---

**Status atual:** Serviço Google Sheets criado, mas ainda não está integrado. O sistema continua usando MySQL.
