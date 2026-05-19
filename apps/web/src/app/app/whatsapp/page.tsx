'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/lib/trpc/client';
import { formatDate } from '@/lib/intl';

export default function WhatsAppPage() {
  const templates = trpc.whatsapp.listTemplates.useQuery();

  return (
    <div className="container max-w-3xl space-y-8 py-8">
      <header>
        <h1 className="font-display text-3xl font-bold tracking-tight">WhatsApp</h1>
        <p className="text-sm text-muted-foreground">
          Approved templates ready to send. Inbound replies handled automatically — opt-outs flip your consent record.
        </p>
      </header>

      <Card>
        <CardHeader><CardTitle>Templates</CardTitle></CardHeader>
        <CardContent>
          {templates.data?.length === 0 && (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              No templates yet. Set up your AiSensy account, submit a template for approval, and we'll list it here once Meta approves it.
            </div>
          )}
          <ul className="space-y-3">
            {templates.data?.map((t) => (
              <li key={t.id} className="rounded-lg border bg-card p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold">{t.name}</p>
                  <Badge variant={t.status === 'APPROVED' ? 'success' : 'secondary'}>{t.status}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{t.category} · {t.language}</p>
                <pre className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{t.body}</pre>
                {t.approvedAt && <p className="mt-1 text-xs text-muted-foreground">Approved {formatDate(t.approvedAt)}</p>}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
