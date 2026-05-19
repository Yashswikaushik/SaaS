'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { useState } from 'react';
import { ExternalLink, Mail, MessageCircle, Phone, Sparkles, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc/client';
import { formatDate, formatPhoneIN } from '@/lib/intl';
import { useToast } from '@/components/ui/toaster';

interface Props {
  leadId: string | null;
  onClose: () => void;
}

export function LeadDetailSheet({ leadId, onClose }: Props) {
  const { push } = useToast();
  const lead = trpc.leads.byId.useQuery({ id: leadId ?? '' }, { enabled: !!leadId });
  const summarize = trpc.ai.summarizeReviews.useMutation({
    onError: (e) => push({ title: 'Review summary failed', description: e.message, variant: 'destructive' }),
  });
  const writeEmail = trpc.ai.generateColdEmail.useMutation({
    onError: (e) => push({ title: 'Email generation failed', description: e.message, variant: 'destructive' }),
  });
  const [variants, setVariants] = useState<Array<{ language: string; subject: string; body: string }>>([]);

  const triggerEmail = () => {
    if (!lead.data) return;
    writeEmail.mutate(
      {
        leadId: lead.data.id,
        myOffer:
          'We help local businesses convert WhatsApp inbound into paying customers within 24h — typical lift 32%.',
        signature: 'Cheers,\nBharat Leads',
      },
      { onSuccess: (r) => setVariants(r.variants) },
    );
  };

  return (
    <Dialog.Root open={!!leadId} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" />
        <Dialog.Content className="fixed right-0 top-0 z-50 h-dvh w-full max-w-xl overflow-y-auto bg-card p-6 shadow-2xl outline-none">
          <div className="flex items-start justify-between">
            <div>
              <Dialog.Title className="font-display text-2xl font-bold">{lead.data?.businessName ?? '…'}</Dialog.Title>
              <Dialog.Description className="text-sm text-muted-foreground">
                {lead.data?.addressFormatted}
              </Dialog.Description>
            </div>
            <Dialog.Close className="rounded-md p-2 hover:bg-secondary">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>

          {lead.data && (
            <div className="mt-6 space-y-6">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{lead.data.status.replace('_', ' ')}</Badge>
                {lead.data.category && <Badge variant="outline">{lead.data.category}</Badge>}
                {lead.data.city && <Badge variant="outline">{lead.data.city}</Badge>}
              </div>

              <section className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Contact</h3>
                <ul className="space-y-1 text-sm">
                  {(lead.data.contact as { mobile?: string }).mobile && (
                    <li className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      {formatPhoneIN((lead.data.contact as { mobile?: string }).mobile!)}
                    </li>
                  )}
                  {(lead.data.contact as { email?: string }).email && (
                    <li className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      {(lead.data.contact as { email?: string }).email}
                    </li>
                  )}
                  {(lead.data.contact as { website?: string }).website && (
                    <li className="flex items-center gap-2">
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={(lead.data.contact as { website?: string }).website}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="underline"
                      >
                        {(lead.data.contact as { website?: string }).website}
                      </a>
                    </li>
                  )}
                </ul>
              </section>

              <section className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">AI review summary</h3>
                  <Button size="sm" variant="outline" onClick={() => summarize.mutate({ leadId: lead.data!.id })} loading={summarize.isPending}>
                    Refresh
                  </Button>
                </div>
                {lead.data.aiReviewSummary ? (
                  <p className="rounded-lg border bg-secondary/30 p-3 text-sm">{lead.data.aiReviewSummary}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No summary yet. Generate one to surface 5 pain themes from public reviews.
                  </p>
                )}
              </section>

              <section className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Cold email drafts</h3>
                  <Button size="sm" onClick={triggerEmail} loading={writeEmail.isPending}>
                    <Sparkles className="mr-1 h-3 w-3" /> Generate
                  </Button>
                </div>
                <div className="space-y-3">
                  {variants.map((v, i) => (
                    <div key={i} className="rounded-lg border bg-card p-3">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">{v.language}</p>
                      <p className="mt-1 font-semibold">{v.subject}</p>
                      <pre className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{v.body}</pre>
                    </div>
                  ))}
                </div>
              </section>

              <section className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Provenance</h3>
                <p className="text-xs text-muted-foreground">
                  Source: <a href={lead.data.sourceUrl} target="_blank" rel="noreferrer noopener" className="underline">{lead.data.sourceMethod}</a>
                </p>
                <p className="text-xs text-muted-foreground">Verified: {formatDate(lead.data.sourceVerifiedAt)}</p>
              </section>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
