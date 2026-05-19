# ADR 0002 — DPDP Act 2023 compliance design

**Status**: Accepted · 2025-11-13

## Context

The Digital Personal Data Protection Act, 2023 ("DPDP") with Rules notified
13 Nov 2025 imposes penalties up to ₹250 Cr per incident. Bharat Leads is
a Data Fiduciary processing PII at scale (lead contact info, user accounts,
billing data, AI-generated outreach content). Compliance is foundational.

## Decision

### 1. Granular, layered consent
`consent_scope` enum: `essential | marketing | analytics | ai_processing`.
- Essential cannot be revoked without account erasure (contractual necessity).
- Marketing, analytics, ai_processing are opt-in per user, can be revoked any time.
- Cookie banner and Settings → Privacy both write to the same `consents` table.

### 2. Audit-as-source-of-record
Every consent flip, OTP request, login, message send, billing event writes to
`audit_log` with:
- `actor_user_id` (when initiated by user) OR `actor_service` (when system)
- `action` (dot-namespaced, e.g. `consent.flip`, `dpdp.export.served`)
- `target` (the entity acted on, e.g. `user:<uuid>`)
- `payload` (relevant JSONB context)
- `ip_hash` (SHA-256 of IP + salt — never raw)
- `user_agent`
- `occurred_at`

`audit_log` is append-only via app contract. PII fields in payload are masked on
user erase, but rows are retained 3 years.

### 3. Source verification for scraped data
Every `leads` row must have:
- `source_url` — canonical URL of where the data came from
- `source_method` — one of `geoapify_api`, `owner_website`, `user_provided`, `csv_import`
- `source_verified_at` — timestamp when verification was performed

For `owner_website` enrichment, `@bharat/scraper.verifyOwnerSource` requires both
a same-host canonical link AND a schema.org LocalBusiness JSON-LD with name match.
This is our affirmative answer to DPDP §3(c)(ii) "made public by the data principal".

### 4. DSR fulfilment in 7 days
- `/api/dpdp/export` — synchronous JSON dump (small users) or async via DSR queue (large)
- `/api/dpdp/erase` — soft-delete now, hard purge job at +30 days
- `/api/dpdp/correct` — updates with `audit_log` recording before/after

Invoices and audit logs are masked, not deleted (GST 7-year retention + audit need).

### 5. ConsentManager gate
`@bharat/dpdp.assertConsent({ userId, scope })` throws `DpdpConsentMissingError`
when consent is missing. Every outbound channel (email send, SMS send, WA send, AI call
on PII) calls this. Reviewer subagent enforces it on every PR.

### 6. Cross-border + sub-processors
Sub-processors disclosed in privacy policy. App data on Supabase Singapore (with
Mumbai migration plan). Payment data RBI-localised (Razorpay). DPA template at
`/legal/dpa`.

### 7. Breach response
- Sentry alerts → on-call within 15 min
- Determine scope within 1 hour
- Notify affected Data Principals + DPBI within 72 hours (DPDP §8(6))
- Playbook at `/legal/breach-playbook.md` (TBD)

## Consequences

- (+) DPBI penalty exposure minimised.
- (+) Customers buying enterprise can read this ADR + the Privacy/DPA pages and tick
  their security questionnaire boxes.
- (+) Source-verification design rejects 40-60% of scraped contact data vs. unconstrained
  scrape. We accept this as the cost of compliance.
- (−) ConsentManager check adds a DB read per outbound message. Mitigated by per-request
  cache + 30s TTL once we hit volume.

## Open

- Independent third-party DPDP audit (target: Year 2)
- ISO 27001 certification (target: Year 3)
