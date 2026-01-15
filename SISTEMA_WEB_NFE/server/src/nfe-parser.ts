import { parseStringPromise } from 'xml2js';

export interface ParsedNfeData {
  accessKey: string;
  invoiceNumber: string;
  emitterName: string;
  emitterCNPJ: string;
  emissionDate: string;
  totalValue: string;
  items: ParsedNfeItem[];
}

export interface ParsedNfeItem {
  productName: string;
  quantity: string;
  unitOfMeasure: string;
  unitPrice: string;
  totalPrice: string;
  batchNumber?: string;
  expirationDate?: string;
  manufacturingDate?: string;
  ncm?: string;
}

export async function parseNfeXml(xmlContent: string): Promise<ParsedNfeData> {
  try {
    if (!xmlContent || typeof xmlContent !== 'string') {
      throw new Error('XML inválido: conteúdo não é uma string');
    }

    if (xmlContent.trim().length === 0) {
      throw new Error('XML inválido: conteúdo está vazio');
    }

    // Verificar se parece ser um XML válido
    if (!xmlContent.trim().startsWith('<')) {
      throw new Error('XML inválido: não começa com tag XML');
    }

    console.log('[parseNfeXml] Iniciando parsing do XML...');
    
    const result = (await parseStringPromise(xmlContent, {
      explicitArray: false,
      mergeAttrs: true,
      explicitRoot: false,
      ignoreAttrs: false,
      trim: true,
    })) as any;

    console.log('[parseNfeXml] XML parseado com sucesso, estrutura:', Object.keys(result));

    // Estrutura do XML da NF-e pode variar, este é um exemplo genérico
    // Tentar diferentes estruturas comuns de NF-e
    let nfe = result.NFe?.infNFe || result.nfeProc?.NFe?.infNFe || result;
    
    if (!nfe || (typeof nfe === 'object' && Object.keys(nfe).length === 0)) {
      console.error('[parseNfeXml] Estrutura do XML não reconhecida.');
      console.error('[parseNfeXml] Chaves disponíveis no resultado:', Object.keys(result));
      console.error('[parseNfeXml] Resultado completo (primeiros 500 chars):', JSON.stringify(result).substring(0, 500));
      throw new Error('Estrutura do XML da NF-e não foi reconhecida. Verifique se o arquivo é uma NF-e válida.');
    }
    
    // Se nfe ainda é o resultado completo, tentar acessar diretamente
    if (nfe === result && result.nfeProc) {
      nfe = result.nfeProc.NFe?.infNFe || result.nfeProc;
    }
    
    console.log('[parseNfeXml] Estrutura NF-e encontrada, chaves:', Object.keys(nfe));
    
    // Extrair dados da nota
    const ide = nfe.ide || {};
    const emit = nfe.emit || {};
    const total = nfe.total?.ICMSTot || nfe.total || {};
    const det = Array.isArray(nfe.det) ? nfe.det : (nfe.det ? [nfe.det] : []);

    // Extrair chave de acesso (44 dígitos)
    let accessKey = '';
    if (nfe['$']?.Id) {
      accessKey = nfe['$'].Id.replace('NFe', '').replace(/[^0-9]/g, '');
    } else if (ide.chNFe) {
      accessKey = String(ide.chNFe).replace(/[^0-9]/g, '');
    } else if (ide.chave) {
      accessKey = String(ide.chave).replace(/[^0-9]/g, '');
    }
    
    if (accessKey.length !== 44) {
      console.warn(`[parseNfeXml] Chave de acesso com tamanho incorreto: ${accessKey.length} dígitos (esperado: 44)`);
      // Se não conseguir extrair, gerar uma chave temporária única de 44 dígitos
      const ts = Date.now().toString();
      const rand = Math.floor(Math.random() * 1e30)
        .toString()
        .padStart(30, '0');
      accessKey = `${ts}${rand}`.slice(0, 44).padEnd(44, '0');
    }

    const invoiceNumber = String(ide.nNF || ide.numero || '');
    const emitterName = String(emit.xNome || emit.razaoSocial || emit.nome || '');
    const emitterCNPJ = String(emit.CNPJ || emit.cnpj || emit.CPF || emit.cpf || '');
    const emissionDate = String(ide.dhEmi || ide.dEmi || ide.dataEmissao || '');
    const totalValue = String(total.vNF || total['vNF'] || total.valorTotal || '0');

    // Formatar data de emissão
    let formattedEmissionDate = emissionDate;
    if (emissionDate.includes('T')) {
      formattedEmissionDate = emissionDate.split('T')[0];
    } else if (emissionDate.match(/\d{2}\/\d{2}\/\d{4}/)) {
      const [day, month, year] = emissionDate.split('/');
      formattedEmissionDate = `${year}-${month}-${day}`;
    }

    const normalizeDecimalString = (value: unknown): string | null => {
      if (value === null || value === undefined) return null;
      if (typeof value === 'number') {
        return Number.isFinite(value) ? value.toString() : null;
      }

      let str = String(value).trim();
      if (!str) return null;

      // Remover espaços internos
      str = str.replace(/\s+/g, '');

      const hasComma = str.includes(',');
      const hasDot = str.includes('.');

      if (hasComma && hasDot) {
        // Assume formato pt-BR: 1.234,56
        str = str.replace(/\./g, '').replace(',', '.');
      } else if (hasComma) {
        // Assume vírgula como separador decimal
        str = str.replace(',', '.');
      }

      if (!/^[-+]?\d+(\.\d+)?$/.test(str)) {
        return null;
      }

      return str;
    };

    const parseDecimal = (value: unknown): number | null => {
      const normalized = normalizeDecimalString(value);
      if (!normalized) return null;
      const parsed = Number(normalized);
      return Number.isFinite(parsed) ? parsed : null;
    };

    const normalizeDate = (value: unknown): string | undefined => {
      if (!value) return undefined;
      const str = String(value).trim();
      if (!str) return undefined;

      // ISO com hora: 2024-12-31T00:00:00-03:00
      if (str.includes('T')) {
        const datePart = str.split('T')[0];
        if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return datePart;
      }

      // YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;

      // YYYYMMDD
      if (/^\d{8}$/.test(str)) {
        return `${str.slice(0, 4)}-${str.slice(4, 6)}-${str.slice(6, 8)}`;
      }

      // DD/MM/YYYY ou DD/MM/YY
      const match = str.match(/^(\d{2})\/(\d{2})\/(\d{2}|\d{4})$/);
      if (match) {
        const [, day, month, yearRaw] = match;
        const year = yearRaw.length === 2 ? `20${yearRaw}` : yearRaw;
        return `${year}-${month}-${day}`;
      }

      return undefined;
    };

    // Extrair itens
    const items: ParsedNfeItem[] = det.map((item: any) => {
      const prod = item.prod || {};
      const infAdProd = item.infAdProd || '';
      const productName = prod.xProd || prod.descricao || '';
      
      // Extrair lote, validade e data de fabricação
      let batchNumber: string | undefined;
      let expirationDate: string | undefined;
      let manufacturingDate: string | undefined;

      // Função auxiliar para extrair de uma string
      const extractFromText = (text: string) => {
        // Tentar extrair lote: "LOTE:114881" ou "LOTE: 114881" ou "Lote:114881"
        const loteMatch = text.match(/LOTE[:\s]+([A-Z0-9\-\.]+)/i);
        if (loteMatch && !batchNumber) {
          batchNumber = loteMatch[1];
        }

        // Tentar extrair data de fabricação: "FAB.05/12/2025" ou "FAB:05/12/2025" ou "FAB 05/12/2025"
        const fabMatch = text.match(/FAB[\.:\s]+(\d{2})\/(\d{2})\/(\d{2}|\d{4})/i);
        if (fabMatch && !manufacturingDate) {
          const [, day, month, year] = fabMatch;
          manufacturingDate = normalizeDate(`${day}/${month}/${year}`);
        }

        // Tentar extrair validade: "VAL.24 MESES" ou "VAL:24 MESES" ou "VAL 24 MESES"
        const valMesesMatch = text.match(/VAL[\.:\s]+(\d+)\s*MESES/i);
        if (valMesesMatch && manufacturingDate) {
          // Calcular validade baseada na data de fabricação + meses
          try {
            const [year, month, day] = manufacturingDate.split('-');
            const fabDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            const meses = parseInt(valMesesMatch[1]);
            const expDate = new Date(fabDate);
            expDate.setMonth(expDate.getMonth() + meses);
            const expYear = expDate.getFullYear();
            const expMonth = String(expDate.getMonth() + 1).padStart(2, '0');
            const expDay = String(expDate.getDate()).padStart(2, '0');
            expirationDate = `${expYear}-${expMonth}-${expDay}`;
          } catch (e) {
            // Se falhar, continuar sem validade calculada
          }
        }

        // Tentar extrair validade direta: "VAL.31/12/2025" ou "VALIDADE:31/12/2025"
        const valDataMatch = text.match(/(?:VAL[\.:\s]+|VALIDADE[:\s]+)(\d{2})\/(\d{2})\/(\d{2}|\d{4})/i);
        if (valDataMatch && !expirationDate) {
          const [, day, month, year] = valDataMatch;
          expirationDate = normalizeDate(`${day}/${month}/${year}`);
        }
      };

      // Tentar extrair primeiro do nome do produto
      if (productName) {
        extractFromText(productName);
      }

      // Tentar extrair também do campo infAdProd (informações adicionais)
      if (infAdProd) {
        extractFromText(infAdProd);
      }

      // Tentar extrair do bloco de rastreabilidade (NF-e 4.0)
      const rastros = prod.rastro || item.rastro;
      if (rastros) {
        const rastroList = Array.isArray(rastros) ? rastros : [rastros];
        for (const r of rastroList) {
          if (r.nLote || r.cLote) {
            batchNumber = String(r.nLote || r.cLote).trim();
          }
          if (r.dFab) {
            const parsedFab = normalizeDate(r.dFab);
            if (parsedFab) {
              manufacturingDate = parsedFab;
            }
          }
          if (r.dVal) {
            const parsedVal = normalizeDate(r.dVal);
            if (parsedVal) {
              expirationDate = parsedVal;
            }
          }
          if (batchNumber && manufacturingDate && expirationDate) break;
        }
      }

      // Extrair quantidade - priorizar qCom (quantidade comercial)
      const quantityRaw = prod.qCom || prod.qTrib || prod.quantidade || '0';
      const quantity = normalizeDecimalString(quantityRaw) || '0';
      
      // Extrair valor unitário - tentar vários campos
      const unitPriceRaw = prod.vUnCom || prod.vUnTrib || prod.valorUnitario || prod.precoUnitario || '0';
      let unitPrice = normalizeDecimalString(unitPriceRaw) || '0';
      
      // Se não encontrou valor unitário, tentar calcular: valor total / quantidade
      if (unitPrice === '0' || unitPrice === '' || parseFloat(String(unitPrice)) === 0) {
        const totalPrice = parseDecimal(prod.vProd || prod.vTrib || prod.valorTotal || '0') || 0;
        const quantityNum = parseDecimal(quantity || '1') || 0;
        if (totalPrice > 0 && quantityNum > 0) {
          unitPrice = (totalPrice / quantityNum).toFixed(4);
        }
      }

      // Limpar nome do produto (remover informações que já foram extraídas)
      let cleanProductName = productName;
      if (batchNumber) {
        cleanProductName = cleanProductName.replace(new RegExp(`LOTE[:\s]+${batchNumber}`, 'gi'), '').trim();
      }
      if (manufacturingDate) {
        const [year, month, day] = manufacturingDate.split('-');
        cleanProductName = cleanProductName.replace(new RegExp(`FAB[\.:\s]+${day}/${month}/${year}`, 'gi'), '').trim();
      }
      cleanProductName = cleanProductName.replace(/VAL[\.:\s]+\d+\s*MESES/gi, '').trim();
      cleanProductName = cleanProductName.replace(/VALIDADE[:\s]+\d{2}\/\d{2}\/\d{4}/gi, '').trim();
      cleanProductName = cleanProductName.replace(/\s+/g, ' ').trim(); // Remover espaços múltiplos

      return {
        productName: cleanProductName || productName, // Usar nome limpo, mas manter original se limpeza removê-lo todo
        quantity: quantity,
        unitOfMeasure: prod.uCom || prod.uTrib || prod.unidade || 'UN',
        unitPrice: String(unitPrice),
        totalPrice: normalizeDecimalString(prod.vProd || prod.vTrib || prod.valorTotal || '0') || '0',
        batchNumber,
        expirationDate,
        manufacturingDate,
        ncm: prod.NCM || prod.codigoNCM || '',
      };
    });

    return {
      accessKey: accessKey.substring(0, 44), // Garantir exatamente 44 caracteres
      invoiceNumber,
      emitterName,
      emitterCNPJ,
      emissionDate: formattedEmissionDate,
      totalValue,
      items,
    };
  } catch (error) {
    throw new Error(`Erro ao processar XML da NF-e: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
}
