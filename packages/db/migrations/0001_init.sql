-- 0001_init.sql — Bharat Leads bootstrap schema.
-- Generated manually to mirror packages/db/src/schema/*.ts. Keep in lockstep.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============ Enums ============
DO $$ BEGIN
  CREATE TYPE "user_role" AS ENUM ('owner','admin','member','rep');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "locale" AS ENUM ('en-IN','hi-IN','ta-IN','te-IN','mr-IN','bn-IN','kn-IN');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "plan" AS ENUM ('free','starter','growth','scale','agency');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "plan_status" AS ENUM ('trialing','pending_first_charge','active','past_due','paused','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "lead_status" AS ENUM ('new','contacted','qualified','meeting_set','won','lost','on_hold');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "lead_source_method" AS ENUM ('geoapify_api','owner_website','user_provided','csv_import');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "message_channel" AS ENUM ('email','sms','whatsapp','call');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "message_status" AS ENUM ('queued','sent','delivered','read','failed','bounced','opted_out');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "consent_scope" AS ENUM ('essential','marketing','analytics','ai_processing');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "dsr_kind" AS ENUM ('export','erase','correct');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "dsr_status" AS ENUM ('pending','in_progress','completed','rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "billing_cycle" AS ENUM ('monthly','yearly');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "invoice_status" AS ENUM ('draft','issued','paid','void','refunded');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "otp_channel" AS ENUM ('email','sms','whatsapp');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "otp_purpose" AS ENUM ('login','signup','verify_phone','verify_email');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============ Tables ============

CREATE TABLE IF NOT EXISTS "users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "auth_id" text NOT NULL,
  "email" text NOT NULL,
  "email_verified_at" text,
  "phone" varchar(16),
  "phone_verified_at" text,
  "full_name" text,
  "locale" "locale" NOT NULL DEFAULT 'en-IN',
  "gstin" varchar(15),
  "mfa_secret_encrypted" text,
  "is_suspended" boolean NOT NULL DEFAULT false,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS "users_auth_id_uq" ON "users" ("auth_id");
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_uq" ON "users" (lower("email"));
CREATE UNIQUE INDEX IF NOT EXISTS "users_phone_uq" ON "users" ("phone") WHERE "phone" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "users_created_idx" ON "users" ("created_at");

CREATE TABLE IF NOT EXISTS "orgs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" text NOT NULL,
  "slug" text NOT NULL,
  "billing_state_code" varchar(2) NOT NULL,
  "billing_pincode" varchar(6),
  "billing_address_line1" text,
  "billing_address_line2" text,
  "billing_city" text,
  "gstin" varchar(15),
  "legal_name" text,
  "pan" varchar(10),
  "hsn_sac" varchar(8) NOT NULL DEFAULT '998314',
  "plan" "plan" NOT NULL DEFAULT 'free',
  "plan_status" "plan_status" NOT NULL DEFAULT 'trialing',
  "razorpay_customer_id" text,
  "razorpay_subscription_id" text,
  "lead_cap" integer NOT NULL DEFAULT 15,
  "monthly_renewal_cap" integer NOT NULL DEFAULT 0,
  "seat_cap" integer NOT NULL DEFAULT 1,
  "ai_emails_per_lead" integer NOT NULL DEFAULT 1,
  "reviews_per_lead" integer NOT NULL DEFAULT 10,
  "wa_messages_per_month" integer NOT NULL DEFAULT 0,
  "routes_enabled" boolean NOT NULL DEFAULT false,
  "ai_assistant_enabled" boolean NOT NULL DEFAULT false,
  "white_label_enabled" boolean NOT NULL DEFAULT false,
  "owner_user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
  "trial_ends_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS "orgs_slug_uq" ON "orgs" ("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "orgs_gstin_uq" ON "orgs" ("gstin") WHERE "gstin" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "orgs_owner_idx" ON "orgs" ("owner_user_id");

CREATE TABLE IF NOT EXISTS "org_members" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "org_id" uuid NOT NULL REFERENCES "orgs"("id") ON DELETE CASCADE,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "role" "user_role" NOT NULL DEFAULT 'member',
  "scope_polygon" text,
  "invited_by_user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "invited_at" timestamptz,
  "accepted_at" timestamptz,
  "revoked_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS "org_members_org_user_uq" ON "org_members" ("org_id","user_id");
CREATE INDEX IF NOT EXISTS "org_members_org_idx" ON "org_members" ("org_id");
CREATE INDEX IF NOT EXISTS "org_members_user_idx" ON "org_members" ("user_id");

CREATE TABLE IF NOT EXISTS "leads" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "org_id" uuid NOT NULL REFERENCES "orgs"("id") ON DELETE CASCADE,
  "owner_user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "source_url" text NOT NULL,
  "source_method" "lead_source_method" NOT NULL,
  "source_verified_at" timestamptz NOT NULL,
  "external_id" text,
  "business_name" text NOT NULL,
  "category" text,
  "lat" double precision,
  "lng" double precision,
  "address_formatted" text,
  "city" text,
  "state" text,
  "pincode" varchar(6),
  "country_code" varchar(2) NOT NULL DEFAULT 'IN',
  "contact" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "reviews" jsonb,
  "ai_review_summary" text,
  "ai_review_summary_at" timestamptz,
  "status" "lead_status" NOT NULL DEFAULT 'new',
  "is_hidden" boolean NOT NULL DEFAULT false,
  "tags" text[] NOT NULL DEFAULT '{}'::text[],
  "custom_fields" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "last_contacted_at" timestamptz,
  "notes_count" integer NOT NULL DEFAULT 0,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz
);
CREATE INDEX IF NOT EXISTS "leads_org_created_idx" ON "leads" ("org_id","created_at" DESC);
CREATE INDEX IF NOT EXISTS "leads_org_status_idx" ON "leads" ("org_id","status");
CREATE INDEX IF NOT EXISTS "leads_org_owner_idx" ON "leads" ("org_id","owner_user_id");
CREATE INDEX IF NOT EXISTS "leads_geo_idx" ON "leads" ("lat","lng");
CREATE UNIQUE INDEX IF NOT EXISTS "leads_external_id_uq" ON "leads" ("org_id","source_method","external_id")
  WHERE "external_id" IS NOT NULL;

CREATE TABLE IF NOT EXISTS "lead_notes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "lead_id" uuid NOT NULL REFERENCES "leads"("id") ON DELETE CASCADE,
  "author_user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "body" text NOT NULL,
  "voice_url" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz
);
CREATE INDEX IF NOT EXISTS "lead_notes_lead_idx" ON "lead_notes" ("lead_id","created_at" DESC);

CREATE TABLE IF NOT EXISTS "lead_messages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "org_id" uuid NOT NULL REFERENCES "orgs"("id") ON DELETE CASCADE,
  "lead_id" uuid NOT NULL REFERENCES "leads"("id") ON DELETE CASCADE,
  "sender_user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "channel" "message_channel" NOT NULL,
  "direction" text NOT NULL DEFAULT 'outbound',
  "status" "message_status" NOT NULL DEFAULT 'queued',
  "to_address" text NOT NULL,
  "subject" text,
  "body" text NOT NULL,
  "ai_generated" text,
  "consent_snapshot" jsonb NOT NULL,
  "provider_message_id" text,
  "template_name" text,
  "attempts" integer NOT NULL DEFAULT 0,
  "last_error" text,
  "sent_at" timestamptz,
  "delivered_at" timestamptz,
  "read_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz
);
CREATE INDEX IF NOT EXISTS "lead_messages_org_idx" ON "lead_messages" ("org_id","created_at" DESC);
CREATE INDEX IF NOT EXISTS "lead_messages_lead_idx" ON "lead_messages" ("lead_id","created_at" DESC);
CREATE INDEX IF NOT EXISTS "lead_messages_provider_idx" ON "lead_messages" ("provider_message_id")
  WHERE "provider_message_id" IS NOT NULL;

CREATE TABLE IF NOT EXISTS "wa_templates" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "org_id" uuid REFERENCES "orgs"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "category" text NOT NULL,
  "language" text NOT NULL DEFAULT 'en',
  "body" text NOT NULL,
  "status" text NOT NULL DEFAULT 'PENDING',
  "meta_template_id" text,
  "submitted_at" timestamptz,
  "approved_at" timestamptz,
  "rejected_at" timestamptz,
  "rejection_reason" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz
);
CREATE INDEX IF NOT EXISTS "wa_templates_name_lang_idx" ON "wa_templates" ("name","language");

CREATE TABLE IF NOT EXISTS "consents" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "scope" "consent_scope" NOT NULL,
  "granted" boolean NOT NULL,
  "granted_at" timestamptz NOT NULL,
  "ip_hash" varchar(64) NOT NULL,
  "user_agent" text NOT NULL,
  "notice_version" varchar(16) NOT NULL,
  "source" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz
);
CREATE INDEX IF NOT EXISTS "consents_user_scope_idx" ON "consents" ("user_id","scope","granted_at" DESC);

CREATE TABLE IF NOT EXISTS "legal_notices" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "kind" text NOT NULL,
  "version" varchar(16) NOT NULL,
  "locale" text NOT NULL,
  "body" text NOT NULL,
  "effective_at" timestamptz NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS "legal_notices_kind_version_locale_uq" ON "legal_notices" ("kind","version","locale");

CREATE TABLE IF NOT EXISTS "dsr_requests" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "kind" "dsr_kind" NOT NULL,
  "status" "dsr_status" NOT NULL DEFAULT 'pending',
  "payload" jsonb,
  "completed_at" timestamptz,
  "purge_at" timestamptz,
  "artifact_url" text,
  "rejection_reason" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz
);
CREATE INDEX IF NOT EXISTS "dsr_requests_user_idx" ON "dsr_requests" ("user_id","created_at" DESC);
CREATE INDEX IF NOT EXISTS "dsr_requests_purge_idx" ON "dsr_requests" ("purge_at") WHERE "purge_at" IS NOT NULL;

CREATE TABLE IF NOT EXISTS "audit_log" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "actor_user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "actor_service" text,
  "action" text NOT NULL,
  "target" text NOT NULL,
  "payload" jsonb,
  "ip_hash" varchar(64),
  "user_agent" text,
  "occurred_at" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "audit_log_actor_idx" ON "audit_log" ("actor_user_id","occurred_at" DESC);
CREATE INDEX IF NOT EXISTS "audit_log_target_idx" ON "audit_log" ("target","occurred_at" DESC);
CREATE INDEX IF NOT EXISTS "audit_log_action_idx" ON "audit_log" ("action","occurred_at" DESC);

CREATE TABLE IF NOT EXISTS "subscriptions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "org_id" uuid NOT NULL REFERENCES "orgs"("id") ON DELETE CASCADE,
  "plan" "plan" NOT NULL,
  "cycle" "billing_cycle" NOT NULL,
  "razorpay_subscription_id" text NOT NULL,
  "razorpay_plan_id" text NOT NULL,
  "razorpay_customer_id" text,
  "status" text NOT NULL DEFAULT 'created',
  "amount_paise" bigint NOT NULL,
  "current_start" timestamptz,
  "current_end" timestamptz,
  "charge_at" timestamptz,
  "cancelled_at" timestamptz,
  "cancel_at_cycle_end" boolean NOT NULL DEFAULT false,
  "notes" jsonb,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz
);
CREATE INDEX IF NOT EXISTS "subscriptions_org_idx" ON "subscriptions" ("org_id","created_at" DESC);
CREATE UNIQUE INDEX IF NOT EXISTS "subscriptions_rzp_sub_uq" ON "subscriptions" ("razorpay_subscription_id");

CREATE TABLE IF NOT EXISTS "invoices" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "org_id" uuid NOT NULL REFERENCES "orgs"("id") ON DELETE RESTRICT,
  "subscription_id" uuid REFERENCES "subscriptions"("id") ON DELETE SET NULL,
  "invoice_no" text NOT NULL,
  "fiscal_year" varchar(7) NOT NULL,
  "issued_at" timestamptz NOT NULL,
  "supplier" jsonb NOT NULL,
  "recipient" jsonb NOT NULL,
  "place_of_supply_code" varchar(2) NOT NULL,
  "hsn_sac" varchar(8) NOT NULL,
  "description" text NOT NULL,
  "taxable_amount_paise" bigint NOT NULL,
  "cgst_paise" bigint NOT NULL DEFAULT 0,
  "sgst_paise" bigint NOT NULL DEFAULT 0,
  "igst_paise" bigint NOT NULL DEFAULT 0,
  "cess_paise" bigint NOT NULL DEFAULT 0,
  "total_paise" bigint NOT NULL,
  "status" "invoice_status" NOT NULL DEFAULT 'draft',
  "razorpay_payment_id" text,
  "razorpay_invoice_id" text,
  "pdf_url" text,
  "irn" text,
  "irp_uploaded_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS "invoices_invoice_no_uq" ON "invoices" ("invoice_no");
CREATE INDEX IF NOT EXISTS "invoices_org_issued_idx" ON "invoices" ("org_id","issued_at" DESC);
CREATE INDEX IF NOT EXISTS "invoices_fy_idx" ON "invoices" ("fiscal_year");

CREATE TABLE IF NOT EXISTS "razorpay_processed_events" (
  "event_id" text PRIMARY KEY,
  "event_type" text NOT NULL,
  "processed_at" timestamptz NOT NULL DEFAULT now(),
  "payload_hash" varchar(64) NOT NULL
);
CREATE INDEX IF NOT EXISTS "rzp_events_processed_idx" ON "razorpay_processed_events" ("processed_at" DESC);

CREATE TABLE IF NOT EXISTS "otp_codes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "identity" text NOT NULL,
  "channel" "otp_channel" NOT NULL,
  "purpose" "otp_purpose" NOT NULL,
  "code_hash" varchar(64) NOT NULL,
  "attempt" integer NOT NULL DEFAULT 0,
  "max_attempts" integer NOT NULL DEFAULT 5,
  "expires_at" timestamptz NOT NULL,
  "consumed_at" timestamptz,
  "provider_request_id" text,
  "ip_hash" varchar(64) NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz
);
CREATE INDEX IF NOT EXISTS "otp_identity_created_idx" ON "otp_codes" ("identity","created_at" DESC);
CREATE INDEX IF NOT EXISTS "otp_expires_idx" ON "otp_codes" ("expires_at") WHERE "consumed_at" IS NULL;

CREATE TABLE IF NOT EXISTS "territories" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "org_id" uuid NOT NULL REFERENCES "orgs"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "description" text,
  "polygon" jsonb NOT NULL,
  "assigned_user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "color" text NOT NULL DEFAULT '#3b82f6',
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz
);
CREATE INDEX IF NOT EXISTS "territories_org_idx" ON "territories" ("org_id");
CREATE INDEX IF NOT EXISTS "territories_assigned_idx" ON "territories" ("assigned_user_id");

-- ============ Row-Level Security ============
-- Tenant isolation. Every org-scoped table enforces org_id = current_setting('app.current_org_id').

ALTER TABLE "leads" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "lead_notes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "lead_messages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "territories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "invoices" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "subscriptions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "org_members" ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "leads_tenant" ON "leads" USING (org_id::text = current_setting('app.current_org_id', true));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "lead_notes_tenant" ON "lead_notes" USING (
    EXISTS (SELECT 1 FROM leads l WHERE l.id = "lead_notes".lead_id AND l.org_id::text = current_setting('app.current_org_id', true))
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "lead_messages_tenant" ON "lead_messages" USING (org_id::text = current_setting('app.current_org_id', true));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "territories_tenant" ON "territories" USING (org_id::text = current_setting('app.current_org_id', true));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "invoices_tenant" ON "invoices" USING (org_id::text = current_setting('app.current_org_id', true));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "subscriptions_tenant" ON "subscriptions" USING (org_id::text = current_setting('app.current_org_id', true));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "org_members_tenant" ON "org_members" USING (org_id::text = current_setting('app.current_org_id', true));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
