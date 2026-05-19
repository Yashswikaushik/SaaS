import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '@/server/routers/_app';
import { createContext } from '@/server/trpc';
import { log } from '@/lib/logger';

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => createContext(req),
    onError({ error, path }) {
      if (error.code === 'INTERNAL_SERVER_ERROR') {
        log.error('tRPC server error', { path, message: error.message });
      }
    },
  });

export { handler as GET, handler as POST };
