---
name: dpdp-consent-flow
description: DPDP Act 2023 consent manager, DSR endpoints, audit logging. Use when collecting consent, sending marketing/transactional messages, or building data export/erase flows. Trigger on mentions of DPDP, consent, privacy, DSR, data principal, erase, export.
---

# DPDP consent flow

## Granular scopes
Stored in `consents` table:
- `marketing` — promotional emails, WA broadcasts, cold outreach
- `analytics` — PostHog, Sentry, behavioural tracking
- `ai_processing` — feeding lead data into Claude/OpenAI
- `essential` — required for service (cannot be withdrawn without account deletion)

Each `consents` row: `user_id`, `scope`, `granted` bool, `granted_at`, `ip`, `ua`, `notice_version`.

## Consent check before any outbound
```ts
import { assertConsent } from '@bharat/dpdp';

await assertConsent({ userId, scope: 'marketing' });
// throws DpdpConsentError if not granted — caller must handle
```

## DSR (Data Subject Request) endpoints — must complete in 7 days
- `POST /api/dpdp/export` → enqueue export job, email ZIP within 24h
- `POST /api/dpdp/erase` → soft-delete now, hard purge after 30-day cooling-off
- `POST /api/dpdp/correct` → update specified fields, audit-log the change

## Audit log
Every consent flip and DSR action writes to `audit_log`:
```ts
await audit({
  actor: userId,
  action: 'consent.flip',
  target: `user:${userId}`,
  payload: { scope, from, to, ip, ua, notice_version },
});
```

## Notice versioning
- Privacy policy stored in `legal_notices` table with `version`, `effective_at`, `body` (markdown).
- Bump version → user sees consent re-confirmation banner on next login.
- Never delete old versions — DPBI may demand the version a user consented to.

## Erasure scope
When user requests erase:
1. Set `deleted_at = now()` on user + all owned leads/messages/audit (logs are masked, not deleted)
2. Cancel Razorpay subscription
3. Schedule hard-purge job for now() + 30 days
4. Email user with deletion timeline
5. Audit-log the request with IP/UA

## What CANNOT be erased
- Invoices (legal retention per GST Act — 7 years)
- Audit logs (mask PII, keep event records)
- Razorpay payment records (RBI mandate)

## Grievance officer
Page at `/legal/grievance` lists name, email, postal address, 7-day SLA.
