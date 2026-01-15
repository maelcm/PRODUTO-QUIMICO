import { mysqlTable, int, varchar, decimal, date, datetime, index } from 'drizzle-orm/mysql-core';

// Tabela de Usuários
export const users = mysqlTable('users', {
  id: int('id').primaryKey().autoincrement(),
  openId: varchar('openId', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  loginMethod: varchar('loginMethod', { length: 50 }).notNull(),
  role: varchar('role', { length: 20 }).notNull().default('user'),
  createdAt: datetime('createdAt').notNull(),
  updatedAt: datetime('updatedAt').notNull(),
  lastSignedIn: datetime('lastSignedIn'),
}, (table) => ({
  emailIdx: index('email_idx').on(table.email),
  openIdIdx: index('openId_idx').on(table.openId),
}));

// Tabela de Notas Fiscais
export const nfeInvoices = mysqlTable('nfe_invoices', {
  id: int('id').primaryKey().autoincrement(),
  userId: int('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  accessKey: varchar('accessKey', { length: 44 }).notNull().unique(),
  invoiceNumber: varchar('invoiceNumber', { length: 50 }).notNull(),
  emitterName: varchar('emitterName', { length: 255 }).notNull(),
  emitterCNPJ: varchar('emitterCNPJ', { length: 18 }).notNull(),
  emissionDate: date('emissionDate').notNull(),
  totalValue: decimal('totalValue', { precision: 10, scale: 2 }).notNull(),
  xmlUrl: varchar('xmlUrl', { length: 500 }),
  createdAt: datetime('createdAt').notNull(),
  updatedAt: datetime('updatedAt').notNull(),
}, (table) => ({
  userIdIdx: index('userId_idx').on(table.userId),
  accessKeyIdx: index('accessKey_idx').on(table.accessKey),
}));

// Tabela de Itens de Notas Fiscais
export const nfeItems = mysqlTable('nfe_items', {
  id: int('id').primaryKey().autoincrement(),
  invoiceId: int('invoiceId').notNull().references(() => nfeInvoices.id, { onDelete: 'cascade' }),
  productName: varchar('productName', { length: 255 }).notNull(),
  quantity: decimal('quantity', { precision: 10, scale: 3 }).notNull(),
  unitOfMeasure: varchar('unitOfMeasure', { length: 20 }).notNull(),
  unitPrice: decimal('unitPrice', { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal('totalPrice', { precision: 10, scale: 2 }).notNull(),
  batchNumber: varchar('batchNumber', { length: 100 }),
  expirationDate: date('expirationDate'),
  manufacturingDate: date('manufacturingDate'),
  ncm: varchar('ncm', { length: 10 }),
  createdAt: datetime('createdAt').notNull(),
  updatedAt: datetime('updatedAt').notNull(),
}, (table) => ({
  invoiceIdIdx: index('invoiceId_idx').on(table.invoiceId),
  productNameIdx: index('productName_idx').on(table.productName),
}));

// Tabela de Produtos Cadastrados Manualmente
export const manualProducts = mysqlTable('manual_products', {
  id: int('id').primaryKey().autoincrement(),
  userId: int('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  productName: varchar('productName', { length: 255 }).notNull(),
  quantity: decimal('quantity', { precision: 10, scale: 3 }).notNull(),
  unitOfMeasure: varchar('unitOfMeasure', { length: 20 }).notNull(),
  unitPrice: decimal('unitPrice', { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal('totalPrice', { precision: 10, scale: 2 }).notNull(),
  batchNumber: varchar('batchNumber', { length: 100 }),
  expirationDate: date('expirationDate'),
  manufacturingDate: date('manufacturingDate'),
  purchaseDate: date('purchaseDate').notNull(),
  supplier: varchar('supplier', { length: 255 }),
  voucherNumber: varchar('voucherNumber', { length: 100 }),
  observations: varchar('observations', { length: 1000 }),
  createdAt: datetime('createdAt').notNull(),
  updatedAt: datetime('updatedAt').notNull(),
}, (table) => ({
  userIdIdx: index('userId_idx').on(table.userId),
  productNameIdx: index('productName_idx').on(table.productName),
}));

// Tabela de Movimentações de Estoque
export const stockMovements = mysqlTable('stock_movements', {
  id: int('id').primaryKey().autoincrement(),
  userId: int('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  productName: varchar('productName', { length: 255 }).notNull(),
  quantity: decimal('quantity', { precision: 10, scale: 3 }).notNull(),
  movementType: varchar('movementType', { length: 20 }).notNull(),
  invoiceNumber: varchar('invoiceNumber', { length: 50 }),
  movementDate: date('movementDate').notNull(),
  createdAt: datetime('createdAt').notNull(),
  updatedAt: datetime('updatedAt').notNull(),
}, (table) => ({
  userIdIdx: index('userId_idx').on(table.userId),
  productNameIdx: index('productName_idx').on(table.productName),
  movementDateIdx: index('movementDate_idx').on(table.movementDate),
}));

// Tabela de Gastos Diários
export const dailyExpenses = mysqlTable('daily_expenses', {
  id: int('id').primaryKey().autoincrement(),
  userId: int('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  productName: varchar('productName', { length: 255 }).notNull(),
  invoiceNumber: varchar('invoiceNumber', { length: 50 }),
  expenseDate: date('expenseDate').notNull(),
  quantityUsed: decimal('quantityUsed', { precision: 10, scale: 3 }).notNull(),
  totalExpense: decimal('totalExpense', { precision: 10, scale: 2 }).notNull(),
  description: varchar('description', { length: 500 }),
  createdAt: datetime('createdAt').notNull(),
  updatedAt: datetime('updatedAt').notNull(),
}, (table) => ({
  userIdIdx: index('userId_idx').on(table.userId),
  productNameIdx: index('productName_idx').on(table.productName),
  expenseDateIdx: index('expenseDate_idx').on(table.expenseDate),
}));

// Types para TypeScript
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type NfeInvoice = typeof nfeInvoices.$inferSelect;
export type NewNfeInvoice = typeof nfeInvoices.$inferInsert;
export type NfeItem = typeof nfeItems.$inferSelect;
export type NewNfeItem = typeof nfeItems.$inferInsert;
export type ManualProduct = typeof manualProducts.$inferSelect;
export type NewManualProduct = typeof manualProducts.$inferInsert;
export type StockMovement = typeof stockMovements.$inferSelect;
export type NewStockMovement = typeof stockMovements.$inferInsert;
export type DailyExpense = typeof dailyExpenses.$inferSelect;
export type NewDailyExpense = typeof dailyExpenses.$inferInsert;
