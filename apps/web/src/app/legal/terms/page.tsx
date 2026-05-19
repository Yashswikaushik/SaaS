import { MarketingFooter } from '@/components/marketing/footer';
import { MarketingNavbar } from '@/components/marketing/navbar';

export const metadata = { title: 'Terms of Service — Bharat Leads' };

export default function TermsPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <MarketingNavbar />
      <main className="flex-1 py-16">
        <article className="container max-w-3xl prose prose-slate dark:prose-invert">
          <h1>Terms of Service</h1>
          <p><strong>Effective: 13 November 2025.</strong></p>

          <h2>1. Account & Eligibility</h2>
          <p>You must be 18+ and authorised to act on behalf of your business. One paying account per legal entity.</p>

          <h2>2. Acceptable use</h2>
          <ul>
            <li>You will use Bharat Leads only for B2B outreach to businesses you have a lawful basis to contact.</li>
            <li>You will honour opt-outs received via any channel within 24 hours.</li>
            <li>You will not impersonate other parties, send malware, or use the service for spam.</li>
            <li>You will not attempt to bypass per-plan caps, scrape our application, or replicate our data API.</li>
          </ul>

          <h2>3. Subscription, billing & GST</h2>
          <p>
            Plans are billed monthly or annually in INR via Razorpay. GST at 18% is added at checkout (SAC 998314).
            Invoices include CGST + SGST or IGST per place-of-supply rules. Failed payments enter a 7-day dunning
            window; if unpaid, the account is paused.
          </p>

          <h2>4. Cancellation & refunds</h2>
          <p>
            Cancel anytime. No partial-month refunds. Annual plans are prorated for unused months on cancellation due
            to material service failure. Razorpay refunds processed within 5–7 business days.
          </p>

          <h2>5. Service Level</h2>
          <p>
            Target 99.5% monthly uptime. Status page at status.bharatleads.in. Credits apply only to paid tiers and
            only for unplanned downtime > 1 hour after credit request.
          </p>

          <h2>6. Limitation of liability</h2>
          <p>
            To the maximum extent permitted by Indian law, our aggregate liability is capped at the amount you paid
            us in the 12 months preceding the claim. We are not liable for indirect, special, punitive or consequential
            damages.
          </p>

          <h2>7. Governing law & jurisdiction</h2>
          <p>Indian law applies. Courts in Bengaluru, Karnataka have exclusive jurisdiction.</p>

          <h2>8. Changes</h2>
          <p>We may revise these terms with 30 days' notice. Continued use after the effective date constitutes acceptance.</p>
        </article>
      </main>
      <MarketingFooter />
    </div>
  );
}
