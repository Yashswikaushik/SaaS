# Bharat Leads

India-first B2B lead-database + mapped-CRM + AI cold outreach + WhatsApp send. INR pricing,
DPDP-by-design data handling, GST-correct invoicing, Razorpay UPI Autopay.

This is a Vonsel clone rebuilt for the Indian SMB market. See the strategy doc in chat history
and the executable plan at `/root/.claude/plans/cloning-vonsel-for-india-lazy-balloon.md`.

## What's in the repo

```
SaaS/
├── apps/web/                Next.js 14 App Router + tRPC + Tailwind
├── packages/
│   ├── ai/                  Claude / OpenAI prompts (cold email, review summary, WA)
│   ├── aisensy/             WhatsApp Business API client + inbound webhook
│   ├── db/                  Drizzle schema, DSR helpers, audit log
│   ├── dpdp/                Consent manager, opt-out keywords, errors
│   ├── gst/                 Tax splitter, FY-sequential invoice no, PDF, GSTIN check
│   ├── msg91/               SMS/OTP client, HMAC-hashed OTP store
│   ├── razorpay/            Subscriptions, webhook signature, idempotency, plans
│   └── scraper/             Geoapify Places + source-verification
├── workers/                 BullMQ workers: send-email, dunning, purge
├── tools/mcp-razorpay/      Custom MCP server wrapping Razorpay REST
├── infra/coolify/           Docker compose for web / worker / OSRM
├── .github/workflows/ci.yml CI: typecheck + lint + tests against pg+redis services
├── docker-compose.yml       Local dev infra (postgres, redis, osrm)
├── Dockerfile.web           Multi-stage Next.js image
├── Dockerfile.worker        Multi-stage worker image
└── CLAUDE.md                Subagent context: stack, forbidden patterns, conventions
```

## Quickstart

```bash
pnpm install
cp .env.example .env.local      # fill in real secrets — see Phase 0 of the plan
docker compose up -d postgres redis
psql $DATABASE_URL -f packages/db/migrations/0001_init.sql
pnpm dev                        # http://localhost:3000
```

`pnpm test` runs all unit tests. `pnpm --filter @bharat/web e2e` runs Playwright E2E.

## Compliance baked in

- **DPDP Act 2023** — granular consent, 7-day DSR endpoints, hashed-IP audit log, opt-out keywords in 8 Indian languages.
- **GST** — CGST/SGST/IGST split with state codes, SAC 998314, FY-sequential invoice numbers via Postgres advisory lock, react-pdf invoices.
- **RBI payment localisation** — Razorpay tokens only; we never store raw card data.
- **Google Maps ToS** — never called. Map tiles via Protomaps / OSM, places via Geoapify.

## Security

- HSTS, strict CSP, X-Frame DENY, no-sniff, Referrer-Policy strict-origin-when-cross-origin (see `apps/web/next.config.mjs`).
- Webhook signatures verified with timing-safe equality. Idempotency via dedicated `razorpay_processed_events` table.
- HMAC-hashed OTP codes at rest. IPs hashed in audit logs.
- Row-level security policies on every tenant-scoped table.
- Environment validated at boot via Zod (`apps/web/src/env.ts`).
- Logger redacts secret-shaped keys before stdout.

## Stack versions

- Node 20 · pnpm 9 · TypeScript 5.6 · Next.js 14.2 · tRPC v11 · Drizzle 0.34
- Postgres 16 · Redis 7 · BullMQ 5

## License

Proprietary. © 2025 Bharat Leads.
