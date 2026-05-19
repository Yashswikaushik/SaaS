'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { useState } from 'react';
import superjson from 'superjson';
import { trpc } from '@/lib/trpc/client';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1_000,
            retry: (failureCount, err) => {
              const code = (err as { data?: { code?: string } })?.data?.code;
              if (code === 'UNAUTHORIZED' || code === 'FORBIDDEN' || code === 'BAD_REQUEST') return false;
              return failureCount < 2;
            },
          },
          mutations: { retry: 0 },
        },
      }),
  );
  const [trpcClient] = useState(() =>
    trpc.createClient({
      transformer: superjson,
      links: [
        httpBatchLink({
          url: '/api/trpc',
          headers() {
            return {
              'x-org-slug': typeof document !== 'undefined'
                ? document.cookie.split('; ').find((c) => c.startsWith('org_slug='))?.split('=')[1] ?? ''
                : '',
            };
          },
        }),
      ],
    }),
  );
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
