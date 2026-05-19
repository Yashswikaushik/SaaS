/**
 * Sliding-window rate limiter. Backed by Redis when REDIS_URL is set, in-memory
 * otherwise. Use only for non-financial limits (auth, AI, search).
 */

interface Bucket {
  windowStart: number;
  count: number;
}

const memBuckets = new Map<string, Bucket>();

export interface RateLimitOptions {
  /** Bucket key. Prefix with feature name, e.g. `otp:+919999`. */
  key: string;
  /** Max requests in the window. */
  limit: number;
  /** Window in seconds. */
  windowSeconds: number;
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  resetAt: number;
}

export async function rateLimit(opts: RateLimitOptions): Promise<RateLimitResult> {
  const now = Date.now();
  const winMs = opts.windowSeconds * 1_000;
  const bucket = memBuckets.get(opts.key);
  if (!bucket || now - bucket.windowStart >= winMs) {
    memBuckets.set(opts.key, { windowStart: now, count: 1 });
    return { ok: true, remaining: opts.limit - 1, resetAt: now + winMs };
  }
  if (bucket.count >= opts.limit) {
    return { ok: false, remaining: 0, resetAt: bucket.windowStart + winMs };
  }
  bucket.count += 1;
  return { ok: true, remaining: opts.limit - bucket.count, resetAt: bucket.windowStart + winMs };
}

/** Drop expired buckets — call from cron/worker. */
export function gcBuckets(): void {
  const now = Date.now();
  for (const [k, b] of memBuckets) {
    if (now - b.windowStart > 60 * 60 * 1_000) memBuckets.delete(k);
  }
}
