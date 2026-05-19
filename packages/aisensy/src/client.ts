import { z } from 'zod';

const BASE = 'https://backend.aisensy.com';
const REQUEST_TIMEOUT_MS = 8_000;

function apiKey(): string {
  const k = process.env.AISENSY_API_KEY;
  if (!k) throw new Error('AISENSY_API_KEY env var is required');
  return k;
}

const SendResponse = z
  .object({
    success: z.boolean(),
    message: z.string().optional(),
    data: z.record(z.unknown()).optional(),
  })
  .passthrough();

export interface SendTemplateInput {
  /** E.164 phone with leading +. */
  to: string;
  /** AiSensy campaign name (template alias). */
  campaignName: string;
  /** Recipient name shown in template head. */
  userName?: string;
  /** Template variable substitutions, in order. */
  variables?: string[];
  /** Media url for image/video/document templates. */
  media?: { url: string; filename?: string };
  /** Tags for AiSensy analytics. */
  tags?: string[];
  /** Custom attributes carried through delivery webhook. */
  attributes?: Record<string, string>;
}

export async function sendTemplate(input: SendTemplateInput): Promise<{ messageId: string }> {
  const body: Record<string, unknown> = {
    apiKey: apiKey(),
    campaignName: input.campaignName,
    destination: stripPlus(input.to),
    userName: input.userName ?? '',
    templateParams: input.variables ?? [],
    tags: input.tags ?? [],
    attributes: input.attributes ?? {},
  };
  if (input.media) {
    body.media = input.media;
  }

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE}/campaign/t1/api/v2`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    if (!res.ok) {
      throw new Error(`AiSensy sendTemplate failed: ${res.status} ${await res.text()}`);
    }
    const parsed = SendResponse.parse(await res.json());
    if (!parsed.success) {
      throw new Error(`AiSensy sendTemplate non-success: ${parsed.message ?? 'unknown'}`);
    }
    const messageId = String((parsed.data?.messageId ?? '') || '');
    return { messageId };
  } finally {
    clearTimeout(t);
  }
}

function stripPlus(phone: string): string {
  return phone.startsWith('+') ? phone.slice(1) : phone;
}

/** Coarse cost estimator per Jan 2026 India rates. */
export function estimateBroadcastCostPaise(
  recipients: number,
  templateCategory: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION',
): number {
  const perMsg = templateCategory === 'MARKETING' ? 86 : 12; // paise
  return recipients * perMsg;
}
