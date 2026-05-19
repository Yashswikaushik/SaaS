import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  BarChart3,
  CreditCard,
  LayoutDashboard,
  Map,
  MessageCircle,
  Route,
  Settings as SettingsIcon,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { supabaseServer } from '@/lib/supabase-server';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/app', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/app/map', label: 'Finder', icon: Map },
  { href: '/app/leads', label: 'Leads', icon: BarChart3 },
  { href: '/app/routes', label: 'Routes', icon: Route },
  { href: '/app/whatsapp', label: 'WhatsApp', icon: MessageCircle },
  { href: '/app/team', label: 'Team', icon: Users },
  { href: '/app/billing', label: 'Billing', icon: CreditCard },
  { href: '/app/privacy', label: 'Privacy', icon: ShieldCheck },
  { href: '/app/settings', label: 'Settings', icon: SettingsIcon },
] as const;

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const sb = supabaseServer();
  const { data } = await sb.auth.getUser();
  if (!data.user) redirect('/login?next=/app');

  return (
    <div className="grid min-h-dvh grid-cols-[240px_1fr] bg-secondary/20">
      <aside className="sticky top-0 hidden h-dvh flex-col border-r bg-card md:flex">
        <Link href="/app" className="flex items-center gap-2 border-b px-6 py-4 font-display text-lg font-bold">
          <div className="grid h-7 w-7 place-items-center rounded-md bg-primary text-primary-foreground text-xs font-black">
            BL
          </div>
          Bharat Leads
        </Link>
        <nav className="flex-1 space-y-1 p-3">
          {NAV.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
        </nav>
        <div className="border-t p-4 text-xs text-muted-foreground">
          <p className="font-semibold text-foreground">Need help?</p>
          <p className="mt-1">WhatsApp: +91 80000 00000</p>
          <p>Mon-Fri · 10am-8pm IST</p>
        </div>
      </aside>
      <main className="min-h-dvh">{children}</main>
    </div>
  );
}

function NavLink({ href, label, icon: Icon }: { href: string; label: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition',
        'text-muted-foreground hover:bg-secondary hover:text-foreground',
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}
