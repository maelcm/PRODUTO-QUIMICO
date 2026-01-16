import express from 'express';
import cors from 'cors';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { appRouter } from './routers.js';
import { createContext } from './context.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';

// Carregar .env da raiz do projeto (pasta SISTEMA_WEB_NFE)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '../..');
config({ path: join(rootDir, '.env') });

console.log('🔧 Carregando configurações de:', join(rootDir, '.env'));
console.log('📦 DATABASE_URL:', process.env.DATABASE_URL ? 'Configurado ✓' : 'NÃO CONFIGURADO ✗');

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://maelcm.github.io',
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Permitir requisições sem origin (mobile apps, curl, etc)
    if (!origin) return callback(null, true);
    
    // Verificar se a origin está na lista ou se começa com allowed domains
    if (allowedOrigins.some(allowed => origin === allowed || origin.startsWith(allowed))) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Test endpoint para verificar conexão com banco
app.get('/test-db', async (req, res) => {
  try {
    // Escolher módulo de DB baseado na configuração
    const USE_GOOGLE_SHEETS = process.env.USE_GOOGLE_SHEETS === 'true';
    const dbModule = USE_GOOGLE_SHEETS 
      ? await import('./db-sheets.js')
      : await import('./db.js');
    const user = await dbModule.getOrCreateDefaultUser();
    if (user) {
      res.json({ status: 'ok', user: { id: user.id, email: user.email, name: user.name } });
    } else {
      res.status(500).json({ status: 'error', message: 'Usuário padrão não encontrado' });
    }
  } catch (error: any) {
    console.error('[test-db] Erro:', error);
    res.status(500).json({ 
      status: 'error', 
      message: error.message || 'Erro ao conectar com banco de dados',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
});

// Middleware para capturar erros antes do tRPC
app.use((req, res, next) => {
  // Garantir que sempre há tratamento de erro
  const originalSend = res.send;
  res.send = function(data) {
    try {
      return originalSend.call(this, data);
    } catch (err) {
      console.error('[Response Send Error]:', err);
      return originalSend.call(this, JSON.stringify({ error: 'Erro ao enviar resposta' }));
    }
  };
  next();
});

// tRPC middleware
app.use(
  '/trpc',
  createExpressMiddleware({
    router: appRouter,
    createContext: async (opts) => {
      try {
        const ctx = await createContext(opts);
        return ctx;
      } catch (error) {
        console.error('[Context Error]:', error);
        // Retornar contexto mínimo em caso de erro (evitar crash do servidor)
        return {
          userId: 1,
          user: {
            id: 1,
            email: 'usuario@padrao.local',
            name: 'Usuário Padrão',
          },
        };
      }
    },
    onError: ({ error, path, type }) => {
      console.error(`[tRPC Error] Path: ${path || 'unknown'}, Type: ${type}`);
      console.error(`[tRPC Error] Message:`, error.message);
      console.error(`[tRPC Error] Stack:`, error.stack);
      if (error.cause) {
        console.error(`[tRPC Error] Cause:`, error.cause);
      }
    },
  })
);

// Tratamento de erros não capturados
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ [Unhandled Rejection] at:', promise);
  console.error('❌ [Unhandled Rejection] reason:', reason);
  if (reason instanceof Error) {
    console.error('❌ [Unhandled Rejection] stack:', reason.stack);
  }
});

process.on('uncaughtException', (error) => {
  console.error('❌ [Uncaught Exception]:', error);
  console.error('❌ [Uncaught Exception] stack:', error.stack);
  // Não fazer exit para permitir que o servidor continue rodando
});

// Iniciar servidor
try {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📡 tRPC endpoint: http://localhost:${PORT}/trpc`);
    console.log(`🌐 Health check: http://localhost:${PORT}/health`);
    console.log(`🗄️  Test DB: http://localhost:${PORT}/test-db`);
    console.log('');
    console.log('✅ Servidor iniciado com sucesso!');
    console.log('⚠️  Se houver problemas com o banco de dados, verifique os logs acima.');
  }).on('error', (error: any) => {
    console.error('❌ Erro ao iniciar servidor:', error.message);
    if (error.code === 'EADDRINUSE') {
      console.error(`❌ Porta ${PORT} já está em uso!`);
      console.error('   Feche outras aplicações que estão usando esta porta.');
      console.error('   Ou altere a variável PORT no arquivo .env');
    }
    process.exit(1);
  });
} catch (error: any) {
  console.error('❌ Erro fatal ao iniciar servidor:', error.message);
  console.error('❌ Stack:', error.stack);
  process.exit(1);
}
