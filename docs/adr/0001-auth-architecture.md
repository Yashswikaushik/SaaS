# ADR 0001 — Authentication architecture

**Status**: Accepted · 2025-11-13

## Context

Bharat Leads needs password-less authentication that works across:
- Email (primary, used by ICP — sales managers in office)
- SMS OTP (Indian SMBs prefer phone for sign-in)
- WhatsApp OTP (fallback when DLT SMS is throttled)

Constraints:
- DPDP-compliant. Audit trail of every login attempt.
- DLT-registered SMS templates required to deliver SMS in India.
- Razorpay subscription-flow must be tied to a Supabase Auth user id.
- HMAC-hashed OTPs at rest. No plain-text in DB or logs.

## Decision

**Two-tier identity**:
1. **Supabase Auth** owns the session (JWT cookies, refresh tokens, MFA secrets).
2. **Our `otp_codes` table** owns the multi-channel OTP issuance, with HMAC-SHA256 hashing
   at rest.

### Email
- Use **Supabase Auth's built-in email OTP** (`supabase.auth.signInWithOtp({ email })`).
- Supabase handles delivery via SMTP we configure (Resend) and code verification.
- Our `otp_codes` table is bypassed for email — simpler and Supabase already audits.

### SMS
- Use **Supabase Auth custom SMS hook** to route through MSG91 DLT-registered templates.
- The hook posts to `/api/auth/sms-hook`, which calls `@bharat/msg91.sendOtp` with our
  template id. Supabase still owns the verify step and creates the session.

### WhatsApp
- WA OTP is **manual fallback**. tRPC `auth.requestOtp` with `channel: 'whatsapp'`
  issues a code in our `otp_codes` table and sends via AiSensy template.
- On verify, we call `supabase.auth.admin.generateLink({ type: 'magiclink', email })`
  to mint a one-shot magic link, redirect the browser through it, and Supabase creates
  the session. The user's phone is recorded in our `users.phone` for next time.

### Audit
- Every `requestOtp` and `verifyOtp` writes to `audit_log` with hashed IP + UA + channel.
- 5 OTP issues / 15 min / identity is the hard cap (rate-limited at tRPC layer).
- 20 verify attempts / 60s / IP is the hard cap.

## Consequences

- (+) Supabase Auth handles refresh tokens, CSRF, secure cookies — done well, audited.
- (+) MSG91 + AiSensy stay loosely coupled — we can swap them per channel without touching Supabase.
- (+) Our `otp_codes` table covers WA fallback that Supabase doesn't natively support.
- (−) Two flows to maintain (Supabase native vs our store). Mitigated by clear scope split.
- (−) WA-fallback requires admin-generated magic link round-trip. Slight UX wrinkle but rarely used.

## Operational notes

- Configure Supabase Auth: enable email provider with Resend SMTP. Enable phone provider
  with custom hook URL pointing to `/api/auth/sms-hook`.
- DLT templates required: `OTP_LOGIN`, `OTP_SIGNUP`, `OTP_VERIFY_PHONE`. 24-48h approval.
- OTP_HMAC_SECRET must be 32+ chars, rotated every 90 days.

## References

- Supabase Auth docs · https://supabase.com/docs/guides/auth
- MSG91 DLT compliance guide · https://msg91.com/in/help/dlt
- DPDP Rules 2025 § Notice and consent
