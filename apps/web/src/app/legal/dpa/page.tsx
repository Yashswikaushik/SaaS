import { MarketingFooter } from '@/components/marketing/footer';
import { MarketingNavbar } from '@/components/marketing/navbar';

export const metadata = { title: 'Data Processing Agreement — Bharat Leads' };

export default function DpaPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <MarketingNavbar />
      <main className="flex-1 py-16">
        <article className="container max-w-3xl prose prose-slate dark:prose-invert">
          <h1>Data Processing Agreement</h1>
          <p>
            <strong>Effective: 13 November 2025.</strong> This DPA forms part of the Subscription Agreement
            between Bharat Leads (Processor) and the Customer (Controller / Data Fiduciary). When you accept
            our Terms, you accept this DPA on behalf of your business.
          </p>

          <h2>1. Definitions</h2>
          <p>Terms have the meaning assigned in the DPDP Act, 2023. "Personal data" includes data of natural persons
          processed in the course of using Bharat Leads.</p>

          <h2>2. Scope of processing</h2>
          <p>We process personal data of (a) your authorised users, (b) leads you create or import, strictly to
          provide the service: account management, search, AI generation (when ai_processing consent is granted by
          users), message dispatch, billing, observability.</p>

          <h2>3. Sub-processors</h2>
          <p>Listed in our <a href="/legal/privacy">Privacy Policy</a>. We give 14-day notice before adding new
          sub-processors; you may object and terminate without penalty.</p>

          <h2>4. Security</h2>
          <ul>
            <li>TLS in transit, AES-256 at rest where applicable.</li>
            <li>RLS-based tenant isolation in our Postgres instance.</li>
            <li>Annual third-party security review (target: from Year 2).</li>
            <li>72-hour breach notification to you and to DPBI.</li>
          </ul>

          <h2>5. Data Principal rights</h2>
          <p>We provide self-serve export/erase/correct endpoints. Where a Data Principal contacts us directly, we
          route the request through you within 24 hours.</p>

          <h2>6. Return / deletion on termination</h2>
          <p>On termination, we soft-delete your data within 7 days and hard-purge within 30 days, except where
          retention is required by Indian law (e.g. GST invoices — 7 years).</p>

          <h2>7. Audit rights</h2>
          <p>You may request a SOC 2 / ISO 27001 letter once available, or a written description of controls in the
          interim, at most twice per calendar year.</p>

          <h2>8. Governing law</h2>
          <p>Indian law; Bengaluru courts.</p>
        </article>
      </main>
      <MarketingFooter />
    </div>
  );
}
