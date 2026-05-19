import Link from 'next/link';

export function MarketingFooter() {
  return (
    <footer className="border-t border-border/60 bg-background">
      <div className="container grid gap-10 py-12 md:grid-cols-5">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2 font-display text-lg font-bold">
            <div className="grid h-7 w-7 place-items-center rounded-md bg-primary text-primary-foreground">
              <span className="text-sm font-black">BL</span>
            </div>
            Bharat Leads
          </div>
          <p className="mt-3 max-w-sm text-sm text-muted-foreground">
            B2B leads + mapped CRM built for Indian SMBs. Find verified leads on a map, write AI cold emails in Hindi
            or English, send via WhatsApp, and close — all from one workspace.
          </p>
          <p className="mt-4 text-xs text-muted-foreground">
            Bengaluru, Karnataka · privacy@bharatleads.in
          </p>
        </div>

        <FooterCol
          title="Product"
          links={[
            { label: 'Pricing', href: '/pricing' },
            { label: 'Features', href: '/#features' },
            { label: 'Compare', href: '/vs/leadsquared' },
            { label: 'Changelog', href: '/changelog' },
          ]}
        />
        <FooterCol
          title="Compare"
          links={[
            { label: 'vs LeadSquared', href: '/vs/leadsquared' },
            { label: 'vs Kylas', href: '/vs/kylas' },
            { label: 'vs Freshsales', href: '/vs/freshsales' },
            { label: 'vs Apollo', href: '/vs/apollo' },
            { label: 'vs Lusha', href: '/vs/lusha' },
          ]}
        />
        <FooterCol
          title="Legal"
          links={[
            { label: 'Privacy Policy', href: '/legal/privacy' },
            { label: 'Terms of Service', href: '/legal/terms' },
            { label: 'DPA', href: '/legal/dpa' },
            { label: 'Grievance', href: '/legal/grievance' },
            { label: 'Cookie Policy', href: '/legal/cookies' },
          ]}
        />
      </div>
      <div className="border-t border-border/60">
        <div className="container flex flex-col items-center justify-between gap-2 py-4 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} Bharat Leads. All rights reserved.</p>
          <p>DPDP Act 2023 compliant · GST 18% on all India invoices · SAC 998314</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: Array<{ label: string; href: string }> }) {
  return (
    <div>
      <h4 className="font-display text-sm font-semibold">{title}</h4>
      <ul className="mt-3 space-y-2 text-sm">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="text-muted-foreground transition hover:text-foreground">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
