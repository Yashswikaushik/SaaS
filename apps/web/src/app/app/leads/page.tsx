'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc/client';
import { formatDate } from '@/lib/intl';
import { LeadDetailSheet } from '@/components/leads/LeadDetailSheet';
import { useState } from 'react';

const STATUSES = ['new', 'contacted', 'qualified', 'meeting_set', 'won', 'lost', 'on_hold'] as const;

export default function LeadsPage() {
  const { data, isLoading } = trpc.leads.list.useQuery({ limit: 200 });
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="container space-y-6 py-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Leads</h1>
          <p className="text-sm text-muted-foreground">All active leads in your pipeline.</p>
        </div>
        <Button asChild>
          <Link href="/app/map">Find more leads</Link>
        </Button>
      </header>

      <div className="grid gap-3 lg:grid-cols-7">
        {STATUSES.map((status) => {
          const rows = data?.items.filter((l) => l.status === status) ?? [];
          return (
            <div key={status} className="rounded-xl border bg-card p-3">
              <header className="mb-3 flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{status.replace('_', ' ')}</h3>
                <Badge variant="secondary">{rows.length}</Badge>
              </header>
              <ul className="space-y-2">
                {isLoading && (
                  <li className="h-16 animate-pulse rounded-md bg-secondary/40" />
                )}
                {rows.map((l) => (
                  <li key={l.id}>
                    <button
                      type="button"
                      className="w-full rounded-md border bg-background p-2 text-left transition hover:border-primary/40"
                      onClick={() => setSelected(l.id)}
                    >
                      <p className="text-sm font-medium leading-tight">{l.businessName}</p>
                      <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{l.city ?? l.addressFormatted ?? '—'}</p>
                      <p className="mt-1 text-[10px] text-muted-foreground">{formatDate(l.createdAt)}</p>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
      <LeadDetailSheet leadId={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
