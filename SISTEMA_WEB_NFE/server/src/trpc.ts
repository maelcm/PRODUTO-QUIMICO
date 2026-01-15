import { initTRPC, TRPCError } from '@trpc/server';
import { Context } from './context';

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

// Procedure protegida (requer autenticação)
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Você precisa estar autenticado para acessar esta funcionalidade',
    });
  }

  return next({
    ctx: {
      ...ctx,
      userId: ctx.userId, // TypeScript agora sabe que userId existe
    },
  });
});
