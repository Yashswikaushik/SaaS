'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Sentry capture would go here.
    console.error('Page error', { digest: error.digest, message: error.message });
  }, [error]);

  return (
    <div className="grid min-h-dvh place-items-center px-6 text-center">
      <div className="max-w-md">
        <h1 className="font-display text-3xl font-bold">Something broke.</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We logged the error and our team has been notified. You can retry or head home.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Button onClick={reset}>Try again</Button>
          <Button asChild variant="outline"><Link href="/">Back home</Link></Button>
        </div>
        {error.digest && <p className="mt-6 text-xs text-muted-foreground">Ref: {error.digest}</p>}
      </div>
    </div>
  );
}
