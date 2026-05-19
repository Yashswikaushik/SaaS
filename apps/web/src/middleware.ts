import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const PROTECTED_PREFIXES = ['/app'];

/**
 * Demo-mode auth bypass. Same env switch as supabase-server.ts. Never active
 * in production builds.
 */
function demoAuthActive(): boolean {
  if (process.env.NODE_ENV === 'production') return false;
  return !!process.env.DEMO_AUTH_AS_EMAIL?.trim();
}

export async function middleware(req: NextRequest): Promise<NextResponse> {
  const url = new URL(req.url);
  const needsAuth = PROTECTED_PREFIXES.some((p) => url.pathname.startsWith(p));
  if (!needsAuth) return NextResponse.next();

  if (demoAuthActive()) return NextResponse.next();

  const res = NextResponse.next();
  const sb = createServerClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
    cookies: {
      get(name) {
        return req.cookies.get(name)?.value;
      },
      set(name, value, options) {
        res.cookies.set({ name, value, ...options });
      },
      remove(name, options) {
        res.cookies.set({ name, value: '', ...options, maxAge: 0 });
      },
    },
  });
  const { data } = await sb.auth.getUser();
  if (!data.user) {
    const login = new URL('/login', req.url);
    login.searchParams.set('next', url.pathname);
    return NextResponse.redirect(login);
  }
  return res;
}

export const config = {
  matcher: ['/app/:path*'],
};
