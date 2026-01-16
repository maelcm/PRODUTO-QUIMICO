import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2';
import { eq, and, desc, gte, lte, sql } from 'drizzle-orm';
import * as schema from './drizzle/schema';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';

// Carregar .env da raiz do projeto (pasta SISTEMA_WEB_NFE)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '../..');
config({ path: join(rootDir, '.env') });

// Conexão com MySQL
// Parse da URL ou usar configuração direta
function parseDatabaseUrl(url?: string) {
  if (!url) {
    return {
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: '',
      database: 'nfe_system',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    };
  }

  // Parse manual da URL MySQL
  const match = url.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
  if (match) {
    return {
      host: match[3],
      port: parseInt(match[4]) || 3306,
      user: match[1],
      password: match[2],
      database: match[5],
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    };
  }

  // Fallback para configuração padrão
  return {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
    database: 'nfe_system',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  };
}

// Criar pool de conexão com tratamento de erros
let connection: mysql.Pool;
try {
  const config = parseDatabaseUrl(process.env.DATABASE_URL);
  console.log('[DB] Tentando conectar ao banco de dados...');
  console.log('[DB] Host:', config.host, 'Port:', config.port, 'Database:', config.database);
  
  connection = mysql.createPool(config);
  
  // Testar conexão
  connection.getConnection((err, conn) => {
    if (err) {
      console.error('[DB] ❌ Erro ao conectar ao banco de dados:', err.message);
      console.error('[DB] Verifique se o MySQL está rodando e se o DATABASE_URL está correto no arquivo .env');
    } else {
      console.log('[DB] ✅ Conexão com banco de dados estabelecida com sucesso!');
      conn.release();
    }
  });
} catch (error: any) {
  console.error('[DB] ❌ Erro ao criar pool de conexão:', error.message);
  // Criar pool vazio para evitar crash
  connection = mysql.createPool({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
    database: 'nfe_system',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });
}

export const db = drizzle(connection, { schema, mode: 'default' });

// Funções de Database para Notas Fiscais
export async function createNfeInvoice(data: schema.NewNfeInvoice) {
  await db.insert(schema.nfeInvoices).values(data);
  // Buscar a nota criada
  const [invoice] = await db.select().from(schema.nfeInvoices)
    .where(eq(schema.nfeInvoices.accessKey, data.accessKey))
    .orderBy(desc(schema.nfeInvoices.createdAt))
    .limit(1);
  return invoice;
}

export async function getNfeInvoicesByUserId(userId: number) {
  return await db.select().from(schema.nfeInvoices)
    .where(eq(schema.nfeInvoices.userId, userId))
    .orderBy(desc(schema.nfeInvoices.createdAt));
}

export async function getNfeInvoiceById(id: number, userId: number) {
  const [invoice] = await db.select().from(schema.nfeInvoices)
    .where(and(eq(schema.nfeInvoices.id, id), eq(schema.nfeInvoices.userId, userId)));
  return invoice;
}

export async function getNfeInvoiceByAccessKey(accessKey: string, userId: number) {
  const [invoice] = await db.select().from(schema.nfeInvoices)
    .where(and(eq(schema.nfeInvoices.accessKey, accessKey), eq(schema.nfeInvoices.userId, userId)));
  return invoice;
}

export async function deleteNfeInvoice(id: number, userId: number) {
  return await db.delete(schema.nfeInvoices)
    .where(and(eq(schema.nfeInvoices.id, id), eq(schema.nfeInvoices.userId, userId)));
}

// Funções para Itens de NF-e
export async function createNfeItem(data: schema.NewNfeItem) {
  const [item] = await db.insert(schema.nfeItems).values(data);
  return item;
}

export async function createNfeItems(items: schema.NewNfeItem[]) {
  if (items.length === 0) return [];
  return await db.insert(schema.nfeItems).values(items);
}

export async function getNfeItemsByInvoiceId(invoiceId: number) {
  return await db.select().from(schema.nfeItems)
    .where(eq(schema.nfeItems.invoiceId, invoiceId));
}

export async function getAllNfeItemsByUserId(userId: number) {
  return await db.select({
    item: schema.nfeItems,
    invoice: schema.nfeInvoices,
  })
    .from(schema.nfeItems)
    .innerJoin(schema.nfeInvoices, eq(schema.nfeItems.invoiceId, schema.nfeInvoices.id))
    .where(eq(schema.nfeInvoices.userId, userId));
}

// Funções para Produtos Manuais
export async function createManualProduct(data: schema.NewManualProduct) {
  await db.insert(schema.manualProducts).values(data);
  // Buscar o produto criado
  const products = await db.select().from(schema.manualProducts)
    .where(eq(schema.manualProducts.userId, data.userId))
    .orderBy(desc(schema.manualProducts.createdAt))
    .limit(1);
  return products[0];
}

export async function getManualProductsByUserId(userId: number) {
  return await db.select().from(schema.manualProducts)
    .where(eq(schema.manualProducts.userId, userId))
    .orderBy(desc(schema.manualProducts.createdAt));
}

export async function deleteManualProduct(id: number, userId: number) {
  return await db.delete(schema.manualProducts)
    .where(and(eq(schema.manualProducts.id, id), eq(schema.manualProducts.userId, userId)));
}

// Funções para Produtos Unificados (NF-e + Manual)
export async function getAllProductsByUserId(userId: number) {
  const nfeItems = await db.select({
    id: schema.nfeItems.id,
    productName: schema.nfeItems.productName,
    quantity: schema.nfeItems.quantity,
    unitOfMeasure: schema.nfeItems.unitOfMeasure,
    batchNumber: schema.nfeItems.batchNumber,
    expirationDate: schema.nfeItems.expirationDate,
    manufacturingDate: schema.nfeItems.manufacturingDate,
    invoiceNumber: schema.nfeInvoices.invoiceNumber,
    emissionDate: schema.nfeInvoices.emissionDate,
    emitterName: schema.nfeInvoices.emitterName,
    origin: sql<string>`'NF-e'`,
    invoiceId: schema.nfeInvoices.id,
  })
    .from(schema.nfeItems)
    .innerJoin(schema.nfeInvoices, eq(schema.nfeItems.invoiceId, schema.nfeInvoices.id))
    .where(eq(schema.nfeInvoices.userId, userId));

  const manualProducts = await db.select({
    id: schema.manualProducts.id,
    productName: schema.manualProducts.productName,
    quantity: schema.manualProducts.quantity,
    unitOfMeasure: schema.manualProducts.unitOfMeasure,
    batchNumber: schema.manualProducts.batchNumber,
    expirationDate: schema.manualProducts.expirationDate,
    manufacturingDate: schema.manualProducts.manufacturingDate,
    invoiceNumber: sql<string | null>`NULL`,
    emissionDate: schema.manualProducts.purchaseDate,
    emitterName: schema.manualProducts.supplier,
    origin: sql<string>`'Manual'`,
    invoiceId: sql<number | null>`NULL`,
  })
    .from(schema.manualProducts)
    .where(eq(schema.manualProducts.userId, userId));

  return [...nfeItems, ...manualProducts];
}

export async function getDistinctProductNames(userId: number) {
  const nfeNames = await db.selectDistinct({ productName: schema.nfeItems.productName })
    .from(schema.nfeItems)
    .innerJoin(schema.nfeInvoices, eq(schema.nfeItems.invoiceId, schema.nfeInvoices.id))
    .where(eq(schema.nfeInvoices.userId, userId));

  const manualNames = await db.selectDistinct({ productName: schema.manualProducts.productName })
    .from(schema.manualProducts)
    .where(eq(schema.manualProducts.userId, userId));

  const allNames = [...nfeNames.map(n => n.productName), ...manualNames.map(n => n.productName)];
  return [...new Set(allNames)].sort();
}

export async function getInvoicesByProductName(productName: string, userId: number) {
  const nfeInvoices = await db.select({
    invoiceId: schema.nfeInvoices.id,
    invoiceNumber: schema.nfeInvoices.invoiceNumber,
    emissionDate: schema.nfeInvoices.emissionDate,
    emitterName: schema.nfeInvoices.emitterName,
    origin: sql<string>`'NF-e'`,
    batchNumber: schema.nfeItems.batchNumber,
    expirationDate: schema.nfeItems.expirationDate,
    quantity: schema.nfeItems.quantity,
  })
    .from(schema.nfeItems)
    .innerJoin(schema.nfeInvoices, eq(schema.nfeItems.invoiceId, schema.nfeInvoices.id))
    .where(and(
      eq(schema.nfeInvoices.userId, userId),
      eq(schema.nfeItems.productName, productName)
    ));

  const manualProducts = await db.select({
    invoiceId: sql<number | null>`NULL`,
    invoiceNumber: sql<string | null>`NULL`,
    emissionDate: schema.manualProducts.purchaseDate,
    emitterName: schema.manualProducts.supplier,
    origin: sql<string>`'Manual'`,
    batchNumber: schema.manualProducts.batchNumber,
    expirationDate: schema.manualProducts.expirationDate,
    quantity: schema.manualProducts.quantity,
  })
    .from(schema.manualProducts)
    .where(and(
      eq(schema.manualProducts.userId, userId),
      eq(schema.manualProducts.productName, productName)
    ));

  return [...nfeInvoices, ...manualProducts];
}

// Funções para Gastos Diários
export async function createDailyExpense(data: schema.NewDailyExpense) {
  await db.insert(schema.dailyExpenses).values(data);
  // Buscar o gasto criado
  const expenses = await db.select().from(schema.dailyExpenses)
    .where(eq(schema.dailyExpenses.userId, data.userId))
    .orderBy(desc(schema.dailyExpenses.createdAt))
    .limit(1);
  return expenses[0];
}

export async function getDailyExpensesByUserId(userId: number, startDate?: Date, endDate?: Date) {
  const conditions = [eq(schema.dailyExpenses.userId, userId)];

  if (startDate) {
    conditions.push(gte(schema.dailyExpenses.expenseDate, startDate));
  }
  if (endDate) {
    conditions.push(lte(schema.dailyExpenses.expenseDate, endDate));
  }

  const whereClause = conditions.length === 1 ? conditions[0] : and(...conditions);

  return await db.select()
    .from(schema.dailyExpenses)
    .where(whereClause)
    .orderBy(desc(schema.dailyExpenses.expenseDate));
}

export async function deleteDailyExpense(id: number, userId: number) {
  return await db.delete(schema.dailyExpenses)
    .where(and(eq(schema.dailyExpenses.id, id), eq(schema.dailyExpenses.userId, userId)));
}

// Função para criar ou obter usuário padrão (temporário, até implementar OAuth)
export async function getOrCreateDefaultUser(): Promise<schema.User> {
  try {
    console.log('[getOrCreateDefaultUser] Buscando usuário padrão...');
    
    // Tentar encontrar usuário padrão
    const users = await db.select().from(schema.users)
      .where(eq(schema.users.email, 'usuario@padrao.local'))
      .limit(1);

    if (users.length > 0) {
      console.log('[getOrCreateDefaultUser] Usuário padrão encontrado:', users[0].id);
      return users[0];
    }

    console.log('[getOrCreateDefaultUser] Usuário padrão não encontrado. Criando...');
    
    // Criar usuário padrão se não existir
    const now = new Date();
    const newUser = {
      openId: 'default-user-' + Date.now(),
      name: 'Usuário Padrão',
      email: 'usuario@padrao.local',
      loginMethod: 'local',
      role: 'admin' as const,
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(schema.users).values(newUser);
    console.log('[getOrCreateDefaultUser] Usuário padrão criado');
    
    const createdUsers = await db.select().from(schema.users)
      .where(eq(schema.users.email, 'usuario@padrao.local'))
      .limit(1);
    
    if (createdUsers.length === 0) {
      throw new Error('Não foi possível criar usuário padrão');
    }
    
    console.log('[getOrCreateDefaultUser] Usuário padrão retornado:', createdUsers[0].id);
    return createdUsers[0];
  } catch (error) {
    console.error('[getOrCreateDefaultUser] Erro:', error);
    throw error;
  }
}
