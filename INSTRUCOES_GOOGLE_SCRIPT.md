# Como Adicionar o Script no Google Sheets

## Passo a Passo:

### 1. Abrir o Apps Script
- Abra sua planilha do Google Sheets
- Vá em **Extensões** > **Apps Script**

### 2. Colar o Código
- Delete qualquer código existente
- Cole o código do arquivo `google-apps-script.js`
- Clique em **Salvar** (ícone de disquete) ou pressione `Ctrl+S`
- Dê um nome ao projeto (ex: "Calcular Valor Total")

### 3. Configurar Triggers (Automático)
O script já está configurado para executar automaticamente quando você editar a planilha.

### 4. Calcular Valores Existentes (Opcional)
Se você já tem notas cadastradas sem `Valor_Total`:

1. No editor do Apps Script, selecione a função `calcularTodosValoresTotais`
2. Clique no botão **Executar** (▶️)
3. Na primeira vez, ele pedirá autorização:
   - Clique em **Revisar permissões**
   - Escolha sua conta Google
   - Clique em **Avançado** > **Ir para [nome do projeto] (não seguro)**
   - Clique em **Permitir**
4. Aguarde a execução terminar
5. Volte para a planilha e veja os valores calculados!

### 4. Configurar Trigger Periódico (IMPORTANTE!)
Para que o script calcule valores quando o backend adiciona linhas via API:

1. No editor do Apps Script, selecione a função `configurarTriggerPeriodico`
2. Clique no botão **Executar** (▶️)
3. Autorize se necessário (igual ao passo 4.3)
4. Aguarde a mensagem de sucesso: "✅ Trigger periódico configurado com sucesso!"
5. **Pronto!** Agora o script irá recalcular valores a cada 5 minutos

### 5. Calcular Valores Existentes (Opcional)
Se você já tem notas cadastradas sem `Valor_Total`:

1. No editor do Apps Script, selecione a função `calcularTodosValoresTotais`
2. Clique no botão **Executar** (▶️)
3. Aguarde a execução terminar
4. Volte para a planilha e veja os valores calculados!

### 6. Testar
- Edite a coluna `Quantidade` ou `Valor_Unitario` de qualquer linha na aba `NF-e_Items`
- O `Valor_Total` deve ser calculado automaticamente!
- Cadastre uma nova nota via sistema - o valor será calculado em até 5 minutos (ou execute `calcularTodosValoresTotais` manualmente)

---

## O que o Script Faz:

✅ **Calcula automaticamente** `Valor_Total = Quantidade × Valor_Unitario`
✅ **Atualiza em tempo real** quando você edita `Quantidade` ou `Valor_Unitario`
✅ **Formata no padrão pt-BR** (usa vírgula como separador decimal)
✅ **Funciona para novas linhas** adicionadas pelo sistema ou manualmente

## Observações:

- O script só funciona na aba `NF-e_Items`
- Ignora a linha de cabeçalho
- Se `Quantidade` ou `Valor_Unitario` estiverem vazios, não calcula
- Valores são formatados com vírgula (ex: `318,75`)
