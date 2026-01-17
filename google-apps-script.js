/**
 * Script do Google Apps Script para calcular automaticamente Valor_Total
 * na aba NF-e_Items da planilha
 * 
 * INSTRUÇÕES:
 * 1. Abra sua planilha do Google Sheets
 * 2. Vá em Extensões > Apps Script
 * 3. Cole este código
 * 4. Salve o projeto (Ctrl+S)
 * 5. Execute a função "onEdit" uma vez para testar (opcional)
 * 
 * O script irá calcular automaticamente Valor_Total = Quantidade × Valor_Unitario
 * sempre que uma linha for editada ou adicionada na aba NF-e_Items
 */

/**
 * Função executada automaticamente quando a planilha é editada
 */
function onEdit(e) {
  const sheet = e.source.getActiveSheet();
  const sheetName = sheet.getName();
  
  // Verificar se é a aba NF-e_Items
  if (sheetName !== 'NF-e_Items') {
    return;
  }
  
  const row = e.range.getRow();
  const col = e.range.getColumn();
  
  // Ignorar se for a linha de cabeçalho
  if (row === 1) {
    return;
  }
  
  // Calcular valor total para a linha editada
  calcularValorTotalParaLinha(sheet, row);
}

/**
 * Calcula o Valor_Total para uma linha específica
 */
function calcularValorTotalParaLinha(sheet, row) {
  // Obter cabeçalhos
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  // Encontrar índices das colunas
  const qtyColIndex = headers.indexOf('Quantidade') + 1;
  const unitPriceColIndex = headers.indexOf('Valor_Unitario') + 1;
  const totalPriceColIndex = headers.indexOf('Valor_Total') + 1;
  
  // Se as colunas não foram encontradas, retornar
  if (qtyColIndex === 0 || unitPriceColIndex === 0 || totalPriceColIndex === 0) {
    return;
  }
  
  // Obter valores (suporta tanto número quanto string com vírgula)
  let quantity = sheet.getRange(row, qtyColIndex).getValue();
  let unitPrice = sheet.getRange(row, unitPriceColIndex).getValue();
  
  // Se vier como string (com vírgula), converter para número
  if (typeof quantity === 'string') {
    quantity = parseFloat(quantity.replace(',', '.')) || 0;
  }
  if (typeof unitPrice === 'string') {
    unitPrice = parseFloat(unitPrice.replace(',', '.')) || 0;
  }
  
  // Calcular valor total
  if (quantity && unitPrice) {
    const totalPrice = quantity * unitPrice;
    
    // Salvar como número (o Google Sheets formatará automaticamente)
    sheet.getRange(row, totalPriceColIndex).setValue(totalPrice);
    
    // Formatar a célula como moeda pt-BR
    sheet.getRange(row, totalPriceColIndex).setNumberFormat('#,##0.00');
  }
}

/**
 * Função para calcular todos os Valores Totais existentes
 * Execute esta função uma vez para calcular valores de linhas já existentes
 */
function calcularTodosValoresTotais() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('NF-e_Items');
  
  if (!sheet) {
    Logger.log('Aba NF-e_Items não encontrada!');
    return;
  }
  
  // Obter todas as linhas de dados (excluindo cabeçalho)
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    Logger.log('Nenhuma linha de dados encontrada!');
    return;
  }
  
  // Processar cada linha
  let calculados = 0;
  for (let row = 2; row <= lastRow; row++) {
    calcularValorTotalParaLinha(sheet, row);
    calculados++;
  }
  
  Logger.log(`Valores calculados: ${calculados} linhas`);
}

/**
 * Função para ser executada periodicamente (trigger de tempo)
 * Recalcula valores totais que possam estar vazios
 */
function recalcularValoresPeriodicamente() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('NF-e_Items');
  
  if (!sheet) {
    return;
  }
  
  // Obter cabeçalhos
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const totalPriceColIndex = headers.indexOf('Valor_Total') + 1;
  
  if (totalPriceColIndex === 0) {
    return;
  }
  
  // Obter todas as linhas de dados
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    return;
  }
  
  // Processar cada linha que tenha Valor_Total vazio ou zero
  for (let row = 2; row <= lastRow; row++) {
    const totalPriceValue = sheet.getRange(row, totalPriceColIndex).getValue();
    
    // Se Valor_Total estiver vazio ou zero, recalcular
    if (!totalPriceValue || totalPriceValue === 0 || totalPriceValue === '') {
      calcularValorTotalParaLinha(sheet, row);
    }
  }
}

/**
 * Configurar trigger periódico (executa a cada 5 minutos)
 * Execute esta função UMA VEZ para configurar o trigger automático
 */
function configurarTriggerPeriodico() {
  // Remover triggers antigos
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'recalcularValoresPeriodicamente') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  
  // Criar novo trigger (executa a cada 5 minutos)
  ScriptApp.newTrigger('recalcularValoresPeriodicamente')
    .timeBased()
    .everyMinutes(5)
    .create();
    
  Logger.log('✅ Trigger periódico configurado com sucesso!');
}
