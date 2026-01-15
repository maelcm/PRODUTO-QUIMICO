import { httpBatchLink } from '@trpc/client';
import { trpc } from './trpc';

const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return import.meta.env.VITE_API_URL || '';
  }
  return process.env.VITE_API_URL || 'http://localhost:3001';
};

// Função para inicializar usuário padrão no localStorage (se não existir)
function initializeDefaultUser() {
  if (typeof window === 'undefined') return;
  
  if (!localStorage.getItem('userId')) {
    // Usuário padrão será criado no backend se não existir
    // Aqui apenas armazenamos placeholders que serão usados
    localStorage.setItem('userId', '1'); // Será substituído pelo ID real do backend
    localStorage.setItem('userEmail', 'usuario@padrao.local');
    localStorage.setItem('userName', 'Usuário Padrão');
  }
}

// Inicializar usuário padrão quando o módulo carregar
if (typeof window !== 'undefined') {
  initializeDefaultUser();
}

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: `${getBaseUrl()}/trpc`,
      headers: () => {
        // Se não houver headers, o backend criará/usará usuário padrão
        const userId = localStorage.getItem('userId');
        const userEmail = localStorage.getItem('userEmail');
        const userName = localStorage.getItem('userName');

        // Sempre retornar headers (mesmo que vazios, o backend tratará)
        return {
          'x-user-id': userId || '',
          'x-user-email': userEmail || '',
          'x-user-name': userName || '',
        };
      },
    }),
  ],
});
