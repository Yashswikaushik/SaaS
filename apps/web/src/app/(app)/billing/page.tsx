'use client';

import Link from 'next/link';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatPaise } from '@/lib/intl';
import { useToast } from '@/components/ui/toaster';

export default function BillingPage() {
  const { push } = useToast();
  const plans = trpc.billing.plans.useQuery();
  const current = trpc.billing.currentSubscription.useQuery();
  const invoices = trpc.billing.invoices.useQuery();
  const start = trpc.billing.startSubscription.useMutation({
    onSuccess: (r) => {
      if (r.shortUrl) window.location.href = r.shortUrl;
      else push({ title: 'Subscription created', description: r.subscriptionId });
    },
    onError: (e) => push({ title: 'Could not start checkout', description: e.message, variant: 'destructive' }),
  });

  return (
    <div className="container space-y-8 py-8">
      <header>
        <h1 className="font-display text-3xl font-bold tracking-tight">Billing</h1>
        <p className="text-sm text-muted-foreground">UPI Autopay, GST invoices, INR pricing.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Current subscription</CardTitle>
        </CardHeader>
        <CardContent>
          {current.data ? (
            <div className="flex flex-wrap items-center gap-4">
              <Badge>{current.data.plan}</Badge>
              <Badge variant="secondary">{current.data.cycle}</Badge>
              <Badge variant="outline">{current.data.status}</Badge>
              <p className="text-sm text-muted-foreground">
                {formatPaise(current.data.amountPaise)} /{' '}
                {current.data.cycle === 'monthly' ? 'mo' : 'yr'}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No active subscription. Choose a plan below.</p>
          )}
        </CardContent>
      </Card>

      <section>
        <h2 className="mb-4 font-display text-xl font-semibold">Plans</h2>
        <div className="grid gap-4 lg:grid-cols-4">
          {plans.data
            ?.filter((p) => p.tier !== 'free')
            .map((p) => (
              <Card key={p.tier}>
                <CardHeader>
                  <CardTitle className="capitalize">{p.tier}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p className="font-display text-2xl font-bold">{formatPaise(p.monthlyPaise)}/mo</p>
                  <p className="text-xs text-muted-foreground">or {formatPaise(p.annualPaise)} / year</p>
                  <ul className="space-y-1 text-xs">
                    <li>{p.leadCap.toLocaleString('en-IN')} leads</li>
                    <li>{p.seatCap} seat{p.seatCap > 1 ? 's' : ''}</li>
                    <li>{p.waMessagesPerMonth.toLocaleString('en-IN')} WA msgs/mo</li>
                    {p.routesEnabled && <li>Smart Routes</li>}
                    {p.aiAssistantEnabled && <li>AI Assistant</li>}
                    {p.whiteLabelEnabled && <li>White-label</li>}
                  </ul>
                  <div className="space-y-2 pt-2">
                    <Button
                      className="w-full"
                      onClick={() => start.mutate({ tier: p.tier as never, cycle: 'monthly' })}
                      loading={start.isPending}
                    >
                      Start monthly
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => start.mutate({ tier: p.tier as never, cycle: 'yearly' })}
                    >
                      Start annual
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-display text-xl font-semibold">Invoices</h2>
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="border-b text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="p-3 text-left">Number</th>
                  <th className="p-3 text-left">Date</th>
                  <th className="p-3 text-right">Amount</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3" />
                </tr>
              </thead>
              <tbody>
                {invoices.data?.length === 0 && (
                  <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">No invoices yet.</td></tr>
                )}
                {invoices.data?.map((inv) => (
                  <tr key={inv.id} className="border-b">
                    <td className="p-3 font-mono">{inv.invoiceNo}</td>
                    <td className="p-3">{formatDate(inv.issuedAt)}</td>
                    <td className="p-3 text-right">{formatPaise(inv.totalPaise)}</td>
                    <td className="p-3"><Badge variant="secondary">{inv.status}</Badge></td>
                    <td className="p-3 text-right">
                      {inv.pdfUrl && (
                        <Link href={inv.pdfUrl} className="text-primary underline">PDF</Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
