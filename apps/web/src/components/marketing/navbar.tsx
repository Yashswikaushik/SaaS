import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function MarketingNavbar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-display text-xl font-bold tracking-tight">
          <div className="grid h-7 w-7 place-items-center rounded-md bg-primary text-primary-foreground">
            <span className="text-sm font-black">BL</span>
          </div>
          Bharat Leads
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
          <Link href="/#features" className="transition hover:text-foreground">
            Features
          </Link>
          <Link href="/pricing" className="transition hover:text-foreground">
            Pricing
          </Link>
          <Link href="/vs/leadsquared" className="transition hover:text-foreground">
            Compare
          </Link>
          <Link href="/blog" className="transition hover:text-foreground">
            Blog
          </Link>
          <Link href="/legal/privacy" className="transition hover:text-foreground">
            Privacy
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/signup">Get started free</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
