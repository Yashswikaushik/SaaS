import Link from 'next/link';
import { Check, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MarketingFooter } from '@/components/marketing/footer';
import { MarketingNavbar } from '@/components/marketing/navbar';
import { PLAN_PRICING } from '@bharat/razorpay';
import { formatPaise } from '@/lib/intl';

export const metadata = {
  title: 'Pricing — Bharat Leads',
  description: 'Simple INR pricing for Indian B2B sales teams. ₹999 to ₹12,999/mo. Free forever tier — 15 leads, no credit card.',
};

const TIERS = [
  { id: 'free', name: 'Free', tagline: 'Try it before you buy', highlight: false },
  { id: 'starter', name: 'Starter', tagline: 'Solo agencies & freelancers', highlight: false },
  { id: 'growth', name: 'Growth', tagline: 'Small sales teams', highlight: true },
  { id: 'scale', name: 'Scale', tagline: 'Established teams', highlight: false },
  { id: 'agency', name: 'Agency', tagline: 'White-label & unlimited AI', highlight: false },
] as const;

export default function PricingPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <MarketingNavbar />
      <main className="flex-1">
        <section className="py-20">
          <div className="container">
            <div className="mx-auto max-w-3xl text-center">
              <Badge variant="outline" className="rounded-full">Pricing</Badge>
              <h1 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">
                Built for Indian buyers. Priced for Indian budgets.
              </h1>
              <p className="mt-4 text-lg text-muted-foreground">
                GST 18% extra. UPI Autopay, monthly or annual. Annual saves 17%. Cancel via WhatsApp.
              </p>
            </div>

            <div className="mt-16 grid gap-6 lg:grid-cols-5">
              {TIERS.map((t) => {
                const p = PLAN_PRICING[t.id];
                return (
                  <div
                    key={t.id}
                    className={`relative flex flex-col rounded-2xl border bg-card p-6 ${
                      t.highlight ? 'border-primary shadow-lg ring-2 ring-primary/20' : ''
                    }`}
                  >
                    {t.highlight && (
                      <Badge variant="default" className="absolute -top-3 left-6 rounded-full">
                        Most popular
                      </Badge>
                    )}
                    <div>
                      <h3 className="font-display text-2xl font-bold">{t.name}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{t.tagline}</p>
                    </div>
                    <div className="mt-6">
                      <p className="flex items-baseline gap-1">
                        <span className="font-display text-4xl font-bold">{formatPaise(p.monthlyPaise)}</span>
                        <span className="text-sm text-muted-foreground">/mo</span>
                      </p>
                      {p.annualPaise > 0 && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          or {formatPaise(p.annualPaise)} / year (save 17%)
                        </p>
                      )}
                    </div>
                    <Button asChild className="mt-6 w-full" variant={t.highlight ? 'default' : 'outline'}>
                      <Link href={t.id === 'free' ? '/signup' : `/signup?plan=${t.id}`}>
                        {t.id === 'free' ? 'Start free' : 'Choose plan'}
                      </Link>
                    </Button>
                    <ul className="mt-6 space-y-2 text-sm">
                      <Feature on>{p.leadCap.toLocaleString('en-IN')} active leads</Feature>
                      <Feature on>{p.seatCap} {p.seatCap === 1 ? 'seat' : 'seats'}</Feature>
                      <Feature on>
                        {p.aiEmailsPerLead === Number.MAX_SAFE_INTEGER
                          ? 'Unlimited AI emails / lead'
                          : `${p.aiEmailsPerLead} AI emails / lead`}
                      </Feature>
                      <Feature on>{p.reviewsPerLead} review snippets / lead</Feature>
                      <Feature on={p.waMessagesPerMonth > 0}>
                        {p.waMessagesPerMonth > 0
                          ? `${p.waMessagesPerMonth.toLocaleString('en-IN')} WhatsApp msgs / mo`
                          : 'No WhatsApp'}
                      </Feature>
                      <Feature on={p.routesEnabled}>Smart Routes (OSRM)</Feature>
                      <Feature on={p.aiAssistantEnabled}>AI Assistant chat</Feature>
                      <Feature on={p.whiteLabelEnabled}>White-label</Feature>
                    </ul>
                  </div>
                );
              })}
            </div>

            <div className="mt-16 rounded-2xl border bg-secondary/40 p-8 text-sm">
              <h3 className="font-display text-lg font-semibold">India billing details</h3>
              <ul className="mt-3 grid gap-2 text-muted-foreground sm:grid-cols-2">
                <li>· GST 18% added at checkout. SAC 998314 (IT consulting & support).</li>
                <li>· CGST + SGST if you're in Karnataka, otherwise IGST.</li>
                <li>· FY-sequential GST invoice within minutes of every charge.</li>
                <li>· UPI Autopay primary; cards, e-mandate, RuPay-on-UPI supported.</li>
                <li>· TDS u/s 194J at 2% accepted — we reconcile.</li>
                <li>· No setup fees, no per-seat hidden costs, no auto-tier-bumps.</li>
              </ul>
            </div>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}

function Feature({ children, on }: { children: React.ReactNode; on: boolean }) {
  return (
    <li className={`flex items-start gap-2 ${on ? '' : 'text-muted-foreground line-through opacity-60'}`}>
      {on ? <Check className="h-4 w-4 shrink-0 text-primary" /> : <X className="h-4 w-4 shrink-0" />}
      <span>{children}</span>
    </li>
  );
}
