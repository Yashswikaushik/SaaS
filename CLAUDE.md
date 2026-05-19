# Bharat Leads — root context

## Mission
India-first B2B lead-database + mapped-CRM + WhatsApp outbound SaaS. Cloning Vonsel's
feature set with INR pricing (₹999/₹2,499/₹4,999/₹12,999), DPDP-safe sourcing,
AiSensy WhatsApp as primary outbound channel.

## Stack (locked)
- Next.js 14.2 App Router + TS + Tailwind + shadcn/ui
- tRPC v11 — end-to-end typesafe
- Postgres on Supabase (Singapore → Mumbai when GA)
- Drizzle 0.34+ ORM, `drizzle-kit check` mandatory in CI
- Supabase Auth + MSG91 email/SMS OTP + AiSensy WA OTP fallback
- MapLibre GL JS + Protomaps + Geoapify Places
- BullMQ + Upstash Redis
- Claude Sonnet 4.5 primary + GPT-4.1-mini fallback via AI SDK
- Razorpay Subscriptions (UPI Autopay primary)
- AiSensy ₹999/mo Pro for WhatsApp
- Resend (txn) + SES (bulk cold)

## Forbidden patterns (reviewer subagent enforces)
1. Never call Google Places / Google Maps JS API. ToS §3.2.1(b) and §3.2.3.
2. Never store raw PAN/card numbers. Razorpay tokens only.
3. No `any` without a `// CLAUDE: justified — <reason>` comment on the same line.
4. No direct DB access from Next.js Server Components. Always tRPC.
5. No scraped/enriched lead data persisted without `source_url` + `source_verified_at`.
6. No outbound message (email/SMS/WA) without passing through `ConsentManager.assertConsent`.
7. No production deploys after 9pm IST.
8. No `// removed` or backwards-compat shims for code you just deleted — delete cleanly.

## DB conventions
- snake_case column names. UUIDv7 ids.
- Every table: `id`, `created_at`, `updated_at`, soft-delete `deleted_at` nullable.
- Every PII-bearing table exports `getByDataPrincipal(userId)`, `erase(userId)`, `export(userId)`
  via the helper in `packages/db/src/dsr.ts`.
- Money: integer paise. Never float.
- Phones: E.164 with `+91...`. Never store leading-zero local format.

## DPDP rules
- DPDP Act 2023 + Rules 2025. Fines up to ₹250 Cr per incident.
- Section 3(c)(ii) exemption is narrow — requires source verification per record.
- DSR (export/erase/correct) must complete within 7 days. Endpoints at `/api/dpdp/*`.
- 72h breach notification to DPBI. Playbook in `/legal/breach-playbook.md`.
- No "legitimate interest" basis — DPDP rejects it.

## India locale
- Currency: `Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })`. Grouping is 1,00,000 not 100,000.
- Phone display: `libphonenumber-js` → `+91 9XXXX XXXXX`.
- Dates: `DD-MM-YYYY` default. Use `date-fns` with `enIN` locale.
- GST: 18% on SaaS. SAC 998314. CGST+SGST if org state == customer state, else IGST.

## Testing
- Vitest for unit. Playwright for E2E.
- Every Razorpay / MSG91 / AiSensy / Anthropic call has a recorded fixture.
- Every webhook handler: idempotency test + signature-verification test.
- Coverage gates: 80% on `packages/{razorpay,gst,dpdp,aisensy}`.

## Subagents (in .claude/agents)
- `implementer` — primary writer
- `reviewer` — checks forbidden patterns
- `test-writer` — Vitest + Playwright from spec
- `migration-writer` — Drizzle migrations, runs `drizzle-kit check`
- `scraper-builder` — Playwright workers with source-verification metadata
- `india-compliance` — runs via `/india-audit`, flags missing GSTIN/DPDP/DLT issues

## Skills (in .claude/skills)
- `razorpay-integration` — Subscription, webhook, idempotency patterns
- `dpdp-consent-flow` — Consent manager, DSR endpoints, audit log
- `gst-invoice` — CGST/SGST/IGST splitter, SAC, FY-sequential invoice numbers
- `whatsapp-aisensy` — Template approval, broadcast, opt-out keyword handling
- `maplibre-geoapify` — Map setup, polygon draw, Geoapify autocomplete

## Slash commands
- `/ship-feature "name"` — spec → plan → implement → test → review → PR
- `/add-migration "name"` — Drizzle migration with diff-check
- `/review-pr` — runs reviewer subagent on current diff
- `/india-audit` — runs india-compliance subagent over entire repo

## MCP servers (in .mcp.json)
- GitHub (Anthropic official), Supabase, Playwright, Linear, Sentry
- Custom Razorpay MCP at `tools/mcp-razorpay`

## Brand
Placeholder: "Bharat Leads". Single string — rename via repo-wide replace later.
Domain placeholder: `bharatleads.in`.
