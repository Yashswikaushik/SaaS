import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { env } from '@/env';

/**
 * Demo / E2E auth shim. When `DEMO_AUTH_AS_EMAIL` is set, all server-side
 * Supabase auth calls return a synthetic user mapped from that email.
 *
 * Refused in production:  the shim is a no-op if NODE_ENV === 'production'
 * to prevent accidental session-bypass on prod.
 */
function demoAuthEmail(): string | null {
  if (process.env.NODE_ENV === 'production') return null;
  const e = process.env.DEMO_AUTH_AS_EMAIL?.trim();
  return e && e.length > 3 ? e : null;
}

const DEMO_AUTH_ID = 'seed:founder';

type SupabaseLike = ReturnType<typeof createServerClient>;

function withDemoOverride(client: SupabaseLike, demoEmail: string): SupabaseLike {
  const originalAuth = client.auth;
  return new Proxy(client, {
    get(target, prop, receiver) {
      if (prop === 'auth') {
        return new Proxy(originalAuth, {
          get(authTarget, authProp, authReceiver) {
            if (authProp === 'getUser') {
              return async () => ({
                data: {
                  user: {
                    id: DEMO_AUTH_ID,
                    email: demoEmail,
                    aud: 'authenticated',
                    role: 'authenticated',
                    app_metadata: {},
                    user_metadata: { full_name: 'Founder' },
                    email_confirmed_at: new Date(0).toISOString(),
                    phone_confirmed_at: null,
                    created_at: new Date(0).toISOString(),
                    updated_at: new Date(0).toISOString(),
                    confirmed_at: new Date(0).toISOString(),
                    last_sign_in_at: new Date().toISOString(),
                    identities: [],
                    factors: [],
                  },
                },
                error: null,
              });
            }
            return Reflect.get(authTarget, authProp, authReceiver);
          },
        });
      }
      return Reflect.get(target, prop, receiver);
    },
  });
}

export function supabaseServer(): SupabaseLike {
  const cookieStore = cookies();
  const client = createServerClient(env().SUPABASE_URL, env().SUPABASE_ANON_KEY, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          /* edge runtime: ignore */
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: '', ...options, maxAge: 0 });
        } catch {
          /* edge runtime: ignore */
        }
      },
    },
    cookieOptions: {
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      path: '/',
    },
  });

  const demo = demoAuthEmail();
  if (demo) return withDemoOverride(client, demo);
  return client;
}

/** Service-role client for privileged server tasks. Never expose to client. */
export function supabaseAdmin(): SupabaseLike {
  return createServerClient(env().SUPABASE_URL, env().SUPABASE_SERVICE_ROLE_KEY, {
    cookies: { get: () => undefined, set: () => undefined, remove: () => undefined },
  });
}
