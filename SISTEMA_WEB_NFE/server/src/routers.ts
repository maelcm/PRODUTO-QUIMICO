import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from './trpc.js';
import { parseNfeXml } from './nfe-parser.js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Carregar .env da raiz do projeto ANTES de verificar USE_GOOGLE_SHEETS
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '../..');
config({ path: join(rootDir, '.env') });

// Escolher entre MySQL e Google Sheets baseado na variável de ambiente
const USE_GOOGLE_SHEETS = process.env.USE_GOOGLE_SHEETS === 'true';

console.log('[Routers] USE_GOOGLE_SHEETS:', USE_GOOGLE_SHEETS);
console.log('[Routers] process.env.USE_GOOGLE_SHEETS:', process.env.USE_GOOGLE_SHEETS);

// Tipo comum para o módulo de banco de dados
type DbModule = {
  getOrCreateDefaultUser: () => Promise<any>;
  createNfeInvoice: (data: any) => Promise<any>;
  getNfeInvoicesByUserId: (userId: number) => Promise<any[]>;
  getNfeInvoiceById: (id: number, userId: number) => Promise<any>;
  getNfeInvoiceByAccessKey: (accessKey: string, userId: number) => Promise<any>;
  deleteNfeInvoice: (id: number, userId: number) => Promise<any>;
  createNfeItems: (items: any[]) => Promise<any>;
  getNfeItemsByInvoiceId: (invoiceId: number) => Promise<any[]>;
  getAllProductsByUserId: (userId: number) => Promise<any[]>;
  getDistinctProductNames: (userId: number) => Promise<string[]>;
  getInvoicesByProductName: (productName: string, userId: number) => Promise<any[]>;
  createManualProduct: (data: any) => Promise<any>;
  getManualProductsByUserId: (userId: number) => Promise<any[]>;
  deleteManualProduct: (id: number, userId: number) => Promise<any>;
  createDailyExpense: (data: any) => Promise<any>;
  getDailyExpensesByUserId: (userId: number, startDate?: Date, endDate?: Date) => Promise<any[]>;
  deleteDailyExpense: (id: number, userId: number) => Promise<any>;
};

// Função para carregar o módulo de banco de dados
async function loadDbModule(): Promise<DbModule> {
  if (USE_GOOGLE_SHEETS) {
    console.log('[Routers] ✅ Usando Google Sheets como banco de dados');
    const dbSheets = await import('./db-sheets.js');
    return dbSheets as DbModule;
  } else {
    console.log('[Routers] ✅ Usando MySQL como banco de dados');
    const dbMysql = await import('./db.js');
    return dbMysql as DbModule;
  }
}

// Carregar módulo de banco de dados (usando IIFE para top-level await)
const dbPromise = loadDbModule();

// Schema de validação
const accessKeySchema = z.string().length(44, 'Chave de acesso deve ter exatamente 44 dígitos');
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD');

// Router de Notas Fiscais
export const nfeRouter = router({
  // Listar todas as notas do usuário
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await dbPromise;
    return await db.getNfeInvoicesByUserId(ctx.userId);
  }),

  // Obter detalhes de uma nota
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await dbPromise;
      const invoice = await db.getNfeInvoiceById(input.id, ctx.userId);
      if (!invoice || !invoice.id) {
        throw new Error('Nota fiscal não encontrada');
      }

      const items = await db.getNfeItemsByInvoiceId(invoice.id);
      return { invoice, items };
    }),

  // Criar nota fiscal via chave de acesso
  create: protectedProcedure
    .input(
      z.object({
        accessKey: accessKeySchema,
        invoiceNumber: z.string(),
        emitterName: z.string().min(1),
        emitterCNPJ: z.string(),
        emissionDate: dateSchema,
        totalValue: z.string().or(z.number()),
        items: z.array(
          z.object({
            productName: z.string().min(1),
            quantity: z.string().or(z.number()),
            unitOfMeasure: z.string(),
            unitPrice: z.string().or(z.number()),
            totalPrice: z.string().or(z.number()),
            batchNumber: z.string().optional(),
            expirationDate: dateSchema.optional(),
            manufacturingDate: dateSchema.optional(),
            ncm: z.string().optional(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await dbPromise;
      // Verificar se a chave já existe
      const existing = await db.getNfeInvoiceByAccessKey(input.accessKey, ctx.userId);
      if (existing) {
        throw new Error('Esta chave de acesso já foi cadastrada');
      }

      // Criar nota fiscal
      const invoice = await db.createNfeInvoice({
        userId: ctx.userId,
        accessKey: input.accessKey,
        invoiceNumber: input.invoiceNumber,
        emitterName: input.emitterName,
        emitterCNPJ: input.emitterCNPJ,
        emissionDate: input.emissionDate,
        totalValue: String(input.totalValue),
      });

      if (!invoice || !invoice.id) {
        throw new Error('Erro ao criar nota fiscal');
      }

      // Criar itens - Google Sheets aceita strings, MySQL aceita Date
      const items = input.items.map((item) => {
        // Validar e garantir valores numéricos válidos
        const validateNumber = (val: any, defaultVal: string = '0'): string => {
          const str = String(val || defaultVal);
          const num = Number(str);
          return !isNaN(num) && isFinite(num) ? str : defaultVal;
        };

        const itemData: any = {
          invoiceId: invoice.id,
          productName: item.productName,
          quantity: validateNumber(item.quantity, '0'),
          unitOfMeasure: item.unitOfMeasure,
          unitPrice: validateNumber(item.unitPrice, '0'),
          totalPrice: validateNumber(item.totalPrice, '0'),
          batchNumber: item.batchNumber || null,
          expirationDate: item.expirationDate || null,
          manufacturingDate: item.manufacturingDate || null,
          ncm: item.ncm || null,
        };
        
        // Se não for Google Sheets, converter strings para Date
        if (!USE_GOOGLE_SHEETS) {
          if (item.expirationDate) {
            itemData.expirationDate = new Date(item.expirationDate);
          }
          if (item.manufacturingDate) {
            itemData.manufacturingDate = new Date(item.manufacturingDate);
          }
        }
        
        return itemData;
      });

      await db.createNfeItems(items);

      return { success: true, invoiceId: invoice.id };
    }),

  // Deletar nota fiscal
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await dbPromise;
      await db.deleteNfeInvoice(input.id, ctx.userId);
      return { success: true };
    }),

  // Parsear XML
  parseXml: protectedProcedure
    .input(z.object({ xmlContent: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        console.log('[parseXml] Iniciando processamento do XML...');
        console.log('[parseXml] Tamanho do XML:', input.xmlContent.length, 'caracteres');
        
        if (!input.xmlContent || input.xmlContent.trim().length === 0) {
          throw new Error('Conteúdo do XML está vazio');
        }

        const parsed = await parseNfeXml(input.xmlContent);
        
        console.log('[parseXml] XML processado com sucesso!');
        console.log('[parseXml] Chave de acesso:', parsed.accessKey);
        console.log('[parseXml] Número de itens:', parsed.items.length);
        
        return parsed;
      } catch (error) {
        console.error('[parseXml] ERRO ao processar XML:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Erro ao processar XML: ${errorMessage}`);
      }
    }),
});

// Router de Produtos
export const productsRouter = router({
  // Obter todos os produtos unificados (NF-e + Manual)
  getAllProducts: protectedProcedure.query(async ({ ctx }) => {
    const db = await dbPromise;
    return await db.getAllProductsByUserId(ctx.userId);
  }),

  // Obter lista de nomes únicos de produtos
  getProductNames: protectedProcedure.query(async ({ ctx }) => {
    const db = await dbPromise;
    return await db.getDistinctProductNames(ctx.userId);
  }),

  // Obter notas de um produto específico
  getProductInvoices: protectedProcedure
    .input(z.object({ productName: z.string() }))
    .query(async ({ ctx, input }) => {
      const db = await dbPromise;
      const invoices = await db.getInvoicesByProductName(input.productName, ctx.userId);
      
      // Para cada nota, calcular quantidade disponível (total - gastos)
      const expenses = await db.getDailyExpensesByUserId(ctx.userId);
      
      return invoices.map((inv: any) => {
        // Calcular quantidade consumida deste produto nesta nota
        const consumed = expenses
          .filter((exp: any) => 
            exp.productName === input.productName && 
            (inv.invoiceNumber === null || exp.invoiceNumber === inv.invoiceNumber)
          )
          .reduce((sum: number, exp: any) => sum + Number(exp.quantityUsed || 0), 0);
        
        const available = Number(inv.quantity || 0) - consumed;
        
        return {
          ...inv,
          quantityAvailable: Math.max(0, available),
          quantityConsumed: consumed,
        };
      });
    }),

  // Obter todos os lotes de um produto específico (agrupados por lote)
  getProductBatches: protectedProcedure
    .input(z.object({ productName: z.string() }))
    .query(async ({ ctx, input }) => {
      const db = await dbPromise;
      const allProducts = await db.getAllProductsByUserId(ctx.userId);
      const expenses = await db.getDailyExpensesByUserId(ctx.userId);
      
      // Filtrar produtos com o nome especificado
      const productItems = allProducts.filter((p: any) => p.productName === input.productName);
      
      // Agrupar por lote (batchNumber)
      const batchMap = new Map<string, any>();
      
      productItems.forEach((item: any) => {
        const batchKey = item.batchNumber || 'SEM_LOTE';
        const invoiceKey = item.invoiceNumber || `manual_${item.id}`;
        
        if (!batchMap.has(batchKey)) {
          batchMap.set(batchKey, {
            batchNumber: item.batchNumber || null,
            expirationDate: item.expirationDate || null,
            manufacturingDate: item.manufacturingDate || null,
            items: [],
            totalQuantity: 0,
            totalAvailable: 0,
          });
        }
        
        const batch = batchMap.get(batchKey);
        
        // Calcular quantidade consumida deste item específico
        // Considerar gastos que mencionam este lote na descrição ou que são do mesmo produto
        const consumed = expenses
          .filter((exp: any) => {
            if (exp.productName !== input.productName) return false;
            // Se tem lote, verificar se o gasto menciona o lote na descrição
            if (item.batchNumber && exp.description) {
              return exp.description.includes(item.batchNumber);
            }
            // Se não tem lote específico, considerar todos os gastos do produto
            return true;
          })
          .reduce((sum: number, exp: any) => sum + Number(exp.quantityUsed || 0), 0);
        
        // Para itens individuais, calcular disponível baseado na quantidade original
        const itemQuantity = Number(item.quantity || 0);
        const itemConsumed = consumed; // Simplificado - pode ser melhorado
        const itemAvailable = Math.max(0, itemQuantity - itemConsumed);
        
        batch.items.push({
          id: item.id,
          invoiceNumber: item.invoiceNumber,
          emissionDate: item.emissionDate,
          emitterName: item.emitterName,
          origin: item.origin,
          quantity: itemQuantity,
          unitOfMeasure: item.unitOfMeasure,
          quantityAvailable: itemAvailable,
          quantityConsumed: itemConsumed,
        });
        
        batch.totalQuantity += itemQuantity;
        batch.totalAvailable += itemAvailable;
      });
      
      // Recalcular totalAvailable considerando gastos totais do produto por lote
      batchMap.forEach((batch, batchKey) => {
        // Calcular gastos totais deste lote
        const batchExpenses = expenses
          .filter((exp: any) => {
            if (exp.productName !== input.productName) return false;
            if (batchKey === 'SEM_LOTE') {
              // Para sem lote, considerar gastos sem menção de lote específico
              return !exp.description || !exp.description.includes('Lote:');
            }
            // Para lotes específicos, verificar se o gasto menciona o lote
            return exp.description?.includes(`Lote: ${batchKey}`);
          })
          .reduce((sum: number, exp: any) => sum + Number(exp.quantityUsed || 0), 0);
        
        batch.totalAvailable = Math.max(0, batch.totalQuantity - batchExpenses);
      });
      
      // Converter Map para array e ordenar por data de validade (mais próximo primeiro)
      return Array.from(batchMap.values()).map((batch: any) => ({
        ...batch,
        items: batch.items.sort((a: any, b: any) => {
          const dateA = a.emissionDate ? new Date(a.emissionDate).getTime() : 0;
          const dateB = b.emissionDate ? new Date(b.emissionDate).getTime() : 0;
          return dateB - dateA;
        }),
      })).sort((a: any, b: any) => {
        if (!a.expirationDate && !b.expirationDate) return 0;
        if (!a.expirationDate) return 1;
        if (!b.expirationDate) return -1;
        return new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime();
      });
    }),

  // Criar produto manual
  createManual: protectedProcedure
    .input(
      z.object({
        productName: z.string().min(1),
        quantity: z.string().or(z.number()),
        unitOfMeasure: z.string(),
        unitPrice: z.string().or(z.number()),
        totalPrice: z.string().or(z.number()),
        batchNumber: z.string().optional(),
        expirationDate: dateSchema.optional(),
        manufacturingDate: dateSchema.optional(),
        purchaseDate: dateSchema,
        supplier: z.string().optional(),
        voucherNumber: z.string().optional(),
        observations: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Validar data de validade não pode ser no passado (se informada)
      if (input.expirationDate) {
        const expDate = new Date(input.expirationDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (expDate < today) {
          throw new Error('Data de validade não pode ser no passado');
        }
      }

      const db = await dbPromise;
      const productData: any = {
        userId: ctx.userId,
        productName: input.productName,
        quantity: String(input.quantity),
        unitOfMeasure: input.unitOfMeasure,
        unitPrice: String(input.unitPrice),
        totalPrice: String(input.totalPrice),
        batchNumber: input.batchNumber || null,
        expirationDate: input.expirationDate || null,
        manufacturingDate: input.manufacturingDate || null,
        purchaseDate: input.purchaseDate,
        supplier: input.supplier || null,
        voucherNumber: input.voucherNumber || null,
        observations: input.observations || null,
      };
      
      // Se não for Google Sheets, converter strings para Date
      if (!USE_GOOGLE_SHEETS) {
        if (input.expirationDate) {
          productData.expirationDate = new Date(input.expirationDate);
        }
        if (input.manufacturingDate) {
          productData.manufacturingDate = new Date(input.manufacturingDate);
        }
        productData.purchaseDate = new Date(input.purchaseDate);
      }
      
      const product = await db.createManualProduct(productData);

      if (!product || !product.id) {
        throw new Error('Erro ao criar produto manual');
      }

      return { success: true, productId: product.id };
    }),

  // Listar produtos manuais
  listManual: protectedProcedure.query(async ({ ctx }) => {
    const db = await dbPromise;
    return await db.getManualProductsByUserId(ctx.userId);
  }),

  // Deletar produto manual
  deleteManual: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await dbPromise;
      await db.deleteManualProduct(input.id, ctx.userId);
      return { success: true };
    }),

  // Rastreabilidade com cálculo de status
  traceability: protectedProcedure.query(async ({ ctx }) => {
    const db = await dbPromise;
    const products = await db.getAllProductsByUserId(ctx.userId);
    const expenses = await db.getDailyExpensesByUserId(ctx.userId);

    // Calcular quantidade disponível e status para cada produto
    return products.map((product: any) => {
      // Calcular quantidade consumida
      const consumed = expenses
        .filter((exp: any) => 
          exp.productName === product.productName && 
          (product.invoiceNumber === null || exp.invoiceNumber === product.invoiceNumber)
        )
        .reduce((sum: number, exp: any) => sum + Number(exp.quantityUsed || 0), 0);

      const available = Number(product.quantity || 0) - consumed;

      // Calcular status de validade
      let status: 'valido' | 'proximo_vencer' | 'vencido' = 'valido';
      let daysUntilExpiration: number | null = null;

      if (product.expirationDate) {
        const expDate = new Date(product.expirationDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        expDate.setHours(0, 0, 0, 0);

        const diffTime = expDate.getTime() - today.getTime();
        daysUntilExpiration = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (daysUntilExpiration < 0) {
          status = 'vencido';
        } else if (daysUntilExpiration <= 30) {
          status = 'proximo_vencer';
        }
      }

      return {
        ...product,
        quantityAvailable: Math.max(0, available),
        quantityConsumed: consumed,
        status,
        daysUntilExpiration,
      };
    });
  }),
});

// Router de Gastos
export const expensesRouter = router({
  // Criar gasto diário
  createDailyExpense: protectedProcedure
    .input(
      z.object({
        productName: z.string().min(1),
        invoiceNumber: z.string().optional(),
        expenseDate: dateSchema,
        quantityUsed: z.string().or(z.number()),
        totalExpense: z.string().or(z.number()),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await dbPromise;
      const expenseData: any = {
        userId: ctx.userId,
        productName: input.productName,
        invoiceNumber: input.invoiceNumber || null,
        expenseDate: input.expenseDate,
        quantityUsed: String(input.quantityUsed),
        totalExpense: String(input.totalExpense),
        description: input.description || null,
      };
      
      // Se não for Google Sheets, converter string para Date
      if (!USE_GOOGLE_SHEETS) {
        expenseData.expenseDate = new Date(input.expenseDate);
      }
      
      const expense = await db.createDailyExpense(expenseData);

      if (!expense || !expense.id) {
        throw new Error('Erro ao criar gasto diário');
      }

      return { success: true, expenseId: expense.id };
    }),

  // Listar gastos
  getDailyExpenses: protectedProcedure
    .input(
      z.object({
        startDate: dateSchema.optional(),
        endDate: dateSchema.optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const db = await dbPromise;
      const startDate = input?.startDate ? new Date(input.startDate) : undefined;
      const endDate = input?.endDate ? new Date(input.endDate) : undefined;

      return await db.getDailyExpensesByUserId(ctx.userId, startDate, endDate);
    }),

  // Deletar gasto
  deleteDailyExpense: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await dbPromise;
      await db.deleteDailyExpense(input.id, ctx.userId);
      return { success: true };
    }),

  // Relatório de gastos
  getExpensesReport: protectedProcedure
    .input(
      z.object({
        startDate: dateSchema,
        endDate: dateSchema,
        reportType: z.enum(['daily', 'weekly', 'monthly', 'annual']).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await dbPromise;
      const startDate = new Date(input.startDate);
      const endDate = new Date(input.endDate);
      endDate.setHours(23, 59, 59, 999); // Fim do dia

      const expenses = await db.getDailyExpensesByUserId(ctx.userId, startDate, endDate);
      
      // Agrupar por período conforme tipo de relatório
      let grouped: Record<string, any[]> = {};
      
      if (input.reportType === 'daily') {
        expenses.forEach(exp => {
          const date = new Date(exp.expenseDate).toLocaleDateString('pt-BR');
          if (!grouped[date]) grouped[date] = [];
          grouped[date].push(exp);
        });
      } else if (input.reportType === 'weekly') {
        expenses.forEach(exp => {
          const date = new Date(exp.expenseDate);
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          const weekKey = `Semana ${weekStart.toLocaleDateString('pt-BR')}`;
          if (!grouped[weekKey]) grouped[weekKey] = [];
          grouped[weekKey].push(exp);
        });
      } else if (input.reportType === 'monthly') {
        expenses.forEach(exp => {
          const date = new Date(exp.expenseDate);
          const monthKey = `${date.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}`;
          if (!grouped[monthKey]) grouped[monthKey] = [];
          grouped[monthKey].push(exp);
        });
      } else {
        // Annual ou sem agrupamento
        grouped['Todos'] = expenses;
      }

      // Calcular totais
      const totalQuantity = expenses.reduce((sum, exp) => sum + Number(exp.quantityUsed || 0), 0);
      const totalValue = expenses.reduce((sum, exp) => sum + Number(exp.totalExpense || 0), 0);

      return {
        expenses,
        grouped,
        totals: {
          count: expenses.length,
          totalQuantity,
          totalValue,
        },
        period: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          reportType: input.reportType || 'daily',
        },
      };
    }),
});

// Router de OCR
export const ocrRouter = router({
  // Processar imagem via OCR
  processImage: protectedProcedure
    .input(
      z.object({
        imageBase64: z.string().min(1, 'Imagem é obrigatória'),
      })
    )
    .mutation(async ({ input }) => {
      const OCR_API_URL = process.env.OCR_API_URL || 'http://localhost:8000';
      
      try {
        const response = await fetch(`${OCR_API_URL}/process-image-bytes`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image_base64: input.imageBase64,
          }),
        });

        if (!response.ok) {
          const errorData = (await response.json().catch(() => ({ detail: response.statusText }))) as { detail?: string };
          throw new Error(errorData.detail || `Erro ao processar imagem: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
      } catch (error: any) {
        console.error('[OCR Router] Erro ao processar imagem:', error);
        throw new Error(error.message || 'Erro ao processar imagem via OCR');
      }
    }),
});

// Router principal
export const appRouter = router({
  nfe: nfeRouter,
  products: productsRouter,
  expenses: expensesRouter,
  ocr: ocrRouter,
});

export type AppRouter = typeof appRouter;
