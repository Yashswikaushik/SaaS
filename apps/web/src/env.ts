import { z } from 'zod';

/**
 * Runtime-validated environment. Importing this from a server module guarantees
 * the variables are set OR fails fast at boot. Never import in client code —
 * use `clientEnv` for public values.
 */

const ServerEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  NEXT_PUBLIC_APP_URL: z.string().url(),

  DATABASE_URL: z.string().url(),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(20),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),

  REDIS_URL: z.string().url().optional(),

  RAZORPAY_KEY_ID: z.string().min(10),
  RAZORPAY_KEY_SECRET: z.string().min(10),
  RAZORPAY_WEBHOOK_SECRET: z.string().min(10),

  MSG91_AUTH_KEY: z.string().min(20),
  MSG91_OTP_TEMPLATE_ID: z.string().min(5),
  MSG91_SENDER_ID: z.string().min(3).max(6),

  AISENSY_API_KEY: z.string().min(20),
  AISENSY_WEBHOOK_TOKEN: z.string().min(20),
  AISENSY_OTP_CAMPAIGN: z.string().default('otp_fallback'),

  ANTHROPIC_API_KEY: z.string().min(20),
  OPENAI_API_KEY: z.string().min(20),

  GEOAPIFY_API_KEY: z.string().min(20),

  RESEND_API_KEY: z.string().min(10),
  EMAIL_FROM: z.string().email(),

  ORG_BILLING_STATE_CODE: z.string().regex(/^\d{2}$/).default('29'),
  IP_HASH_SALT: z.string().min(16),
  OTP_HMAC_SECRET: z.string().min(32),

  SENTRY_DSN: z.string().url().optional(),
});

export type ServerEnv = z.infer<typeof ServerEnvSchema>;

let _env: ServerEnv | null = null;

export function env(): ServerEnv {
  if (!_env) {
    const result = ServerEnvSchema.safeParse(process.env);
    if (!result.success) {
      const issues = result.error.issues
        .map((i) => `  ${i.path.join('.')}: ${i.message}`)
        .join('\n');
      // Don't print values — only field names — to avoid leaking secrets in logs.
      throw new Error(`Invalid environment configuration:\n${issues}`);
    }
    _env = result.data;
  }
  return _env;
}

export interface ClientEnv {
  appUrl: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  razorpayKeyId: string;
  posthogKey?: string;
  posthogHost?: string;
}

export function clientEnv(): ClientEnv {
  return {
    appUrl: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
    supabaseUrl: process.env.SUPABASE_URL ?? '',
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY ?? '',
    razorpayKeyId: process.env.RAZORPAY_KEY_ID ?? '',
    posthogKey: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    posthogHost: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  };
}
