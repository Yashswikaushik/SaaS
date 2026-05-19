# Security Policy

## Reporting a vulnerability

If you discover a security vulnerability in Bharat Leads, please email **security@bharatleads.in**
with a description, reproduction steps, and the impact you observed. Please do *not* file a public
GitHub issue or post details on social media until we've coordinated a fix.

- Acknowledgement SLA: **48 hours**
- Triage SLA: **5 working days**
- Fix SLA for critical / high: **30 days** (with progress updates every 7 days)

We follow responsible-disclosure norms. Researchers acting in good faith — testing on test accounts,
not exfiltrating data, not impacting other users — will not be subject to legal action.

## Scope

In scope:
- `bharatleads.in` and all `*.bharatleads.in` subdomains
- API endpoints under `/api/`
- The Razorpay, MSG91, AiSensy integrations as wired in this repo

Out of scope (not our infra):
- Razorpay / AiSensy / MSG91 / Supabase / Hetzner / Cloudflare — please report to those vendors

## Hardening practices in this repo

- **Transport**: HSTS preloaded, TLS 1.2+ only.
- **Headers**: Strict-Transport-Security, X-Content-Type-Options, X-Frame-Options, Content-Security-Policy, Permissions-Policy. See `apps/web/next.config.mjs`.
- **Authentication**: Supabase OTP-based, no passwords. OTPs HMAC-hashed at rest. 5 OTP requests / 15 min / identity hard rate-limit. MFA secrets encrypted at rest with KMS key.
- **Sessions**: Secure, HttpOnly, SameSite=Lax cookies.
- **Tenant isolation**: Postgres Row-Level Security policies on every tenant-scoped table.
- **Webhook integrity**: HMAC-SHA256 signature verification with `timingSafeEqual`. Idempotency dedup table.
- **Inputs**: All tRPC mutations validate via Zod. Polygon vertex counts capped, AI inputs length-capped.
- **Logging**: Structured JSON. Secret-shaped keys auto-redacted (`authorization`, `cookie`, `password`, `token`, `secret`, `api_key`, `otp`, `code`, `signature`).
- **PII at rest**: IPs hashed before storage. OTPs hashed. Phones in E.164 — invariant.
- **DPDP**: 7-day DSR turnaround, granular consent, opt-out keywords in 8 Indian languages, audit-log every consent change with hashed-IP + UA + notice version.
- **Payments**: Razorpay tokens only — no PAN/card storage. ₹1 mandate auth proven for UPI Autopay.
- **Supply chain**: Locked `package.json` versions, pnpm with content-addressed store. CI runs typecheck + lint + tests on every PR.

## Threat model — what's in scope to defend

- Tenant data leakage between orgs (defended via RLS + tRPC `requireOrg` middleware)
- Payment double-charge or replay (defended via `withIdempotency`)
- OTP brute force (defended via 5-attempts cap + 15-min identity rate limit + 60-second IP rate limit)
- Consent bypass (defended via `assertConsent` on every outbound channel; reviewer subagent enforces)
- Scraping of personal data without source verification (defended via `source_url` + `source_verified_at` invariant on every lead row)

## Out-of-scope concerns

- Phishing of end users (general security awareness; we publish a `privacy@bharatleads.in` for verification)
- DDoS (Cloudflare in front; volumetric handled at edge)
- Physical security of vendor data centres (vendor responsibility)
