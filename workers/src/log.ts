/** Reuse logger pattern from web — duplicated to avoid coupling workers to Next. */
const SECRETS = /^(authorization|cookie|password|token|secret|api[_-]?key|otp|code|signature)$/i;

function redact(o: unknown): unknown {
  if (!o || typeof o !== 'object') return o;
  if (Array.isArray(o)) return o.map(redact);
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(o as Record<string, unknown>)) {
    out[k] = SECRETS.test(k) ? '[REDACTED]' : redact(v);
  }
  return out;
}

export const log = {
  info: (msg: string, ctx?: Record<string, unknown>) =>
    console.log(JSON.stringify({ level: 'info', msg, ts: new Date().toISOString(), ...(redact(ctx ?? {}) as object) })),
  warn: (msg: string, ctx?: Record<string, unknown>) =>
    console.warn(JSON.stringify({ level: 'warn', msg, ts: new Date().toISOString(), ...(redact(ctx ?? {}) as object) })),
  error: (msg: string, ctx?: Record<string, unknown>) =>
    console.error(JSON.stringify({ level: 'error', msg, ts: new Date().toISOString(), ...(redact(ctx ?? {}) as object) })),
};
