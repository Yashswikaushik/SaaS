import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { MarketingFooter } from '@/components/marketing/footer';
import { MarketingNavbar } from '@/components/marketing/navbar';

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col">
      <MarketingNavbar />
      <main className="flex-1">
        <div className="container grid place-items-center py-32 text-center">
          <h1 className="font-display text-6xl font-bold tracking-tight">404</h1>
          <p className="mt-2 text-muted-foreground">The page you're looking for has moved or never existed.</p>
          <Button asChild className="mt-8">
            <Link href="/">Back home</Link>
          </Button>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
