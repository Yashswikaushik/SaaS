import { z } from 'zod';

const BASE_URL = 'https://control.msg91.com/api/v5';
const REQUEST_TIMEOUT_MS = 8_000;

function authKey(): string {
  const k = process.env.MSG91_AUTH_KEY;
  if (!k) throw new Error('MSG91_AUTH_KEY env var is required');
  return k;
}

const OtpResponse = z.object({
  type: z.string(),
  message: z.string().optional(),
  request_id: z.string().optional(),
});

const SendResponse = z.object({
  type: z.string(),
  message: z.string().optional(),
  request_id: z.string().optional(),
});

async function fetchJson<T>(path: string, init: RequestInit, schema: z.ZodType<T>): Promise<T> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(BASE_URL + path, {
      ...init,
      headers: {
        'authkey': authKey(),
        'Content-Type': 'application/json',
        ...(init.headers ?? {}),
      },
      signal: ctrl.signal,
    });
    if (!res.ok) {
      throw new Error(`MSG91 ${path} failed: ${res.status} ${await res.text()}`);
    }
    return schema.parse(await res.json());
  } finally {
    clearTimeout(t);
  }
}

export interface SendOtpInput {
  /** E.164 without leading `+`. MSG91 wants e.g. `919876543210`. */
  mobile: string;
  /** DLT-approved template id. */
  templateId?: string;
  /** Sender id, must be DLT-registered. */
  senderId?: string;
  /** Optional explicit OTP. If not provided MSG91 generates one. */
  otp?: string;
  /** 1-120 minutes. */
  expiryMinutes?: number;
}

export async function sendOtp(input: SendOtpInput): Promise<{ requestId: string }> {
  const body = {
    template_id: input.templateId ?? process.env.MSG91_OTP_TEMPLATE_ID,
    mobile: input.mobile,
    otp: input.otp,
    otp_expiry: input.expiryMinutes ?? 10,
    sender: input.senderId ?? process.env.MSG91_SENDER_ID,
  };
  const r = await fetchJson('/otp', { method: 'POST', body: JSON.stringify(body) }, OtpResponse);
  if (r.type !== 'success') {
    throw new Error(`MSG91 sendOtp non-success: ${r.message ?? r.type}`);
  }
  return { requestId: r.request_id ?? '' };
}

export async function verifyOtp(args: { mobile: string; otp: string }): Promise<boolean> {
  const url = new URL(BASE_URL + '/otp/verify');
  url.searchParams.set('mobile', args.mobile);
  url.searchParams.set('otp', args.otp);
  const r = await fetchJson(
    url.pathname + url.search,
    { method: 'GET' },
    z.object({ type: z.string(), message: z.string().optional() }),
  );
  return r.type === 'success';
}

export interface SendSmsInput {
  templateId: string;
  recipients: Array<{ mobiles: string; [variable: string]: string }>;
  senderId?: string;
}

export async function sendSms(input: SendSmsInput): Promise<{ requestId: string }> {
  const body = {
    template_id: input.templateId,
    sender: input.senderId ?? process.env.MSG91_SENDER_ID,
    short_url: '0',
    recipients: input.recipients,
  };
  const r = await fetchJson('/flow', { method: 'POST', body: JSON.stringify(body) }, SendResponse);
  if (r.type !== 'success') {
    throw new Error(`MSG91 sendSms non-success: ${r.message ?? r.type}`);
  }
  return { requestId: r.request_id ?? '' };
}
