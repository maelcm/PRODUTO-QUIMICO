/**
 * Normaliza valor decimal de pt-BR para formato JavaScript
 * Converte "1.234,56" ou "123,45" para número válido
 */
export function normalizeDecimal(value: any): number {
  if (value === null || value === undefined || value === '') return 0;
  
  // Se já é número, retornar
  if (typeof value === 'number') {
    return isNaN(value) || !isFinite(value) ? 0 : value;
  }
  
  let str = String(value).trim();
  if (!str) return 0;
  
  // Remover espaços
  str = str.replace(/\s+/g, '');
  
  const hasComma = str.includes(',');
  const hasDot = str.includes('.');
  
  if (hasComma && hasDot) {
    // Formato pt-BR com milhar: 1.234,56 → 1234.56
    str = str.replace(/\./g, '').replace(',', '.');
  } else if (hasComma) {
    // Apenas vírgula decimal: 123,45 → 123.45
    str = str.replace(',', '.');
  }
  
  const num = Number(str);
  return isNaN(num) || !isFinite(num) ? 0 : num;
}

/**
 * Formata número para exibição em pt-BR
 */
export function formatCurrency(value: any): string {
  const num = normalizeDecimal(value);
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Formata número decimal para exibição em pt-BR (sem símbolo de moeda)
 */
export function formatNumber(value: any, decimals: number = 2): string {
  const num = normalizeDecimal(value);
  return num.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

/**
 * Remove informações de lote e fabricação do nome do produto
 * (já que essas informações aparecem em colunas separadas)
 */
export function cleanProductName(name: string): string {
  if (!name) return '';
  
  let cleaned = name;
  
  // Remover " - LOTE: XXXXX" ou " LOTE: XXXXX"
  cleaned = cleaned.replace(/\s*-?\s*LOTE:\s*[^\s]+/gi, '');
  
  // Remover " FAB.DD/MM/AA" ou " FAB.DD/MM/AAAA"
  cleaned = cleaned.replace(/\s+FAB\.\s*\d{2}\/\d{2}\/\d{2,4}/gi, '');
  
  // Remover espaços extras e traços no final
  cleaned = cleaned.replace(/\s*-\s*$/, '').trim();
  
  return cleaned;
}
