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
    
    console.log('[parseNfeXml] Valores extraídos da nota:');
    console.log('  invoiceNumber:', invoiceNumber);
    console.log('  totalValue:', totalValue);
    console.log('  total.vNF:', total.vNF);
    console.log('  total object:', total);

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
    // Informações adicionais da nota (campo geral) - múltiplas estruturas possíveis
    const infAdic = nfe.infAdic || {};
    const infAdicNotaParts: string[] = [];
    
    // infCpl (informações complementares)
    if (infAdic.infCpl) {
      infAdicNotaParts.push(String(infAdic.infCpl));
    }
    
    // obsCont (observações do contribuinte)
    if (infAdic.obsCont) {
      const obsContList = Array.isArray(infAdic.obsCont) ? infAdic.obsCont : [infAdic.obsCont];
      obsContList.forEach((obs: any) => {
        if (obs && typeof obs === 'object') {
          if (obs.xTexto) infAdicNotaParts.push(String(obs.xTexto));
          if (obs.xCampo) infAdicNotaParts.push(String(obs.xCampo));
        } else if (obs) {
          infAdicNotaParts.push(String(obs));
        }
      });
    }
    
    // obsFisco (observações do fisco)
    if (infAdic.obsFisco) {
      const obsFiscoList = Array.isArray(infAdic.obsFisco) ? infAdic.obsFisco : [infAdic.obsFisco];
      obsFiscoList.forEach((obs: any) => {
        if (obs && typeof obs === 'object') {
          if (obs.xTexto) infAdicNotaParts.push(String(obs.xTexto));
          if (obs.xCampo) infAdicNotaParts.push(String(obs.xCampo));
        } else if (obs) {
          infAdicNotaParts.push(String(obs));
        }
      });
    }
    
    const infAdicNota = infAdicNotaParts.filter(Boolean).join(' || ');
    
    console.log('[parseNfeXml] Informações adicionais da nota:', {
      infCpl: infAdic.infCpl || '(não encontrado)',
      obsCont: infAdic.obsCont ? 'encontrado' : '(não encontrado)',
      obsFisco: infAdic.obsFisco ? 'encontrado' : '(não encontrado)',
      textoCompleto: infAdicNota.substring(0, 500) || '(vazio)'
    });

    // Função para parsear infCpl e associar informações a produtos específicos
    const parseInfCplByProduct = (infCplText: string, allProducts: any[]): Map<number, any> => {
      const productInfoMap = new Map<number, any>();
      if (!infCplText) return productInfoMap;

      // Normalizar nomes dos produtos para matching
      const normalizeProductName = (name: string): string => {
        return name
          .toUpperCase()
          .replace(/\s+/g, ' ')
          .trim()
          .replace(/[^\w\s]/g, '')
          .replace(/\b(EM|DE|DA|DO|DOS|DAS|E|OU|COM|SEM|PARA|POR)\b/g, '');
      };

      // Extrair palavras-chave do nome do produto (remover prefixos comuns)
      const getProductKeywords = (name: string): string[] => {
        const normalized = normalizeProductName(name);
        const words = normalized.split(/\s+/).filter(w => w.length > 2);
        // Remover palavras muito comuns
        const commonWords = ['PRODUTO', 'ITEM', 'MERCADORIA'];
        return words.filter(w => !commonWords.includes(w));
      };

      // Tentar dividir o texto em blocos por produto
      // Padrão: QUANTIDADE UNIDADE NOME FABRICACAO... ou QUANTIDADEUNIDADE NOME...
      const productBlocks: string[] = [];
      
      // Primeiro tentar dividir por padrão de quantidade + unidade + nome
      const blockPattern = /(\d+(?:\.\d+)?)\s*(KG|G|L|ML|UN|UNID|PCT|CX|CAIXA|PACOTE)\s+([A-Z][^0-9]+?)(?:\s+FABRICACAO|\s+VALIDADE|\s+LOTE|$)/gi;
      let match;
      while ((match = blockPattern.exec(infCplText)) !== null) {
        productBlocks.push(match[0].trim());
      }
      
      // Se não encontrou blocos, tentar dividir por linhas ou por padrões alternativos
      if (productBlocks.length === 0) {
        const lines = infCplText.split(/\n|(?=\d+(?:\.\d+)?\s*(?:KG|G|L|ML|UN|UNID|PCT|CX|CAIXA|PACOTE))/i);
        productBlocks.push(...lines.filter(l => l.trim().length > 10));
      }
      
      console.log(`[parseInfCplByProduct] Encontrados ${productBlocks.length} blocos de produto`);
      
      for (let blockIdx = 0; blockIdx < productBlocks.length; blockIdx++) {
        const trimmedBlock = productBlocks[blockIdx].trim();
        if (!trimmedBlock || trimmedBlock.length < 10) continue;

        // Extrair quantidade e nome do produto do bloco
        let qtyMatch = trimmedBlock.match(/^(\d+(?:\.\d+)?)\s*(KG|G|L|ML|UN|UNID|PCT|CX|CAIXA|PACOTE)\s+(.+?)(?:\s+FABRICACAO|\s+VALIDADE|\s+LOTE|$)/i);
        if (!qtyMatch) {
          // Tentar padrão alternativo sem espaço entre quantidade e unidade
          const altMatch = trimmedBlock.match(/^(\d+(?:\.\d+)?)(KG|G|L|ML|UN|UNID|PCT|CX|CAIXA|PACOTE)\s+(.+?)(?:\s+FABRICACAO|\s+VALIDADE|\s+LOTE|$)/i);
          if (!altMatch) continue;
          qtyMatch = altMatch;
        }

        const [, qtyStr, unit, productNamePart] = qtyMatch;
        const qty = parseFloat(qtyStr);
        const normalizedBlockName = normalizeProductName(productNamePart);
        const blockKeywords = getProductKeywords(productNamePart);

        console.log(`[parseInfCplByProduct] Bloco ${blockIdx + 1}: ${qty}${unit} "${productNamePart}"`);

        // Procurar qual produto corresponde a este bloco
        let bestMatch: { index: number; score: number } | null = null;
        
        for (let i = 0; i < allProducts.length; i++) {
          if (productInfoMap.has(i)) continue; // Já foi associado
          
          const prod = allProducts[i].prod || {};
          const prodName = normalizeProductName(prod.xProd || prod.descricao || '');
          const prodQty = parseFloat(String(prod.qCom || prod.qTrib || 0));
          const prodKeywords = getProductKeywords(prod.xProd || prod.descricao || '');

          // Calcular score de matching
          let score = 0;
          
          // Match por quantidade (com tolerância)
          const qtyDiff = Math.abs(qty - prodQty);
          if (qtyDiff < 0.01) {
            score += 10; // Quantidade exata
          } else if (qtyDiff < 1) {
            score += 5; // Quantidade próxima
          }

          // Match por nome (verificar se palavras-chave aparecem)
          let keywordMatches = 0;
          for (const keyword of blockKeywords) {
            if (prodKeywords.some(pk => pk.includes(keyword) || keyword.includes(pk))) {
              keywordMatches++;
            }
          }
          if (keywordMatches > 0) {
            score += keywordMatches * 5;
          }

          // Match por substring
          if (normalizedBlockName.includes(prodName) || prodName.includes(normalizedBlockName)) {
            score += 3;
          }

          if (score > 0 && (!bestMatch || score > bestMatch.score)) {
            bestMatch = { index: i, score };
          }
        }

        if (bestMatch && bestMatch.score >= 5) {
          const i = bestMatch.index;
          const prod = allProducts[i].prod || {};
          
          // Extrair informações deste bloco
          let batchNumber: string | undefined;
          let expirationDate: string | undefined;
          let manufacturingDate: string | undefined;

          // Lote
          const loteMatch = trimmedBlock.match(/LOTE[:\s\-]*([A-Z0-9\/\-\._]+)/i);
          if (loteMatch) {
            batchNumber = loteMatch[1].trim();
          }

          // Fabricação
          const fabMatch = trimmedBlock.match(/FABRICAÇÃO[\.:\s\-]*([0-9]{2})\/([0-9]{2})\/([0-9]{2,4})/i);
          if (fabMatch) {
            const [, day, month, year] = fabMatch;
            manufacturingDate = normalizeDate(`${day}/${month}/${year}`);
          }

          // Validade
          const valMatch = trimmedBlock.match(/VALIDADE[\.:\s\-]*([0-9]{2})\/([0-9]{2})\/([0-9]{2,4})/i);
          if (valMatch) {
            const [, day, month, year] = valMatch;
            expirationDate = normalizeDate(`${day}/${month}/${year}`);
          }

          productInfoMap.set(i, { batchNumber, expirationDate, manufacturingDate });
          console.log(`[parseInfCplByProduct] ✅ Produto ${i + 1} "${prod.xProd || prod.descricao}" (${prod.qCom || prod.qTrib}${prod.uCom || ''}) associado (score: ${bestMatch.score}):`, {
            batchNumber,
            expirationDate,
            manufacturingDate
          });
        } else {
          console.log(`[parseInfCplByProduct] ⚠️ Bloco ${blockIdx + 1} não encontrou produto correspondente`);
        }
      }

      return productInfoMap;
    };

    // Parsear infCpl antes de processar os itens
    const infCplText = infAdic.infCpl ? String(infAdic.infCpl) : '';
    const productInfoMap = parseInfCplByProduct(infCplText, det);

    const items: ParsedNfeItem[] = det.map((item: any, index: number) => {
      const prod = item.prod || {};
      
      // Ler infAdProd de múltiplas estruturas possíveis
      let infAdProd = '';
      if (item.infAdProd) {
        infAdProd = String(item.infAdProd).trim();
      } else if (prod.infAdProd) {
        infAdProd = String(prod.infAdProd).trim();
      } else if (item.infAdic?.infAdProd) {
        infAdProd = String(item.infAdic.infAdProd).trim();
      }
      
      const productName = prod.xProd || prod.descricao || '';
      
      console.log(`[parseNfeXml] Item ${index + 1}:`);
      console.log(`  productName: "${productName}"`);
      console.log(`  infAdProd: "${infAdProd}"`);
      
      // Extrair lote, validade e data de fabricação
      let batchNumber: string | undefined;
      let expirationDate: string | undefined;
      let manufacturingDate: string | undefined;

      // PRIMEIRO: Tentar usar informações do infCpl parseado por produto
      const infCplInfo = productInfoMap.get(index);
      if (infCplInfo) {
        batchNumber = infCplInfo.batchNumber || batchNumber;
        expirationDate = infCplInfo.expirationDate || expirationDate;
        manufacturingDate = infCplInfo.manufacturingDate || manufacturingDate;
        console.log(`  [infCpl] Informações encontradas:`, { batchNumber, expirationDate, manufacturingDate });
      }

      // Função auxiliar para extrair de uma string
      const extractFromText = (text: string, source: string) => {
        if (!text || typeof text !== 'string') return;
        
        const normalizedText = String(text).trim();
        if (!normalizedText) return;

        // Lote: aceita letras/números, /, -, ., _ - múltiplos padrões
        const lotePatterns = [
          /LOTE[:\s\-]*([A-Z0-9\/\-\._]+)/i,
          /LOTE\s*N[°º\.\s]*([A-Z0-9\/\-\._]+)/i,
          /LOTE\s*([A-Z0-9\/\-\._]+)/i,
          /L:\s*([A-Z0-9\/\-\._]+)/i,
        ];
        
        for (const pattern of lotePatterns) {
          const loteMatch = normalizedText.match(pattern);
          if (loteMatch && !batchNumber) {
            batchNumber = loteMatch[1].trim();
            console.log(`  [extractFromText] LOTE encontrado em ${source}: "${batchNumber}"`);
            break;
          }
        }

        // Data de fabricação: múltiplos padrões
        const fabPatterns = [
          /FA(?:B|BR|BRICACAO|BRICAÇÃO)[\.:\s\-]*([0-9]{2})\/([0-9]{2})\/([0-9]{2,4})/i,
          /FAB[\.:\s\-]*([0-9]{2})\/([0-9]{2})\/([0-9]{2,4})/i,
          /FABR[\.:\s\-]*([0-9]{2})\/([0-9]{2})\/([0-9]{2,4})/i,
          /FABRICAÇÃO[\.:\s\-]*([0-9]{2})\/([0-9]{2})\/([0-9]{2,4})/i,
          /F\.\s*([0-9]{2})\/([0-9]{2})\/([0-9]{2,4})/i,
        ];
        
        for (const pattern of fabPatterns) {
          const fabMatch = normalizedText.match(pattern);
          if (fabMatch && !manufacturingDate) {
            const [, day, month, year] = fabMatch;
            manufacturingDate = normalizeDate(`${day}/${month}/${year}`);
            console.log(`  [extractFromText] FABRICAÇÃO encontrada em ${source}: "${day}/${month}/${year}" -> "${manufacturingDate}"`);
            break;
          }
        }

        // Validade em meses: VAL, VALD, VALIDADE
        const valMesesMatch = normalizedText.match(/VAL(?:\.|IDADE)?[\.:\s\-]*([0-9]+)\s*MESES/i);
        if (valMesesMatch && manufacturingDate) {
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
            console.log(`  [extractFromText] VALIDADE calculada em ${source} (${meses} meses): "${expirationDate}"`);
          } catch (e) {
            console.log(`  [extractFromText] Erro ao calcular validade: ${e}`);
          }
        }

        // Validade direta: múltiplos padrões
        const valPatterns = [
          /VAL(?:\.|IDADE)?[\.:\s\-]*([0-9]{2})\/([0-9]{2})\/([0-9]{2,4})/i,
          /VENC(?:IMENTO)?[\.:\s\-]*([0-9]{2})\/([0-9]{2})\/([0-9]{2,4})/i,
          /V\.\s*([0-9]{2})\/([0-9]{2})\/([0-9]{2,4})/i,
          /VALIDADE[\.:\s\-]*([0-9]{2})\/([0-9]{2})\/([0-9]{2,4})/i,
        ];
        
        for (const pattern of valPatterns) {
          const valDataMatch = normalizedText.match(pattern);
          if (valDataMatch && !expirationDate) {
            const [, day, month, year] = valDataMatch;
            expirationDate = normalizeDate(`${day}/${month}/${year}`);
            console.log(`  [extractFromText] VALIDADE encontrada em ${source}: "${day}/${month}/${year}" -> "${expirationDate}"`);
            break;
          }
        }
      };

      // Tentar extrair primeiro do nome do produto (se ainda não tiver do infCpl)
      if (productName && (!batchNumber || !expirationDate || !manufacturingDate)) {
        extractFromText(productName, 'productName');
      }

      // Tentar extrair também do campo infAdProd (informações adicionais do item)
      if (infAdProd && (!batchNumber || !expirationDate || !manufacturingDate)) {
        extractFromText(infAdProd, 'infAdProd');
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

      // Garantir que valores numéricos sejam válidos
      const safeQuantity = quantity && !isNaN(Number(quantity)) ? quantity : '0';
      const safeUnitPrice = unitPrice && !isNaN(Number(unitPrice)) ? String(unitPrice) : '0';
      const safeTotalPrice = normalizeDecimalString(prod.vProd || prod.vTrib || prod.valorTotal || '0') || '0';
      const validTotalPrice = safeTotalPrice && !isNaN(Number(safeTotalPrice)) ? safeTotalPrice : '0';

      const itemResult = {
        productName: cleanProductName || productName, // Usar nome limpo, mas manter original se limpeza removê-lo todo
        quantity: safeQuantity,
        unitOfMeasure: prod.uCom || prod.uTrib || prod.unidade || 'UN',
        unitPrice: safeUnitPrice,
        totalPrice: validTotalPrice,
        batchNumber,
        expirationDate,
        manufacturingDate,
        ncm: prod.NCM || prod.codigoNCM || '',
      };
      
      console.log(`[parseNfeXml] Item ${index + 1} extraído:`, {
        product: itemResult.productName,
        quantity: itemResult.quantity,
        unitPrice: itemResult.unitPrice,
        totalPrice: itemResult.totalPrice,
        batchNumber: itemResult.batchNumber || '(vazio)',
        expirationDate: itemResult.expirationDate || '(vazio)',
        manufacturingDate: itemResult.manufacturingDate || '(vazio)',
        vProd: prod.vProd
      });
      
      return itemResult;
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
