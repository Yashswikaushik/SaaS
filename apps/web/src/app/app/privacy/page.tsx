'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { CONSENT_DESCRIPTORS } from '@bharat/dpdp/scopes';
import { useToast } from '@/components/ui/toaster';
import { formatDate } from '@/lib/intl';

export default function PrivacyPage() {
  const { push } = useToast();
  const consents = trpc.dpdp.consents.useQuery();
  const setConsent = trpc.dpdp.setConsent.useMutation({
    onSuccess: () => consents.refetch(),
    onError: (e) => push({ title: 'Could not save', description: e.message, variant: 'destructive' }),
  });
  const requestExport = trpc.dpdp.requestExport.useMutation({
    onSuccess: () => push({ title: 'Export queued', description: 'You\'ll receive an email within 24 hours.' }),
  });
  const requestErase = trpc.dpdp.requestErase.useMutation({
    onSuccess: () => push({ title: 'Account scheduled for erasure', description: 'Hard purge in 30 days.', variant: 'destructive' }),
    onError: (e) => push({ title: 'Could not start erasure', description: e.message, variant: 'destructive' }),
  });
  const recent = trpc.dpdp.recentRequests.useQuery();

  return (
    <div className="container space-y-8 py-8 max-w-3xl">
      <header>
        <h1 className="font-display text-3xl font-bold tracking-tight">Privacy & data</h1>
        <p className="text-sm text-muted-foreground">
          DPDP Act 2023. Your rights, your toggles. Every change is audit-logged.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Consent</CardTitle>
          <CardDescription>Notice version {consents.data?.noticeVersion ?? '…'}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {CONSENT_DESCRIPTORS.map((d) => {
            const state = consents.data?.scopes?.[d.scope];
            const granted = state?.granted ?? d.required;
            return (
              <div key={d.scope} className="flex items-start justify-between gap-4 rounded-lg border p-4">
                <div>
                  <p className="font-semibold">
                    {d.label}{' '}
                    {d.required && <span className="text-xs text-muted-foreground">(required)</span>}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{d.description}</p>
                  {state?.grantedAt && (
                    <p className="mt-1 text-xs text-muted-foreground">Last updated {formatDate(state.grantedAt)}</p>
                  )}
                </div>
                <Button
                  variant={granted ? 'outline' : 'default'}
                  disabled={d.required}
                  onClick={() => setConsent.mutate({ scope: d.scope, granted: !granted })}
                >
                  {granted ? 'Revoke' : 'Grant'}
                </Button>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your data rights</CardTitle>
          <CardDescription>All requests are auto-fulfilled within 7 working days.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <Button variant="outline" onClick={() => requestExport.mutate()} loading={requestExport.isPending}>
            Export my data
          </Button>
          <Button variant="outline" asChild>
            <a href="/api/dpdp/export">Download JSON</a>
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              if (window.confirm('Erase your account? Soft-delete now, hard purge in 30 days.')) {
                requestErase.mutate({ confirm: 'ERASE' });
              }
            }}
            loading={requestErase.isPending}
          >
            Erase my account
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent requests</CardTitle>
        </CardHeader>
        <CardContent>
          {recent.data?.length === 0 && <p className="text-sm text-muted-foreground">No previous requests.</p>}
          <ul className="space-y-2 text-sm">
            {recent.data?.map((r) => (
              <li key={r.id} className="flex items-center justify-between rounded-md border p-3">
                <span>{r.kind}</span>
                <span className="text-xs text-muted-foreground">{formatDate(r.createdAt)}</span>
                <span className="text-xs">{r.status}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
