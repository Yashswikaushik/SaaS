'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const CONSENT_COOKIE = 'bl_consent';

interface ConsentState {
  marketing: boolean;
  analytics: boolean;
  ai_processing: boolean;
  v: string;
}

const CURRENT_VERSION = '2025-11-13';

function read(): ConsentState | null {
  if (typeof document === 'undefined') return null;
  const c = document.cookie.split('; ').find((x) => x.startsWith(`${CONSENT_COOKIE}=`));
  if (!c) return null;
  try {
    return JSON.parse(decodeURIComponent(c.split('=')[1] ?? '{}')) as ConsentState;
  } catch {
    return null;
  }
}

function write(state: ConsentState): void {
  const expiry = 365 * 24 * 60 * 60;
  document.cookie = `${CONSENT_COOKIE}=${encodeURIComponent(JSON.stringify(state))}; Max-Age=${expiry}; Path=/; SameSite=Lax; Secure`;
}

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const c = read();
    if (!c || c.v !== CURRENT_VERSION) setVisible(true);
  }, []);

  if (!visible) return null;

  const acceptAll = () => {
    write({ marketing: true, analytics: true, ai_processing: true, v: CURRENT_VERSION });
    setVisible(false);
  };
  const essentialOnly = () => {
    write({ marketing: false, analytics: false, ai_processing: false, v: CURRENT_VERSION });
    setVisible(false);
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t bg-card/95 backdrop-blur-md">
      <div className="container flex flex-col gap-3 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-2xl">
          We use essential cookies to run the service. With your consent we also use cookies for product analytics
          (PostHog) and to remember your preferences. You can change this any time in{' '}
          <Link href="/legal/privacy" className="underline">privacy settings</Link>.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={essentialOnly}>
            Essential only
          </Button>
          <Button size="sm" onClick={acceptAll}>
            Accept all
          </Button>
        </div>
      </div>
    </div>
  );
}
