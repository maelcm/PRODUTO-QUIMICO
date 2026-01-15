import { CreateExpressContextOptions } from '@trpc/server/adapters/express';

// Context do tRPC
export interface Context {
  userId?: number;
  user?: {
    id: number;
    email: string;
    name: string;
  };
}

// Criar context a partir da requisição Express
export async function createContext({ req, res }: CreateExpressContextOptions): Promise<Context> {
  try {
    // TODO: Implementar autenticação OAuth (Manus Auth)
    // Por enquanto, vamos usar um header simples ou criar usuário padrão
    // Em produção, isso deve validar o token OAuth
    
    const userId = req.headers['x-user-id'] ? Number(req.headers['x-user-id']) : undefined;
    const userEmail = req.headers['x-user-email'] as string | undefined;
    const userName = req.headers['x-user-name'] as string | undefined;

    // Se não houver headers, criar/usar usuário padrão
    if (!userId || !userEmail || !userName) {
      try {
        // Escolher módulo de DB baseado na configuração
        const USE_GOOGLE_SHEETS = process.env.USE_GOOGLE_SHEETS === 'true';
        const dbModule = USE_GOOGLE_SHEETS 
          ? await import('./db-sheets.js')
          : await import('./db.js');
        const defaultUser = await dbModule.getOrCreateDefaultUser();
        
        return {
          userId: defaultUser.id,
          user: {
            id: defaultUser.id,
            email: defaultUser.email,
            name: defaultUser.name,
          },
        };
      } catch (dbError) {
        console.error('[createContext] Erro ao obter usuário padrão:', dbError);
        // Retornar contexto mínimo mesmo com erro de DB (para permitir debug)
        return {
          userId: 1, // ID temporário
          user: {
            id: 1,
            email: 'usuario@padrao.local',
            name: 'Usuário Padrão',
          },
        };
      }
    }

    return {
      userId,
      user: {
        id: userId,
        email: userEmail,
        name: userName,
      },
    };
  } catch (error) {
    console.error('[createContext] Erro geral:', error);
    // Retornar contexto mínimo em caso de erro
    return {
      userId: 1,
      user: {
        id: 1,
        email: 'usuario@padrao.local',
        name: 'Usuário Padrão',
      },
    };
  }
}
