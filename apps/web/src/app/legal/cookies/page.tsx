import { MarketingFooter } from '@/components/marketing/footer';
import { MarketingNavbar } from '@/components/marketing/navbar';

export const metadata = { title: 'Cookie Policy — Bharat Leads' };

export default function CookiesPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <MarketingNavbar />
      <main className="flex-1 py-16">
        <article className="container max-w-2xl prose prose-slate dark:prose-invert">
          <h1>Cookie Policy</h1>
          <p>
            We use a small number of cookies. Strictly-essential cookies (session, CSRF, cart) are always on.
            Analytics cookies (PostHog) are off by default and load only after you toggle "Analytics" consent
            from your privacy settings or the cookie banner.
          </p>
          <h2>Cookies in use</h2>
          <ul>
            <li><strong>sb-access-token / sb-refresh-token</strong> — Supabase auth (essential)</li>
            <li><strong>org_slug</strong> — active org context (essential)</li>
            <li><strong>bl_consent</strong> — your consent choices (essential)</li>
            <li><strong>ph_*</strong> — PostHog analytics (only with consent)</li>
          </ul>
        </article>
      </main>
      <MarketingFooter />
    </div>
  );
}
