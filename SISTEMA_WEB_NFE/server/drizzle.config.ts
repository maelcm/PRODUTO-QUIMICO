import type { Config } from 'drizzle-kit';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Carregar .env da raiz do projeto (pasta SISTEMA_WEB_NFE)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
config({ path: join(rootDir, '.env') });

export default {
  schema: '../drizzle/schema.ts',
  out: './drizzle/migrations',
  dialect: 'mysql',
  dbCredentials: {
    uri: process.env.DATABASE_URL || 'mysql://user:password@localhost:3306/nfe_system',
  },
} satisfies Config;
