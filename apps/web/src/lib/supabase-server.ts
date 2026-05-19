import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { env } from '@/env';

export function supabaseServer() {
  const cookieStore = cookies();
  return createServerClient(env().SUPABASE_URL, env().SUPABASE_ANON_KEY, {
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
}

/** Service-role client for privileged server tasks. Never expose to client. */
export function supabaseAdmin() {
  return createServerClient(env().SUPABASE_URL, env().SUPABASE_SERVICE_ROLE_KEY, {
    cookies: { get: () => undefined, set: () => undefined, remove: () => undefined },
  });
}
