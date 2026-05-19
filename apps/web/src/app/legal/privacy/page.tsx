import { MarketingFooter } from '@/components/marketing/footer';
import { MarketingNavbar } from '@/components/marketing/navbar';

export const metadata = { title: 'Privacy Policy — Bharat Leads' };

export default function PrivacyPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <MarketingNavbar />
      <main className="flex-1 py-16">
        <article className="container max-w-3xl prose prose-slate dark:prose-invert">
          <h1>Privacy Policy</h1>
          <p>
            <strong>Effective: 13 November 2025 · Version 2025-11-13.</strong>
          </p>
          <p>
            Bharat Leads ("we", "us") is a Data Fiduciary under the Digital Personal Data Protection Act, 2023
            ("DPDP Act"). This policy explains how we collect, process, store and erase personal data, and how
            you can exercise your rights as a Data Principal.
          </p>

          <h2>1. What we collect</h2>
          <ul>
            <li><strong>Identity & contact:</strong> name, email, phone, GSTIN (optional), billing address, PAN (optional).</li>
            <li><strong>Authentication:</strong> Supabase Auth user id, MFA secret (encrypted), OTP codes (hashed, time-limited).</li>
            <li><strong>Usage:</strong> pages visited, features used, search polygons drawn (analytics consent required).</li>
            <li><strong>Lead data you create:</strong> business names, public addresses and contact info, your notes, AI-generated drafts.</li>
            <li><strong>Payments:</strong> Razorpay tokens only — we never store raw card numbers or CVVs.</li>
          </ul>

          <h2>2. Why we collect it (lawful basis)</h2>
          <p>
            Under the DPDP Act, our lawful basis is your <strong>consent</strong> for marketing, analytics, and AI
            processing scopes, and <strong>contractual necessity</strong> (treated as essential) for account, billing,
            fraud prevention and security.
          </p>

          <h2>3. Source of lead data — DPDP §3(c)(ii) compliance</h2>
          <p>
            Lead data shown in the "Finder" is sourced via Geoapify Places (license-clean API) and, where
            enriched, from each business's own publicly-published website (canonical URL + schema.org match).
            Every lead row stores <code>source_url</code> and <code>source_verified_at</code> as our audit
            record. We do not scrape personal/private profiles, and we do not cache Google Maps content.
          </p>

          <h2>4. Who we share it with (sub-processors)</h2>
          <ul>
            <li>Supabase (Singapore) — database, auth, storage</li>
            <li>Hetzner + Cloudflare — application hosting</li>
            <li>Razorpay (India) — payments</li>
            <li>MSG91 (India) — SMS & email OTP</li>
            <li>AiSensy + Meta (Ireland) — WhatsApp Business API</li>
            <li>Anthropic + OpenAI — AI processing of lead content (requires AI processing consent)</li>
            <li>Resend + Amazon SES — transactional and bulk email</li>
            <li>Sentry, PostHog (EU) — error monitoring and product analytics (requires analytics consent)</li>
            <li>Geoapify (Vienna) — Places API</li>
          </ul>
          <p>Each sub-processor has signed a Data Processing Agreement or is subject to equivalent contractual safeguards.</p>

          <h2>5. Your rights under DPDP</h2>
          <ul>
            <li><strong>Right to access</strong> — request a JSON export of all data we hold on you.</li>
            <li><strong>Right to correct</strong> — request corrections to inaccurate data.</li>
            <li><strong>Right to erase</strong> — request soft-delete now, hard purge after 30 days.</li>
            <li><strong>Right to grievance</strong> — contact our Grievance Officer (below) for unresolved issues.</li>
          </ul>
          <p>Exercise any of these from <a href="/settings/privacy">Settings → Privacy</a>. We respond within 7 days.</p>

          <h2>6. Retention</h2>
          <ul>
            <li>Account data: while account is active + 30 days after erase request</li>
            <li>Invoices (GST law): 7 years (cannot be erased before then by law)</li>
            <li>Audit logs: 3 years (PII fields masked after user erase)</li>
            <li>OTP codes: 10 minutes</li>
          </ul>

          <h2>7. Security</h2>
          <ul>
            <li>TLS 1.2+ for all traffic. HSTS, strict CSP, no third-party JS without consent.</li>
            <li>Row-level security in Postgres for tenant isolation.</li>
            <li>HMAC-hashed OTPs at rest; password-less auth (OTP + magic link).</li>
            <li>Encrypted MFA secrets via KMS.</li>
            <li>72-hour breach notification to the Data Protection Board of India.</li>
          </ul>

          <h2>8. Children</h2>
          <p>The service is intended for business use by adults (18+). We do not knowingly collect data of minors.</p>

          <h2>9. Cross-border transfers</h2>
          <p>
            Application data is stored on Supabase (Singapore region). Payment data is stored in India per RBI
            localisation rules (handled by Razorpay). We will migrate the application database to a Mumbai
            region when Supabase makes it available.
          </p>

          <h2>10. Grievance Officer</h2>
          <p>
            <strong>Name:</strong> [To be assigned — owner of Bharat Leads]<br />
            <strong>Email:</strong> grievance@bharatleads.in<br />
            <strong>Postal:</strong> Bengaluru, Karnataka, India<br />
            <strong>Response SLA:</strong> 7 working days
          </p>

          <h2>11. Changes to this policy</h2>
          <p>
            On any material change we will (a) bump the notice version, (b) prompt re-consent on next login for
            scopes affected, (c) email the change summary to all active users. Earlier versions remain on file.
          </p>
        </article>
      </main>
      <MarketingFooter />
    </div>
  );
}
