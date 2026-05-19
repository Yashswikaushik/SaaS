import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Globe2,
  MapPinned,
  MessageSquareText,
  Route,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  Star,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MarketingFooter } from '@/components/marketing/footer';
import { MarketingNavbar } from '@/components/marketing/navbar';

export default function LandingPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <MarketingNavbar />
      <main className="flex-1">
        <Hero />
        <SocialProof />
        <Features />
        <ProductPreview />
        <PricingTeaser />
        <FAQ />
        <CtaBanner />
      </main>
      <MarketingFooter />
    </div>
  );
}

function Hero() {
  return (
    <section className="hero-glow relative overflow-hidden">
      <div className="grid-pattern absolute inset-0 opacity-30" />
      <div className="container relative grid items-center gap-12 py-20 lg:grid-cols-2 lg:py-28">
        <div className="space-y-6 animate-fade-in-up">
          <Badge variant="accent" className="rounded-full px-3 py-1">
            <Sparkles className="mr-1 inline h-3 w-3" /> Built for Indian SMBs · DPDP compliant
          </Badge>
          <h1 className="font-display text-4xl font-bold leading-tight tracking-tight text-balance sm:text-5xl lg:text-6xl">
            Find verified <span className="text-primary">B2B leads on a map.</span>
            <br />
            Close them with AI + WhatsApp.
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground text-pretty">
            Bharat Leads is the lead-database + mapped CRM built for Indian SMBs.
            Draw a polygon over Mumbai, get 200 verified leads, generate cold emails in Hindi or English,
            send via WhatsApp — all in under 30 seconds.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild size="xl">
              <Link href="/signup">
                Start free — 15 leads <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="xl">
              <Link href="/pricing">See pricing in ₹</Link>
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-primary" /> No credit card</span>
            <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-primary" /> UPI Autopay supported</span>
            <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-primary" /> GST invoices included</span>
            <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Hindi · English · Tamil</span>
          </div>
        </div>
        <HeroVisual />
      </div>
    </section>
  );
}

function HeroVisual() {
  return (
    <div className="relative">
      <div className="absolute -inset-x-10 -top-10 bottom-0 -z-10 rounded-3xl bg-gradient-to-br from-primary/20 via-transparent to-accent/20 blur-2xl" />
      <div className="overflow-hidden rounded-2xl border bg-card shadow-2xl">
        <div className="flex items-center gap-1.5 border-b bg-secondary/40 px-3 py-2">
          <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <div className="h-2.5 w-2.5 rounded-full bg-amber-300" />
          <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
          <span className="ml-3 text-xs text-muted-foreground">bharatleads.in/map</span>
        </div>
        <div className="grid h-96 grid-cols-3 gap-0 p-0">
          <div className="col-span-2 relative bg-gradient-to-br from-emerald-50 via-sky-50 to-amber-50">
            <div className="grid-pattern absolute inset-0 opacity-40" />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <MapPinned className="h-12 w-12 text-primary" />
              <p className="text-xs font-medium text-muted-foreground">
                Polygon · Indiranagar, Bengaluru
              </p>
              <p className="text-xs text-muted-foreground">12 cafés found · 8 verified</p>
            </div>
            {[...Array(12)].map((_, i) => (
              <span
                key={i}
                className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full border-2 border-white bg-primary shadow-md"
                style={{ top: `${20 + (i % 4) * 18}%`, left: `${15 + ((i * 13) % 70)}%` }}
              />
            ))}
          </div>
          <div className="col-span-1 border-l p-4 text-xs">
            <h4 className="font-semibold">Third Wave Coffee</h4>
            <p className="mt-0.5 text-muted-foreground">Indiranagar, Bengaluru</p>
            <p className="mt-2 inline-flex items-center text-amber-500">
              <Star className="h-3 w-3" fill="currentColor" /> 4.5 · 312 reviews
            </p>
            <div className="my-3 h-px bg-border" />
            <p className="font-medium">Pain signal</p>
            <p className="text-muted-foreground">"Long wait during peak hours"</p>
            <div className="my-3 h-px bg-border" />
            <Button size="sm" className="w-full">
              Generate cold email
            </Button>
            <Button size="sm" variant="outline" className="mt-2 w-full">
              Send WhatsApp
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SocialProof() {
  return (
    <section className="border-y bg-secondary/30 py-10">
      <div className="container">
        <p className="mb-6 text-center text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Built on the stack Indian SMBs trust
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-sm font-semibold text-muted-foreground">
          <span>Razorpay UPI Autopay</span>
          <span>MSG91 DLT-approved SMS</span>
          <span>AiSensy WhatsApp Business</span>
          <span>Supabase Postgres</span>
          <span>Anthropic Claude</span>
          <span>GST Invoices SAC 998314</span>
        </div>
      </div>
    </section>
  );
}

function Features() {
  const features = [
    {
      icon: ScanSearch,
      title: 'Map-first lead finder',
      desc: 'Draw a polygon on a map. Get up to 500 verified businesses in seconds — names, addresses, phones, websites, ratings. Zero Google Maps lock-in.',
    },
    {
      icon: Sparkles,
      title: 'AI cold emails in 7 languages',
      desc: 'Claude Sonnet generates 2-3 variants per lead in English, Hindi, Hindi-Roman, Tamil, Telugu, Marathi, Bengali — under 8 seconds.',
    },
    {
      icon: MessageSquareText,
      title: 'WhatsApp Business at ₹0.86/msg',
      desc: 'Official AiSensy + Meta. Template approvals tracked in-app, opt-out keywords in 8 Indian languages, 98% open rate.',
    },
    {
      icon: Star,
      title: 'AI review pain mining',
      desc: 'Public reviews summarised into 5 actionable pain themes per lead. Every cold email opens with a specific observation, not a template.',
    },
    {
      icon: Route,
      title: 'Field-rep route optimisation',
      desc: 'OSRM under the hood. 25 leads → optimised route in 2s → Google Maps deeplink to your phone. WhatsApp the day plan to your team.',
    },
    {
      icon: BarChart3,
      title: 'Real-time team supervision',
      desc: 'Supabase Realtime feed of rep activity. Leaderboards, pipeline movement, lead-touch frequency. Built for sales managers.',
    },
    {
      icon: ShieldCheck,
      title: 'DPDP Act 2023 by design',
      desc: 'Source-verified leads, granular consent toggles, 7-day DSR (export/erase/correct), audit logs on every consent flip. ₹250 Cr fine prevention.',
    },
    {
      icon: Globe2,
      title: 'Built for India billing',
      desc: 'INR pricing, GST invoices, FY-sequential invoice numbers, place-of-supply CGST/SGST split, UPI Autopay primary, founder alerts on ≥₹4,999 charges.',
    },
  ];
  return (
    <section id="features" className="py-20 lg:py-28">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="outline" className="rounded-full">Why Bharat Leads</Badge>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Everything Indian sales teams need. None of the global SaaS tax.
          </h2>
          <p className="mt-3 text-muted-foreground">
            Apollo, Lusha, LeadSquared, Kylas, Badger Maps — pick any one and you'll pay 3–10× more or
            fight a product built for the US. Bharat Leads is built ground-up for India.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="group rounded-2xl border bg-card p-6 transition hover:border-primary/50 hover:shadow-md">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary transition group-hover:scale-110">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductPreview() {
  return (
    <section className="border-y bg-secondary/30 py-20 lg:py-28">
      <div className="container grid items-center gap-12 lg:grid-cols-2">
        <div className="space-y-4">
          <Badge variant="outline" className="rounded-full">The 30-second loop</Badge>
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            From "I need leads in Indore" to "first message sent" in under a minute.
          </h2>
          <ol className="mt-6 space-y-4 text-sm">
            <Step
              n={1}
              title="Search by area + category"
              body="Polygon over the area you serve. Pick from 23 B2B-relevant categories — clinics, schools, gyms, retail, offices."
            />
            <Step
              n={2}
              title="Filter to verified leads"
              body="Source verification on every record. We persist only what we can prove came from the business's own listing — DPDP §3(c)(ii) safe."
            />
            <Step
              n={3}
              title="Generate AI messages"
              body="Claude generates 2 variants per lead, mixing English + Hindi-Roman if needed. Each opens with a public pain signal from reviews."
            />
            <Step
              n={4}
              title="Send via email or WhatsApp"
              body="Resend handles transactional email. AiSensy templates send WA at ₹0.86/marketing or ₹0.12/utility message. Replies route back in-app."
            />
            <Step
              n={5}
              title="Track in pipeline"
              body="Drag leads through new → contacted → qualified → won. Notes, calls, AI summaries all in one timeline."
            />
          </ol>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <PreviewCard title="leads pinned" value="487" sub="Bengaluru polygon · cafés" />
          <PreviewCard title="emails generated" value="32" sub="Today · 8 in Hindi-Roman" />
          <PreviewCard title="WA delivered" value="98%" sub="vs ~21% email open" />
          <PreviewCard title="cost / lead" value="₹0.04" sub="Geoapify + caching" />
        </div>
      </div>
    </section>
  );
}

function Step({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <li className="flex gap-4">
      <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
        {n}
      </div>
      <div>
        <h4 className="font-semibold">{title}</h4>
        <p className="text-muted-foreground">{body}</p>
      </div>
    </li>
  );
}

function PreviewCard({ title, value, sub }: { title: string; value: string; sub: string }) {
  return (
    <div className="rounded-2xl border bg-card p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</p>
      <p className="mt-2 font-display text-3xl font-bold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}

function PricingTeaser() {
  return (
    <section className="py-20 lg:py-28">
      <div className="container text-center">
        <Badge variant="outline" className="rounded-full">India pricing</Badge>
        <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
          ₹999 — ₹12,999/mo. GST extra (we send a proper invoice).
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          UPI Autopay, monthly or annual. Free tier — 15 leads, no card. Annual saves 17%.
        </p>
        <div className="mt-8">
          <Button asChild size="xl">
            <Link href="/pricing">See full pricing →</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  const items = [
    {
      q: 'Is your data scraping DPDP-compliant?',
      a: 'Yes. Our primary source is Geoapify Places — a license-clean API. For enrichment, we only persist contact info we can trace to a business\'s own website (canonical link + schema.org match). Every lead row stores source_url and source_verified_at as required by DPDP §3(c)(ii).',
    },
    {
      q: 'Do you have GST invoices and a GSTIN?',
      a: 'Yes. Every paid charge gets a proper GST invoice (FY-sequential number, SAC 998314, CGST/SGST or IGST split based on your billing state). PDF download in your dashboard within minutes.',
    },
    {
      q: 'How does UPI Autopay work?',
      a: 'Razorpay Subscriptions with a ₹1 mandate auth — proven to lift success rates. Cap at ₹15k per cycle by default. We support card e-mandates, eNACH, and RuPay-on-UPI as fallbacks.',
    },
    {
      q: 'Can I send marketing WhatsApp messages?',
      a: 'Only with explicit consent. Our AiSensy integration uses Meta-approved templates. We track template approval status, enforce 8-language opt-out keyword detection (STOP/रोकें/நிறுத்து/etc.), and write a consent_snapshot to every outgoing message for audit.',
    },
    {
      q: 'What languages are supported in the AI?',
      a: 'English, Hindi (Devanagari and Roman), Tamil, Telugu, Marathi, Bengali, Kannada. The UI is English-first; AI generation supports all seven for cold emails and WA messages.',
    },
  ];
  return (
    <section className="border-t bg-secondary/30 py-20">
      <div className="container max-w-3xl">
        <h2 className="font-display text-3xl font-bold tracking-tight">Common questions</h2>
        <dl className="mt-8 divide-y">
          {items.map((it) => (
            <div key={it.q} className="py-5">
              <dt className="font-semibold">{it.q}</dt>
              <dd className="mt-1 text-sm text-muted-foreground">{it.a}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

function CtaBanner() {
  return (
    <section className="py-20">
      <div className="container">
        <div className="hero-glow relative overflow-hidden rounded-3xl border bg-card p-10 text-center lg:p-16">
          <h2 className="mx-auto max-w-2xl font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Stop paying $99/seat for SaaS that wasn't built for Indian SMBs.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Start with 15 free leads. No card. Cancel anytime via WhatsApp.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="xl">
              <Link href="/signup">
                Get started free <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="xl">
              <Link href="/pricing">Compare plans</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
