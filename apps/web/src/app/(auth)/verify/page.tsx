'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useRef, useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toaster';

export default function VerifyPage() {
  const search = useSearchParams();
  const router = useRouter();
  const { push } = useToast();

  const identity = search.get('identity') ?? '';
  const channel = (search.get('channel') ?? 'email') as 'email' | 'sms' | 'whatsapp';
  const next = search.get('next') ?? '/app';

  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const refs = Array.from({ length: 6 }, () => useRef<HTMLInputElement>(null));
  const verify = trpc.auth.verifyOtp.useMutation({
    onSuccess: () => router.push(next),
    onError: (err) => push({ title: 'Wrong code', description: err.message, variant: 'destructive' }),
  });

  const onChange = (i: number, v: string) => {
    const c = v.replace(/\D/g, '').slice(0, 1);
    setDigits((prev) => {
      const arr = [...prev];
      arr[i] = c;
      return arr;
    });
    if (c && i < 5) refs[i + 1]?.current?.focus();
  };

  const onKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) refs[i - 1]?.current?.focus();
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    verify.mutate({ identity, channel, code: digits.join(''), purpose: 'login' });
  };

  return (
    <div className="grid min-h-dvh place-items-center bg-secondary/30 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 text-center shadow-lg">
        <h1 className="font-display text-3xl font-bold tracking-tight">Enter the code</h1>
        <p className="mt-1 text-sm text-muted-foreground">We sent a 6-digit code to <strong>{identity}</strong>.</p>
        <form className="mt-8 space-y-6" onSubmit={onSubmit}>
          <div className="flex justify-center gap-2">
            {digits.map((d, i) => (
              <input
                key={i}
                ref={refs[i]}
                value={d}
                onChange={(e) => onChange(i, e.target.value)}
                onKeyDown={(e) => onKey(i, e)}
                inputMode="numeric"
                autoComplete="one-time-code"
                aria-label={`Digit ${i + 1}`}
                className="h-14 w-12 rounded-lg border bg-background text-center font-display text-2xl font-bold tracking-widest outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
                maxLength={1}
              />
            ))}
          </div>
          <Button type="submit" size="lg" className="w-full" loading={verify.isPending}>
            Verify and sign in
          </Button>
        </form>
      </div>
    </div>
  );
}
