'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { ArrowRight, Mail, MessageCircle, Phone } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/toaster';

type Channel = 'email' | 'sms' | 'whatsapp';

export default function LoginPage() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get('next') ?? '/app';
  const { push } = useToast();
  const [channel, setChannel] = useState<Channel>('email');
  const [identity, setIdentity] = useState('');
  const requestOtp = trpc.auth.requestOtp.useMutation({
    onSuccess: () => {
      router.push(`/verify?identity=${encodeURIComponent(identity)}&channel=${channel}&next=${encodeURIComponent(next)}`);
    },
    onError: (err) => push({ title: 'Could not send OTP', description: err.message, variant: 'destructive' }),
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    requestOtp.mutate({ identity, channel, purpose: 'login' });
  };

  return (
    <div className="grid min-h-dvh place-items-center bg-secondary/30 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-lg">
        <Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          ← Back home
        </Link>
        <h1 className="font-display text-3xl font-bold tracking-tight">Sign in</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          We'll send you a one-time code. No password to remember.
        </p>
        <div className="mt-6 grid grid-cols-3 gap-2 rounded-lg bg-secondary p-1 text-xs font-medium">
          <ChannelTab active={channel === 'email'} onClick={() => setChannel('email')} label="Email" icon={Mail} />
          <ChannelTab active={channel === 'sms'} onClick={() => setChannel('sms')} label="SMS" icon={Phone} />
          <ChannelTab active={channel === 'whatsapp'} onClick={() => setChannel('whatsapp')} label="WhatsApp" icon={MessageCircle} />
        </div>
        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <div className="space-y-1.5">
            <Label htmlFor="identity">{channel === 'email' ? 'Email' : 'Mobile (10 digits or +91…)'}</Label>
            <Input
              id="identity"
              type={channel === 'email' ? 'email' : 'tel'}
              placeholder={channel === 'email' ? 'you@company.in' : '+91 99999 99999'}
              required
              autoFocus
              autoComplete="username"
              value={identity}
              onChange={(e) => setIdentity(e.target.value)}
            />
          </div>
          <Button type="submit" size="lg" className="w-full" loading={requestOtp.isPending}>
            Send code <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </form>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          By continuing, you agree to our{' '}
          <Link href="/legal/terms" className="underline">Terms</Link> and{' '}
          <Link href="/legal/privacy" className="underline">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}

function ChannelTab({
  active,
  onClick,
  label,
  icon: Icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-center gap-1.5 rounded-md px-3 py-2 transition ${
        active ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      <Icon className="h-3.5 w-3.5" /> {label}
    </button>
  );
}
