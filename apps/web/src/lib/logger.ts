/**
 * Structured JSON logger. Never logs values that look like secrets.
 * Production: stdout JSON; consumed by Better Stack / Loki / Sentry breadcrumbs.
 */

type Level = 'debug' | 'info' | 'warn' | 'error';

const SECRET_KEYS = /^(authorization|cookie|password|token|secret|api[_-]?key|otp|code|signature)$/i;

function redact(obj: unknown): unknown {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(redact);
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    if (SECRET_KEYS.test(k)) out[k] = '[REDACTED]';
    else if (typeof v === 'object' && v !== null) out[k] = redact(v);
    else out[k] = v;
  }
  return out;
}

function emit(level: Level, message: string, ctx?: Record<string, unknown>): void {
  const line = {
    level,
    msg: message,
    ts: new Date().toISOString(),
    ...(ctx ? (redact(ctx) as Record<string, unknown>) : {}),
  };
  const fn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
  fn(JSON.stringify(line));
}

export const log = {
  debug: (msg: string, ctx?: Record<string, unknown>) => {
    if (process.env.NODE_ENV !== 'production') emit('debug', msg, ctx);
  },
  info: (msg: string, ctx?: Record<string, unknown>) => emit('info', msg, ctx),
  warn: (msg: string, ctx?: Record<string, unknown>) => emit('warn', msg, ctx),
  error: (msg: string, ctx?: Record<string, unknown>) => emit('error', msg, ctx),
};
