import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Check, Minus, X } from 'lucide-react';
import { MarketingFooter } from '@/components/marketing/footer';
import { MarketingNavbar } from '@/components/marketing/navbar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const COMPARISONS = {
  leadsquared: {
    competitor: 'LeadSquared',
    competitorPrice: '₹2,500–4,500/user/mo',
    summary:
      'LeadSquared is excellent for inbound enterprise. For local-outbound SMB use, it bills per user and has no map-first lead finder.',
    rows: [
      ['INR pricing', true, true],
      ['Map-first lead finder', true, false],
      ['WhatsApp Business (BSP)', true, 'addon'],
      ['AI cold email writer', true, false],
      ['DPDP source verification', true, 'partial'],
      ['Per-seat pricing', false, true],
      ['Unlimited users on flat tier', true, false],
      ['GST invoices', true, true],
    ],
  },
  kylas: {
    competitor: 'Kylas',
    competitorPrice: '₹12,999/mo flat (Elevate)',
    summary:
      'Kylas pioneered flat-rate unlimited-users CRM. It\'s a great pure CRM but has no scraping/finder, no AI cold-email, no review pain mining.',
    rows: [
      ['INR pricing', true, true],
      ['Map-first lead finder', true, false],
      ['Verified lead database', true, false],
      ['AI review pain mining', true, false],
      ['AI cold email writer', true, false],
      ['Flat-rate unlimited users', 'agency-tier', true],
      ['Smart Routes', true, false],
      ['GST invoices', true, true],
    ],
  },
  freshsales: {
    competitor: 'Freshsales (Freshworks)',
    competitorPrice: '₹749–4,899/user/mo',
    summary:
      'Freshsales is solid sales-CRM-with-AI. India support is good. But you still pay per seat and there\'s no lead-finder or local-business map.',
    rows: [
      ['INR pricing', true, true],
      ['Map-first lead finder', true, false],
      ['AI cold email writer', true, true],
      ['WhatsApp Business (native)', true, 'addon'],
      ['Smart Routes (OSRM)', true, false],
      ['Cheapest tier under ₹1,000', true, false],
      ['DPDP-by-design audit', true, 'partial'],
      ['GST invoices', true, true],
    ],
  },
  apollo: {
    competitor: 'Apollo.io',
    competitorPrice: '$49–149/user/mo (USD)',
    summary:
      'Apollo is the US standard. Database is great globally but India coverage on phones is weak and you pay in USD with no GST invoices.',
    rows: [
      ['INR billing', true, false],
      ['GST invoices', true, false],
      ['India phone coverage', true, 'weak'],
      ['Local-business polygon search', true, false],
      ['WhatsApp Business (BSP)', true, false],
      ['Hindi/Indic AI generation', true, false],
      ['DPDP-by-design', true, false],
      ['Cold email writer', true, true],
    ],
  },
  lusha: {
    competitor: 'Lusha',
    competitorPrice: '$22+/user/mo (USD)',
    summary:
      'Lusha is contact-data only. Practitioners report 60–70% valid-rate in India. No CRM, no map, no AI cold email, no WhatsApp.',
    rows: [
      ['India contact validity ≥85%', true, false],
      ['INR billing', true, false],
      ['Built-in CRM', true, false],
      ['Map polygon search', true, false],
      ['AI cold email writer', true, false],
      ['WhatsApp send', true, false],
      ['GST invoices', true, false],
      ['Hindi AI', true, false],
    ],
  },
} as const;

type Slug = keyof typeof COMPARISONS;

export function generateStaticParams() {
  return Object.keys(COMPARISONS).map((competitor) => ({ competitor }));
}

export function generateMetadata({ params }: { params: { competitor: string } }) {
  const slug = params.competitor as Slug;
  const c = COMPARISONS[slug];
  if (!c) return {};
  return {
    title: `Bharat Leads vs ${c.competitor} — Honest comparison`,
    description: c.summary,
  };
}

export default function VsPage({ params }: { params: { competitor: string } }) {
  const slug = params.competitor as Slug;
  const c = COMPARISONS[slug];
  if (!c) notFound();

  return (
    <div className="flex min-h-dvh flex-col">
      <MarketingNavbar />
      <main className="flex-1">
        <section className="py-20">
          <div className="container max-w-4xl">
            <Badge variant="outline" className="rounded-full">Comparison</Badge>
            <h1 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">
              Bharat Leads vs {c.competitor}
            </h1>
            <p className="mt-3 text-lg text-muted-foreground">{c.summary}</p>
            <div className="mt-8 overflow-hidden rounded-2xl border">
              <table className="w-full text-sm">
                <thead className="bg-secondary/40">
                  <tr>
                    <th className="p-4 text-left font-semibold">Feature</th>
                    <th className="p-4 text-left font-semibold">Bharat Leads</th>
                    <th className="p-4 text-left font-semibold">{c.competitor}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t">
                    <td className="p-4 font-medium">Starting price</td>
                    <td className="p-4 text-primary">₹999/mo (with GST)</td>
                    <td className="p-4 text-muted-foreground">{c.competitorPrice}</td>
                  </tr>
                  {c.rows.map(([label, mine, theirs]) => (
                    <tr key={String(label)} className="border-t">
                      <td className="p-4">{label}</td>
                      <td className="p-4"><Cell v={mine} /></td>
                      <td className="p-4"><Cell v={theirs} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-10 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/signup">Try Bharat Leads free</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/pricing">See pricing</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}

function Cell({ v }: { v: boolean | string }) {
  if (v === true) return <Check className="h-4 w-4 text-primary" />;
  if (v === false) return <X className="h-4 w-4 text-muted-foreground" />;
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <Minus className="h-3 w-3" /> {String(v)}
    </span>
  );
}
