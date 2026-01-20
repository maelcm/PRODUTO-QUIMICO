/**
 * Módulo de Database usando Google Sheets
 * Substitui o MySQL por Google Sheets para salvar dados
 */

import { sheetsService } from './sheets-service.js';

// Planilhas que serão criadas/usadas
const WORKSHEETS = {
  INVOICES: 'NF-e_Invoices',
  ITEMS: 'NF-e_Items',
  MANUAL_PRODUCTS: 'Manual_Products',
  STOCK_MOVEMENTS: 'Stock_Movements',
  DAILY_EXPENSES: 'Daily_Expenses',
  USERS: 'Users',
} as const;

// IDs incrementais (simulando auto-increment)
let invoiceIdCounter = 1;
let itemIdCounter = 1;
let manualProductIdCounter = 1;
let expenseIdCounter = 1;
let userIdCounter = 1;

// Headers em português brasileiro
const HEADERS: Record<string, string[]> = {
  INVOICES: ['ID', 'ID_Usuario', 'Chave_Acesso', 'Numero_Nota', 'Nome_Emitente', 'CNPJ_Emitente', 'Data_Emissao', 'Valor_Total', 'URL_XML', 'Data_Criacao', 'Data_Atualizacao'],
  ITEMS: ['ID', 'ID_Nota', 'Nome_Produto', 'Quantidade', 'Quantidade_Usada', 'Unidade_Medida', 'Valor_Unitario', 'Valor_Total', 'Numero_Lote', 'Data_Validade', 'Data_Fabricacao', 'NCM', 'Data_Criacao', 'Data_Atualizacao'],
  MANUAL_PRODUCTS: ['ID', 'ID_Usuario', 'Nome_Produto', 'Quantidade', 'Unidade_Medida', 'Valor_Unitario', 'Valor_Total', 'Numero_Lote', 'Data_Validade', 'Data_Fabricacao', 'Data_Compra', 'Fornecedor', 'Numero_Cupom', 'Observacoes', 'Data_Criacao', 'Data_Atualizacao'],
  DAILY_EXPENSES: ['ID', 'ID_Usuario', 'Nome_Produto', 'Numero_Nota', 'Data_Gasto', 'Quantidade_Usada', 'Valor_Total_Gasto', 'Descricao', 'Data_Criacao', 'Data_Atualizacao'],
  USERS: ['ID', 'ID_Aberto', 'Nome', 'Email', 'Metodo_Login', 'Perfil', 'Data_Criacao', 'Data_Atualizacao', 'Ultimo_Acesso'],
};

/**
 * Inicializar headers das planilhas
 */
async function initializeWorksheets() {
  try {
    // NF-e Invoices
    await ensureHeaders(WORKSHEETS.INVOICES, HEADERS.INVOICES);

    // NF-e Items
    await ensureHeaders(WORKSHEETS.ITEMS, HEADERS.ITEMS);

    // Manual Products
    await ensureHeaders(WORKSHEETS.MANUAL_PRODUCTS, HEADERS.MANUAL_PRODUCTS);

    // Daily Expenses
    await ensureHeaders(WORKSHEETS.DAILY_EXPENSES, HEADERS.DAILY_EXPENSES);

    // Users
    await ensureHeaders(WORKSHEETS.USERS, HEADERS.USERS);

    // Carregar contadores dos dados existentes
    await loadCounters();

    console.log('[DB-Sheets] ✅ Planilhas inicializadas com sucesso');
  } catch (error: any) {
    console.error('[DB-Sheets] Erro ao inicializar planilhas:', error.message);
    throw error;
  }
}

/**
 * Garantir que a planilha tem headers
 */
async function ensureHeaders(worksheetName: string, headers: string[]) {
  const rows = await sheetsService.readRows(worksheetName);
  
  if (rows.length === 0) {
    // Primeira linha vazia, adicionar headers
    await sheetsService.appendRows(worksheetName, [headers]);
  } else if (rows.length === 1 && rows[0].join(',') !== headers.join(',')) {
    // Headers diferentes, limpar e adicionar headers corretos
    await sheetsService.clearWorksheet(worksheetName);
    await sheetsService.appendRows(worksheetName, [headers]);
  } else if (rows.length > 0 && rows[0].join(',') !== headers.join(',')) {
    // Headers diferentes, mas tem dados - apenas adicionar headers se necessário
    // (Não fazer nada, assumir que já tem headers)
  }
}

/**
 * Carregar contadores dos IDs existentes
 */
async function loadCounters() {
  try {
    const invoiceRows = await sheetsService.readRows(WORKSHEETS.INVOICES);
    if (invoiceRows.length > 1) {
      const ids = invoiceRows.slice(1).map((row: any[]) => parseInt(row[0]) || 0).filter(id => id > 0);
      if (ids.length > 0) {
        invoiceIdCounter = Math.max(...ids) + 1;
      }
    }

    const itemRows = await sheetsService.readRows(WORKSHEETS.ITEMS);
    if (itemRows.length > 1) {
      const ids = itemRows.slice(1).map((row: any[]) => parseInt(row[0]) || 0).filter(id => id > 0);
      if (ids.length > 0) {
        itemIdCounter = Math.max(...ids) + 1;
      }
    }

    const manualRows = await sheetsService.readRows(WORKSHEETS.MANUAL_PRODUCTS);
    if (manualRows.length > 1) {
      const ids = manualRows.slice(1).map((row: any[]) => parseInt(row[0]) || 0).filter(id => id > 0);
      if (ids.length > 0) {
        manualProductIdCounter = Math.max(...ids) + 1;
      }
    }

    const expenseRows = await sheetsService.readRows(WORKSHEETS.DAILY_EXPENSES);
    if (expenseRows.length > 1) {
      const ids = expenseRows.slice(1).map((row: any[]) => parseInt(row[0]) || 0).filter(id => id > 0);
      if (ids.length > 0) {
        expenseIdCounter = Math.max(...ids) + 1;
      }
    }

    const userRows = await sheetsService.readRows(WORKSHEETS.USERS);
    if (userRows.length > 1) {
      const ids = userRows.slice(1).map((row: any[]) => parseInt(row[0]) || 0).filter(id => id > 0);
      if (ids.length > 0) {
        userIdCounter = Math.max(...ids) + 1;
      }
    }
  } catch (error) {
    console.warn('[DB-Sheets] Aviso ao carregar contadores:', error);
  }
}

/**
 * Mapeamento de headers em português para chaves do objeto
 */
const HEADER_TO_KEY: Record<string, string> = {
  // Invoices
  'ID': 'id',
  'ID_Usuario': 'userid',
  'Chave_Acesso': 'accesskey',
  'Numero_Nota': 'invoicenumber',
  'Nome_Emitente': 'emittername',
  'CNPJ_Emitente': 'emittercnpj',
  'Data_Emissao': 'emissiondate',
  'Valor_Total': 'totalvalue',
  'URL_XML': 'xmlurl',
  'Data_Criacao': 'createdat',
  'Data_Atualizacao': 'updatedat',
  // Items
  'ID_Nota': 'invoiceid',
  'Nome_Produto': 'productname',
  'Quantidade': 'quantity',
  'Quantidade_Usada': 'quantityused',
  'Unidade_Medida': 'unitofmeasure',
  'Valor_Unitario': 'unitprice',
  'Numero_Lote': 'batchnumber',
  'Data_Validade': 'expirationdate',
  'Data_Fabricacao': 'manufacturingdate',
  'NCM': 'ncm',
  // Manual Products
  'Data_Compra': 'purchasedate',
  'Fornecedor': 'supplier',
  'Numero_Cupom': 'vouchernumber',
  'Observacoes': 'observations',
  // Expenses
  'Data_Gasto': 'expensedate',
  'Valor_Total_Gasto': 'totalexpense',
  'Descricao': 'description',
  // Users
  'ID_Aberto': 'openid',
  'Nome': 'name',
  'Email': 'email',
  'Metodo_Login': 'loginmethod',
  'Perfil': 'role',
  'Ultimo_Acesso': 'lastsignedin',
  // Aliases para Valor_Total (usado em múltiplas tabelas)
  // Quando é item de nota, usar totalprice
  // Quando é invoice, usar totalvalue (já mapeado acima)
};

const DECIMAL_HEADERS = new Set([
  'Quantidade',
  'Valor_Unitario',
  'Valor_Total',
  'Quantidade_Usada',
  'Valor_Total_Gasto',
]);

const DATE_HEADERS = new Set([
  'Data_Emissao',
  'Data_Validade',
  'Data_Fabricacao',
  'Data_Compra',
  'Data_Gasto',
  'Data_Criacao',
  'Data_Atualizacao',
  'Ultimo_Acesso',
]);

function formatDecimalPtBr(value: any): string {
  if (value === null || value === undefined || value === '') return '';

  let str = typeof value === 'number' ? value.toString() : String(value).trim();
  if (!str) return '';

  const hasComma = str.includes(',');
  const hasDot = str.includes('.');

  if (hasComma && hasDot) {
    // Assume formato pt-BR com milhar: 1.234,56
    str = str.replace(/\./g, '');
  }

  if (!hasComma && hasDot) {
    // Converter decimal com ponto para vírgula
    str = str.replace('.', ',');
  }

  return str;
}

function formatDatePtBr(value: any): string {
  if (!value) return '';
  const str = String(value).trim();
  if (!str) return '';

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const [year, month, day] = str.split('-');
    return `${day}/${month}/${year}`;
  }

  // YYYYMMDD
  if (/^\d{8}$/.test(str)) {
    return `${str.slice(6, 8)}/${str.slice(4, 6)}/${str.slice(0, 4)}`;
  }

  // Se já estiver em DD/MM/YYYY, mantém
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) return str;

  // Tentar converter ISO completo
  const iso = new Date(str);
  if (!Number.isNaN(iso.getTime())) {
    const day = String(iso.getDate()).padStart(2, '0');
    const month = String(iso.getMonth() + 1).padStart(2, '0');
    const year = iso.getFullYear();
    return `${day}/${month}/${year}`;
  }

  return str;
}

/**
 * Converter objeto para linha de planilha
 */
function objectToRow(obj: any, headers: string[]): any[] {
  return headers.map(header => {
    // Usar mapeamento se existir, senão tentar lowercase
    const key = HEADER_TO_KEY[header] || header.toLowerCase();
    const rawValue = obj[key] || obj[header] || '';
    if (rawValue === null || rawValue === undefined) return '';

    if (DECIMAL_HEADERS.has(header)) {
      return formatDecimalPtBr(rawValue);
    }

    if (DATE_HEADERS.has(header)) {
      return formatDatePtBr(rawValue);
    }

    return String(rawValue);
  });
}

/**
 * Normalizar valor decimal pt-BR para formato JavaScript (ponto)
 */
function normalizeDecimalFromPtBr(value: any): string | null {
  if (value === null || value === undefined || value === '') return null;
  
  let str = String(value).trim();
  if (!str) return null;
  
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
  
  // Validar se é um número válido
  if (!/^[-+]?\d+(\.\d+)?$/.test(str)) {
    return null;
  }
  
  return str;
}

/**
 * Converter linha de planilha para objeto
 */
function rowToObject(row: any[], headers: string[], debug = false): any {
  const obj: any = {};
  headers.forEach((header, index) => {
    const value = row[index] || '';
    // Usar mapeamento se existir, senão usar lowercase
    const key = HEADER_TO_KEY[header] || header.toLowerCase();
    
    if (debug && index < 12) {
      console.log(`[rowToObject] Header[${index}]: "${header}" -> key: "${key}" -> value: "${value}"`);
    }
    
    // Normalizar valores decimais (quantidade, preços)
    if (header === 'Quantidade' || header === 'Valor_Unitario' || header === 'Valor_Total' || 
        header === 'Quantidade_Usada' || header === 'Valor_Total_Gasto') {
      const normalized = normalizeDecimalFromPtBr(value);
      obj[key] = normalized !== null ? normalized : value;
      
      // Para Valor_Total, adicionar alias para compatibilidade
      if (header === 'Valor_Total') {
        obj['totalprice'] = normalized !== null ? normalized : value;
        obj['totalvalue'] = normalized !== null ? normalized : value;
      }
    } else {
      obj[key] = value === '' ? null : value;
    }
  });
  return obj;
}

// Inicializar planilhas quando o módulo carregar
initializeWorksheets().catch(console.error);

// ========== FUNÇÕES DE USUÁRIOS ==========

export async function getOrCreateDefaultUser() {
  const rows = await sheetsService.readRows(WORKSHEETS.USERS);
  const headers = HEADERS.USERS;
  
  // Procurar usuário padrão
  for (let i = 1; i < rows.length; i++) {
    const user = rowToObject(rows[i], headers);
    if (user.email === 'usuario@padrao.local') {
      return {
        id: parseInt(user.id),
        openId: user.openid,
        name: user.name,
        email: user.email,
        loginMethod: user.loginmethod,
        role: user.role,
        createdAt: user.createdat,
        updatedAt: user.updatedat,
        lastSignedIn: user.lastsignedin,
      };
    }
  }

  // Criar usuário padrão
  const now = new Date().toISOString();
  const newUser = {
    id: userIdCounter++,
    openid: `default-user-${Date.now()}`,
    name: 'Usuário Padrão',
    email: 'usuario@padrao.local',
    loginmethod: 'local',
    role: 'admin',
    createdat: now,
    updatedat: now,
    lastsignedin: null,
  };

  await sheetsService.appendRows(WORKSHEETS.USERS, [objectToRow(newUser, headers)]);

  return {
    id: newUser.id,
    openId: newUser.openid,
    name: newUser.name,
    email: newUser.email,
    loginMethod: newUser.loginmethod,
    role: newUser.role,
    createdAt: newUser.createdat,
    updatedAt: newUser.updatedat,
    lastSignedIn: newUser.lastsignedin,
  };
}

// ========== FUNÇÕES DE NOTAS FISCAIS ==========

export async function createNfeInvoice(data: any) {
  const now = new Date().toISOString();
  
  // Garantir que totalvalue seja um número válido
  let totalValue = data.totalValue;
  if (!totalValue || totalValue === '0' || totalValue === 0 || totalValue === '') {
    console.warn('[createNfeInvoice] totalValue vazio ou zero, usando 0');
    totalValue = '0';
  }
  
  const invoice = {
    id: invoiceIdCounter++,
    userid: data.userId,
    accesskey: data.accessKey,
    invoicenumber: data.invoiceNumber,
    emittername: data.emitterName,
    emittercnpj: data.emitterCNPJ,
    emissiondate: data.emissionDate,
    totalvalue: totalValue,
    xmlurl: data.xmlUrl || '',
    createdat: now,
    updatedat: now,
  };
  
  console.log('[createNfeInvoice] Salvando invoice:', { id: invoice.id, totalvalue: invoice.totalvalue });

  const headers = HEADERS.INVOICES;
  await sheetsService.appendRows(WORKSHEETS.INVOICES, [objectToRow(invoice, headers)]);

  return {
    id: invoice.id,
    userId: invoice.userid,
    accessKey: invoice.accesskey,
    invoiceNumber: invoice.invoicenumber,
    emitterName: invoice.emittername,
    emitterCNPJ: invoice.emittercnpj,
    emissionDate: invoice.emissiondate,
    totalValue: invoice.totalvalue,
    xmlUrl: invoice.xmlurl,
    createdAt: invoice.createdat,
    updatedAt: invoice.updatedat,
  };
}

export async function getNfeInvoicesByUserId(userId: number) {
  const rows = await sheetsService.readRows(WORKSHEETS.INVOICES);
  const headers = HEADERS.INVOICES;
  
  const invoices = [];
  for (let i = 1; i < rows.length; i++) {
    const invoice = rowToObject(rows[i], headers);
    if (parseInt(invoice.userid) === userId) {
      invoices.push({
        id: parseInt(invoice.id),
        userId: parseInt(invoice.userid),
        accessKey: invoice.accesskey,
        invoiceNumber: invoice.invoicenumber,
        emitterName: invoice.emittername,
        emitterCNPJ: invoice.emittercnpj,
        emissionDate: invoice.emissiondate,
        totalValue: invoice.totalvalue,
        xmlUrl: invoice.xmlurl,
        createdAt: invoice.createdat,
        updatedAt: invoice.updatedat,
      });
    }
  }

  // Ordenar por data de criação (mais recente primeiro)
  return invoices.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getNfeInvoiceById(id: number, userId: number) {
  const rows = await sheetsService.readRows(WORKSHEETS.INVOICES);
  const headers = HEADERS.INVOICES;
  
  for (let i = 1; i < rows.length; i++) {
    const invoice = rowToObject(rows[i], headers);
    if (parseInt(invoice.id) === id && parseInt(invoice.userid) === userId) {
      return {
        id: parseInt(invoice.id),
        userId: parseInt(invoice.userid),
        accessKey: invoice.accesskey,
        invoiceNumber: invoice.invoicenumber,
        emitterName: invoice.emittername,
        emitterCNPJ: invoice.emittercnpj,
        emissionDate: invoice.emissiondate,
        totalValue: invoice.totalvalue,
        xmlUrl: invoice.xmlurl,
        createdAt: invoice.createdat,
        updatedAt: invoice.updatedat,
      };
    }
  }
  return undefined;
}

export async function getNfeInvoiceByAccessKey(accessKey: string, userId: number) {
  const rows = await sheetsService.readRows(WORKSHEETS.INVOICES);
  const headers = HEADERS.INVOICES;
  
  for (let i = 1; i < rows.length; i++) {
    const invoice = rowToObject(rows[i], headers);
    if (invoice.accesskey === accessKey && parseInt(invoice.userid) === userId) {
      return {
        id: parseInt(invoice.id),
        userId: parseInt(invoice.userid),
        accessKey: invoice.accesskey,
        invoiceNumber: invoice.invoicenumber,
        emitterName: invoice.emittername,
        emitterCNPJ: invoice.emittercnpj,
        emissionDate: invoice.emissiondate,
        totalValue: invoice.totalvalue,
        xmlUrl: invoice.xmlurl,
        createdAt: invoice.createdat,
        updatedAt: invoice.updatedat,
      };
    }
  }
  return undefined;
}

export async function deleteNfeInvoice(id: number, userId: number) {
  // Nota: Google Sheets não tem delete eficiente, precisaríamos reescrever toda a planilha
  // Por enquanto, marcar como deletado ou deixar (será implementado depois)
  console.warn('[DB-Sheets] Delete não implementado ainda para Google Sheets');
  return;
}

// ========== FUNÇÕES DE ITENS ==========

export async function createNfeItems(items: any[]) {
  const headers = HEADERS.ITEMS;
  const now = new Date().toISOString();
  
  const rows = items.map(item => {
    // SEMPRE calcular totalPrice baseado em quantity e unitPrice
    // Normalizar valores para garantir cálculo correto
    let qty = 0;
    let price = 0;
    
    // Converter quantity
    if (item.quantity) {
      const qtyStr = String(item.quantity).trim().replace(',', '.');
      qty = parseFloat(qtyStr) || 0;
    }
    
    // Converter unitPrice
    if (item.unitPrice) {
      const priceStr = String(item.unitPrice).trim().replace(',', '.');
      price = parseFloat(priceStr) || 0;
    }
    
    // Calcular totalPrice
    const totalPrice = (qty * price).toFixed(2);
    
    console.log(`[createNfeItems] Calculando totalPrice: ${qty} x ${price} = ${totalPrice}`);
    console.log(`[createNfeItems] Valores originais: quantity="${item.quantity}", unitPrice="${item.unitPrice}", totalPrice="${item.totalPrice}"`);
    
    const rowItem = {
      id: itemIdCounter++,
      invoiceid: item.invoiceId,
      productname: item.productName,
      quantity: qty.toString(), // Usar valor normalizado
      quantityused: '0', // Quantidade usada inicialmente 0
      unitofmeasure: item.unitOfMeasure,
      unitprice: price.toString(), // Usar valor normalizado
      totalprice: totalPrice, // SEMPRE usar o valor calculado
      batchnumber: item.batchNumber || '',
      expirationdate: item.expirationDate || '',
      manufacturingdate: item.manufacturingDate || '',
      ncm: item.ncm || '',
      createdat: now,
      updatedat: now,
    };
    
    console.log('[createNfeItems] Item final:', { 
      productname: rowItem.productname, 
      totalprice: rowItem.totalprice, 
      unitprice: rowItem.unitprice, 
      quantity: rowItem.quantity 
    });
    
    return objectToRow(rowItem, headers);
  });

  if (rows.length > 0) {
    await sheetsService.appendRows(WORKSHEETS.ITEMS, rows);
  }

  return rows.map((row) => ({
    id: parseInt(row[0]),
    invoiceId: parseInt(row[1]),
    productName: row[2],
    quantity: row[3],
    quantityUsed: row[4] || '0',
    unitOfMeasure: row[5],
    unitPrice: row[6],
    totalPrice: row[7],
    batchNumber: row[8] || null,
    expirationDate: row[9] || null,
    manufacturingDate: row[10] || null,
    ncm: row[11] || null,
    createdAt: row[12],
    updatedAt: row[13],
  }));
}

export async function getNfeItemsByInvoiceId(invoiceId: number) {
  const rows = await sheetsService.readRows(WORKSHEETS.ITEMS);
  const headers = HEADERS.ITEMS;
  
  const items = [];
  for (let i = 1; i < rows.length; i++) {
    const item = rowToObject(rows[i], headers);
    if (parseInt(item.invoiceid) === invoiceId) {
      const itemData = {
        id: parseInt(item.id),
        invoiceId: parseInt(item.invoiceid),
        productName: item.productname,
        quantity: item.quantity,
        quantityUsed: item.quantityused || '0',
        unitOfMeasure: item.unitofmeasure,
        unitPrice: item.unitprice,
        totalPrice: item.totalprice,
        batchNumber: item.batchnumber || null,
        expirationDate: item.expirationdate || null,
        manufacturingDate: item.manufacturingdate || null,
        ncm: item.ncm || null,
        createdAt: item.createdat,
        updatedAt: item.updatedat,
      };
      
      console.log('[getNfeItemsByInvoiceId] Item lido:', {
        product: itemData.productName,
        totalPrice: itemData.totalPrice,
        totalprice_raw: item.totalprice,
        item_object: item
      });
      
      items.push(itemData);
    }
  }
  return items;
}

export async function getAllNfeItemsByUserId(userId: number) {
  // Obter IDs das notas do usuário
  const invoiceRows = await sheetsService.readRows(WORKSHEETS.INVOICES);
  const invoiceHeaders = HEADERS.INVOICES;
  const userInvoiceIds = new Set<number>();
  const invoiceMap = new Map<number, any>();

  for (let i = 1; i < invoiceRows.length; i++) {
    const invoice = rowToObject(invoiceRows[i], invoiceHeaders);
    if (parseInt(invoice.userid) === userId) {
      const invoiceId = parseInt(invoice.id);
      userInvoiceIds.add(invoiceId);
      invoiceMap.set(invoiceId, {
        id: invoiceId,
        userId: parseInt(invoice.userid),
        accessKey: invoice.accesskey,
        invoiceNumber: invoice.invoicenumber,
        emitterName: invoice.emittername,
        emitterCNPJ: invoice.emittercnpj,
        emissionDate: invoice.emissiondate,
        totalValue: invoice.totalvalue,
        xmlUrl: invoice.xmlurl,
        createdAt: invoice.createdat,
        updatedAt: invoice.updatedat,
      });
    }
  }

  // Obter itens das notas do usuário
  const itemRows = await sheetsService.readRows(WORKSHEETS.ITEMS);
  const itemHeaders = HEADERS.ITEMS;
  
  console.log('[getAllNfeItemsByUserId] Headers esperados:', itemHeaders);
  
  const result = [];
  for (let i = 1; i < itemRows.length; i++) {
    const debug = i === 1; // Debug apenas primeira linha
    const item = rowToObject(itemRows[i], itemHeaders, debug);
    const invoiceId = parseInt(item.invoiceid);
    if (userInvoiceIds.has(invoiceId)) {
      if (debug) {
        console.log('[getAllNfeItemsByUserId] Item mapeado:', {
          batchNumber: item.batchnumber,
          expirationDate: item.expirationdate,
          manufacturingDate: item.manufacturingdate,
          quantity: item.quantity,
          unitPrice: item.unitprice,
          totalPrice: item.totalprice,
        });
      }
      
      result.push({
        item: {
          id: parseInt(item.id),
          invoiceId: invoiceId,
          productName: item.productname,
          quantity: item.quantity,
          unitOfMeasure: item.unitofmeasure,
          unitPrice: item.unitprice,
          totalPrice: item.totalprice,
          batchNumber: item.batchnumber || null,
          expirationDate: item.expirationdate || null,
          manufacturingDate: item.manufacturingdate || null,
          ncm: item.ncm || null,
          createdAt: item.createdat,
          updatedAt: item.updatedat,
        },
        invoice: invoiceMap.get(invoiceId),
      });
    }
  }

  return result;
}

// ========== FUNÇÕES DE PRODUTOS MANUAIS ==========

export async function createManualProduct(data: any) {
  const now = new Date().toISOString();
  const product = {
    id: manualProductIdCounter++,
    userid: data.userId,
    productname: data.productName,
    quantity: data.quantity,
    unitofmeasure: data.unitOfMeasure,
    unitprice: data.unitPrice,
    totalprice: data.totalPrice,
    batchnumber: data.batchNumber || '',
    expirationdate: data.expirationDate || '',
    manufacturingdate: data.manufacturingDate || '',
    purchasedate: data.purchaseDate,
    supplier: data.supplier || '',
    vouchernumber: data.voucherNumber || '',
    observations: data.observations || '',
    createdat: now,
    updatedat: now,
  };

  const headers = HEADERS.MANUAL_PRODUCTS;
  await sheetsService.appendRows(WORKSHEETS.MANUAL_PRODUCTS, [objectToRow(product, headers)]);

  return {
    id: product.id,
    userId: product.userid,
    productName: product.productname,
    quantity: product.quantity,
    unitOfMeasure: product.unitofmeasure,
    unitPrice: product.unitprice,
    totalPrice: product.totalprice,
    batchNumber: product.batchnumber || null,
    expirationDate: product.expirationdate || null,
    manufacturingDate: product.manufacturingdate || null,
    purchaseDate: product.purchasedate,
    supplier: product.supplier || null,
    voucherNumber: product.vouchernumber || null,
    observations: product.observations || null,
    createdAt: product.createdat,
    updatedAt: product.updatedat,
  };
}

export async function getManualProductsByUserId(userId: number) {
  const rows = await sheetsService.readRows(WORKSHEETS.MANUAL_PRODUCTS);
  const headers = HEADERS.MANUAL_PRODUCTS;
  
  console.log('[getManualProductsByUserId] Headers esperados:', headers);
  
  const products = [];
  for (let i = 1; i < rows.length; i++) {
    const debug = i === 1; // Debug apenas primeira linha
    const product = rowToObject(rows[i], headers, debug);
    if (parseInt(product.userid) === userId) {
      if (debug) {
        console.log('[getManualProductsByUserId] Produto mapeado:', {
          batchNumber: product.batchnumber,
          expirationDate: product.expirationdate,
          manufacturingDate: product.manufacturingdate,
          quantity: product.quantity,
          unitPrice: product.unitprice,
          totalPrice: product.totalprice,
        });
      }
      
      products.push({
        id: parseInt(product.id),
        userId: parseInt(product.userid),
        productName: product.productname,
        quantity: product.quantity,
        unitOfMeasure: product.unitofmeasure,
        unitPrice: product.unitprice,
        totalPrice: product.totalprice,
        batchNumber: product.batchnumber || null,
        expirationDate: product.expirationdate || null,
        manufacturingDate: product.manufacturingdate || null,
        purchaseDate: product.purchasedate,
        supplier: product.supplier || null,
        voucherNumber: product.vouchernumber || null,
        observations: product.observations || null,
        createdAt: product.createdat,
        updatedAt: product.updatedat,
      });
    }
  }

  return products.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function deleteManualProduct(id: number, userId: number) {
  console.warn('[DB-Sheets] Delete não implementado ainda para Google Sheets');
  return;
}

// ========== FUNÇÕES DE PRODUTOS UNIFICADOS ==========

export async function getAllProductsByUserId(userId: number) {
  // Obter itens de NF-e
  const nfeItems = await getAllNfeItemsByUserId(userId);
  const nfeProducts = nfeItems.map((item: any) => ({
    id: item.item.id,
    productName: item.item.productName,
    quantity: item.item.quantity,
    unitOfMeasure: item.item.unitOfMeasure,
    unitPrice: item.item.unitPrice,
    batchNumber: item.item.batchNumber,
    expirationDate: item.item.expirationDate,
    manufacturingDate: item.item.manufacturingDate,
    invoiceNumber: item.invoice?.invoiceNumber || null,
    emissionDate: item.invoice?.emissionDate || null,
    emitterName: item.invoice?.emitterName || null,
    supplier: item.invoice?.emitterName || null,
    createdAt: item.item.createdAt,
    origin: 'NF-e',
    invoiceId: item.invoice?.id || null,
  }));

  // Obter produtos manuais
  const manualProducts = await getManualProductsByUserId(userId);
  const manualProductsFormatted = manualProducts.map((product: any) => ({
    id: product.id,
    productName: product.productName,
    quantity: product.quantity,
    unitOfMeasure: product.unitOfMeasure,
    unitPrice: product.unitPrice,
    batchNumber: product.batchNumber,
    expirationDate: product.expirationDate,
    manufacturingDate: product.manufacturingDate,
    invoiceNumber: null,
    emissionDate: product.purchaseDate,
    emitterName: product.supplier,
    supplier: product.supplier,
    createdAt: product.createdAt,
    origin: 'Manual',
    invoiceId: null,
  }));

  return [...nfeProducts, ...manualProductsFormatted];
}

export async function getDistinctProductNames(userId: number) {
  const allProducts = await getAllProductsByUserId(userId);
  const names = allProducts.map((p: any) => p.productName).filter(Boolean);
  return [...new Set(names)].sort();
}

export async function getInvoicesByProductName(productName: string, userId: number) {
  // Obter itens de NF-e com o nome do produto
  const nfeItems = await getAllNfeItemsByUserId(userId);
  const nfeInvoices = nfeItems
    .filter((item: any) => item.item.productName === productName)
    .map((item: any) => ({
      invoiceId: item.invoice?.id || null,
      invoiceNumber: item.invoice?.invoiceNumber || null,
      emissionDate: item.invoice?.emissionDate || null,
      emitterName: item.invoice?.emitterName || null,
      origin: 'NF-e',
      batchNumber: item.item.batchNumber,
      expirationDate: item.item.expirationDate,
      quantity: item.item.quantity,
    }));

  // Obter produtos manuais com o nome do produto
  const manualProducts = await getManualProductsByUserId(userId);
  const manualInvoices = manualProducts
    .filter((product: any) => product.productName === productName)
    .map((product: any) => ({
      invoiceId: null,
      invoiceNumber: null,
      emissionDate: product.purchaseDate,
      emitterName: product.supplier,
      origin: 'Manual',
      batchNumber: product.batchNumber,
      expirationDate: product.expirationDate,
      quantity: product.quantity,
    }));

  return [...nfeInvoices, ...manualInvoices];
}

// ========== FUNÇÕES DE GASTOS DIÁRIOS ==========

export async function createDailyExpense(data: any) {
  const now = new Date().toISOString();
  const expense = {
    id: expenseIdCounter++,
    userid: data.userId,
    productname: data.productName,
    invoicenumber: data.invoiceNumber || '',
    expensedate: data.expenseDate,
    quantityused: data.quantityUsed,
    totalexpense: data.totalExpense,
    description: data.description || '',
    createdat: now,
    updatedat: now,
  };

  const headers = HEADERS.DAILY_EXPENSES;
  await sheetsService.appendRows(WORKSHEETS.DAILY_EXPENSES, [objectToRow(expense, headers)]);

  // ATUALIZAR QUANTIDADE USADA NOS ITENS CORRESPONDENTES
  // Extrair lotes da descrição (formato: "Lotes selecionados: Lote: XXX, Lote: YYY")
  const description = data.description || '';
  console.log('[createDailyExpense] Descrição recebida:', description);
  
  const batchMatches = description.match(/Lote:\s*([^,]+)/g) || [];
  const batchNumbers = batchMatches.map((match: string) => match.replace(/Lote:\s*/i, '').trim()).filter(Boolean);
  
  console.log('[createDailyExpense] Lotes extraídos:', batchNumbers);
  console.log('[createDailyExpense] Produto:', data.productName);
  console.log('[createDailyExpense] Quantidade a usar:', data.quantityUsed);
  
  if (batchNumbers.length > 0) {
    console.log('[createDailyExpense] Atualizando quantidade usada nos itens...');
    await updateItemQuantityUsed(data.productName, batchNumbers, parseFloat(String(data.quantityUsed)) || 0);
  } else {
    console.warn('[createDailyExpense] ⚠️ Nenhum lote encontrado na descrição. Não foi possível atualizar quantidade usada.');
  }

  return {
    id: expense.id,
    userId: expense.userid,
    productName: expense.productname,
    invoiceNumber: expense.invoicenumber || null,
    expenseDate: expense.expensedate,
    quantityUsed: expense.quantityused,
    totalExpense: expense.totalexpense,
    description: expense.description || null,
    createdAt: expense.createdat,
    updatedAt: expense.updatedat,
  };
}

/**
 * Atualizar quantidade usada nos itens da NF-e
 */
async function updateItemQuantityUsed(productName: string, batchNumbers: string[], quantityToUse: number) {
  try {
    console.log('[updateItemQuantityUsed] Iniciando atualização...');
    console.log('[updateItemQuantityUsed] Parâmetros:', { productName, batchNumbers, quantityToUse });
    
    const rows = await sheetsService.readRows(WORKSHEETS.ITEMS);
    console.log(`[updateItemQuantityUsed] Total de linhas lidas: ${rows.length}`);
    
    if (rows.length <= 1) {
      console.warn('[updateItemQuantityUsed] Apenas cabeçalho encontrado ou planilha vazia');
      return;
    }

    // Obter cabeçalhos da primeira linha
    const headerRow = rows[0];
    console.log('[updateItemQuantityUsed] Cabeçalhos:', headerRow);
    
    const productNameColIdx = headerRow.indexOf('Nome_Produto');
    const batchNumberColIdx = headerRow.indexOf('Numero_Lote');
    const quantityColIdx = headerRow.indexOf('Quantidade');
    const quantityUsedColIdx = headerRow.indexOf('Quantidade_Usada');
    
    console.log('[updateItemQuantityUsed] Índices das colunas:', {
      productNameColIdx,
      batchNumberColIdx,
      quantityColIdx,
      quantityUsedColIdx
    });
    
    if (productNameColIdx === -1 || batchNumberColIdx === -1 || quantityColIdx === -1) {
      console.error('[updateItemQuantityUsed] ❌ Colunas obrigatórias não encontradas');
      return;
    }
    
    // Se Quantidade_Usada não existe, precisa adicionar a coluna primeiro
    if (quantityUsedColIdx === -1) {
      console.warn('[updateItemQuantityUsed] ⚠️ Coluna Quantidade_Usada não encontrada. Adicionando coluna...');
      // Adicionar coluna Quantidade_Usada após Quantidade
      headerRow.splice(quantityColIdx + 1, 0, 'Quantidade_Usada');
      // Atualizar cabeçalho
      await sheetsService.updateRow(WORKSHEETS.ITEMS, 1, headerRow);
      console.log('[updateItemQuantityUsed] ✅ Coluna Quantidade_Usada adicionada!');
      
      // Reler as linhas após adicionar a coluna
      const updatedRows = await sheetsService.readRows(WORKSHEETS.ITEMS);
      rows.length = 0;
      rows.push(...updatedRows);
    }

    // Distribuir a quantidade usada entre os lotes selecionados
    const quantityPerBatch = quantityToUse / batchNumbers.length;
    console.log(`[updateItemQuantityUsed] Quantidade por lote: ${quantityPerBatch}`);
    
    let updatedCount = 0;
    
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      
      // Garantir que a linha tenha todas as colunas necessárias
      while (row.length <= quantityUsedColIdx) {
        row.push('');
      }
      
      const itemProductName = (row[productNameColIdx] || '').toString().trim();
      const itemBatchNumber = (row[batchNumberColIdx] || '').toString().trim();
      
      console.log(`[updateItemQuantityUsed] Verificando linha ${i + 1}: Produto="${itemProductName}", Lote="${itemBatchNumber}"`);
      
      // Verificar se é o produto e lote correto
      if (itemProductName === productName && batchNumbers.includes(itemBatchNumber)) {
        const currentQuantityUsed = parseFloat(String(row[quantityUsedColIdx] || '0').replace(',', '.')) || 0;
        const newQuantityUsed = currentQuantityUsed + quantityPerBatch;
        
        // Atualizar quantidade usada na planilha (formato pt-BR)
        row[quantityUsedColIdx] = newQuantityUsed.toFixed(3).replace('.', ',');
        
        // Atualizar linha na planilha
        console.log(`[updateItemQuantityUsed] Atualizando linha ${i + 1}...`);
        await sheetsService.updateRow(WORKSHEETS.ITEMS, i + 1, row);
        
        console.log(`[updateItemQuantityUsed] ✅ Atualizado item: ${itemProductName} - Lote: ${itemBatchNumber}`);
        console.log(`[updateItemQuantityUsed]   Qtd Usada anterior: ${currentQuantityUsed}`);
        console.log(`[updateItemQuantityUsed]   Qtd Usada nova: ${newQuantityUsed.toFixed(3)}`);
        updatedCount++;
      }
    }
    
    if (updatedCount === 0) {
      console.warn('[updateItemQuantityUsed] ⚠️ Nenhum item foi atualizado. Verifique se o produto e lotes estão corretos.');
    } else {
      console.log(`[updateItemQuantityUsed] ✅ ${updatedCount} item(s) atualizado(s) com sucesso!`);
    }
  } catch (error) {
    console.error('[updateItemQuantityUsed] ❌ Erro ao atualizar quantidade usada:', error);
    if (error instanceof Error) {
      console.error('[updateItemQuantityUsed] Stack:', error.stack);
    }
  }
}

export async function getDailyExpensesByUserId(userId: number, startDate?: Date, endDate?: Date) {
  const rows = await sheetsService.readRows(WORKSHEETS.DAILY_EXPENSES);
  const headers = HEADERS.DAILY_EXPENSES;
  
  const expenses = [];
  for (let i = 1; i < rows.length; i++) {
    const expense = rowToObject(rows[i], headers);
    if (parseInt(expense.userid) === userId) {
      const expenseDate = new Date(expense.expensedate);
      
      if (startDate && expenseDate < startDate) continue;
      if (endDate && expenseDate > endDate) continue;

      expenses.push({
        id: parseInt(expense.id),
        userId: parseInt(expense.userid),
        productName: expense.productname,
        invoiceNumber: expense.invoicenumber || null,
        expenseDate: expense.expensedate,
        quantityUsed: expense.quantityused,
        totalExpense: expense.totalexpense,
        description: expense.description || null,
        createdAt: expense.createdat,
        updatedAt: expense.updatedat,
      });
    }
  }

  return expenses.sort((a, b) => new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime());
}

export async function deleteDailyExpense(id: number, userId: number) {
  console.warn('[DB-Sheets] Delete não implementado ainda para Google Sheets');
  return;
}
