'use client';

import Link from 'next/link';
import { ArrowUpRight, BarChart3, Map, MessageCircle, Route, ScanSearch, Sparkles, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { trpc } from '@/lib/trpc/client';
import { formatPaise } from '@/lib/intl';

export default function DashboardPage() {
  const me = trpc.auth.me.useQuery();
  const leads = trpc.leads.list.useQuery({ limit: 5 });

  return (
    <div className="container space-y-8 py-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Hello{me.data?.fullName ? `, ${me.data.fullName}` : ''} 👋</p>
          <h1 className="font-display text-3xl font-bold tracking-tight">Pipeline today</h1>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/app/map">
              <ScanSearch className="mr-2 h-4 w-4" />
              Find leads
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/app/billing">
              <Sparkles className="mr-2 h-4 w-4" />
              Upgrade
            </Link>
          </Button>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Metric label="Active leads" value="—" hint="across all pipelines" icon={BarChart3} />
        <Metric label="Messages today" value="—" hint="email + WhatsApp" icon={MessageCircle} />
        <Metric label="WhatsApp budget" value={formatPaise(0)} hint="this month" icon={MessageCircle} />
        <Metric label="Routes optimised" value="0" hint="this week" icon={Route} />
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent leads</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/app/leads">View all <ArrowUpRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </CardHeader>
          <CardContent>
            {leads.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
            {leads.data && leads.data.items.length === 0 && (
              <EmptyState />
            )}
            <ul className="space-y-3">
              {leads.data?.items.map((l) => (
                <li key={l.id} className="flex items-center justify-between rounded-lg border bg-card p-3 transition hover:border-primary/40">
                  <div>
                    <p className="font-medium">{l.businessName}</p>
                    <p className="text-xs text-muted-foreground">{l.addressFormatted ?? l.city ?? '—'}</p>
                  </div>
                  <Badge variant="secondary">{l.status}</Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Quick actions</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Action href="/app/map" icon={Map} title="Draw polygon · find leads" />
            <Action href="/app/leads" icon={BarChart3} title="Move leads through pipeline" />
            <Action href="/app/routes" icon={Route} title="Plan today's visits" />
            <Action href="/app/whatsapp" icon={MessageCircle} title="Send WA broadcast" />
            <Action href="/app/privacy" icon={Star} title="Review consent settings" />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function Metric({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <p className="mt-2 font-display text-2xl font-bold">{value}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}

function Action({
  href,
  icon: Icon,
  title,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
}) {
  return (
    <Link href={href} className="flex items-center gap-3 rounded-lg p-2 transition hover:bg-secondary">
      <Icon className="h-4 w-4 text-muted-foreground" /> {title}
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed py-10 text-center">
      <ScanSearch className="h-8 w-8 text-muted-foreground" />
      <h3 className="mt-3 font-semibold">No leads yet</h3>
      <p className="mt-1 text-sm text-muted-foreground">Draw a polygon over your area and we'll find verified businesses.</p>
      <Button asChild className="mt-4">
        <Link href="/app/map">Open the Finder</Link>
      </Button>
    </div>
  );
}
