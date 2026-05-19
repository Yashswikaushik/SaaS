'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { trpc } from '@/lib/trpc/client';
import { useToast } from '@/components/ui/toaster';

export default function SignupPage() {
  const router = useRouter();
  const search = useSearchParams();
  const plan = search.get('plan');
  const { push } = useToast();
  const [email, setEmail] = useState('');
  const requestOtp = trpc.auth.requestOtp.useMutation({
    onSuccess: () => {
      const params = new URLSearchParams({ identity: email, channel: 'email', next: plan ? `/app/billing?plan=${plan}` : '/app' });
      router.push(`/verify?${params.toString()}`);
    },
    onError: (e) => push({ title: 'Try again', description: e.message, variant: 'destructive' }),
  });

  return (
    <div className="grid min-h-dvh place-items-center bg-secondary/30 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-lg">
        <Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          ← Back home
        </Link>
        <h1 className="font-display text-3xl font-bold tracking-tight">Start free</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          15 verified leads, no credit card. Upgrade only when you're ready.
        </p>
        <form
          className="mt-6 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            requestOtp.mutate({ identity: email, channel: 'email', purpose: 'signup' });
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="email">Work email</Label>
            <Input
              id="email"
              type="email"
              autoFocus
              required
              autoComplete="email"
              placeholder="you@company.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <Button type="submit" size="lg" className="w-full" loading={requestOtp.isPending}>
            Get my code <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </form>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          By creating an account you agree to our{' '}
          <Link href="/legal/terms" className="underline">Terms</Link> and{' '}
          <Link href="/legal/privacy" className="underline">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}
