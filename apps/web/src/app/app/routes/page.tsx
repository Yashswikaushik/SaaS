'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/lib/trpc/client';
import { useToast } from '@/components/ui/toaster';

export default function RoutesPage() {
  const { push } = useToast();
  const leads = trpc.leads.list.useQuery({ limit: 50, status: 'qualified' });
  const optimize = trpc.routes.optimize.useMutation({
    onError: (e) => push({ title: 'Optimize failed', description: e.message, variant: 'destructive' }),
  });
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (id: string) =>
    setSelected((curr) => {
      const next = new Set(curr);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  return (
    <div className="container space-y-8 py-8">
      <header>
        <h1 className="font-display text-3xl font-bold tracking-tight">Smart Routes</h1>
        <p className="text-sm text-muted-foreground">Pick 2–25 qualified leads and we'll compute the shortest tour.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Qualified leads</CardTitle>
          <CardDescription>{selected.size} selected</CardDescription>
        </CardHeader>
        <CardContent>
          {leads.data?.items.length === 0 && (
            <p className="text-sm text-muted-foreground">No qualified leads yet.</p>
          )}
          <ul className="space-y-2">
            {leads.data?.items.map((l) => (
              <li key={l.id} className="flex items-center justify-between rounded-md border p-3">
                <label className="flex flex-1 cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selected.has(l.id)}
                    onChange={() => toggle(l.id)}
                    className="h-4 w-4 rounded"
                  />
                  <div>
                    <p className="text-sm font-medium">{l.businessName}</p>
                    <p className="text-xs text-muted-foreground">{l.addressFormatted ?? '—'}</p>
                  </div>
                </label>
                <Badge variant="outline">{l.city}</Badge>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {optimize.data && (
        <Card>
          <CardHeader>
            <CardTitle>Optimised tour</CardTitle>
            <CardDescription>
              {Math.round((optimize.data.distanceMeters ?? 0) / 100) / 10} km ·{' '}
              {Math.round((optimize.data.durationSeconds ?? 0) / 60)} min
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <ol className="space-y-2 text-sm">
              {optimize.data.ordered.map((p, i) => (
                <li key={i} className="rounded-md border p-3">
                  <p className="font-medium">{(p as { name?: string }).name ?? p.type}</p>
                </li>
              ))}
            </ol>
            <Button asChild>
              <Link href={optimize.data.googleMapsUrl} target="_blank" rel="noreferrer noopener">
                Open in Google Maps
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button
          disabled={selected.size < 2}
          loading={optimize.isPending}
          onClick={() =>
            optimize.mutate({
              leadIds: Array.from(selected),
              start: [77.5946, 12.9716], // could be replaced with rep's geolocation
              roundtrip: true,
            })
          }
        >
          Optimize {selected.size > 0 ? `· ${selected.size} leads` : ''}
        </Button>
      </div>
    </div>
  );
}
