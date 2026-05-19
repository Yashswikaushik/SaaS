import { generateObject } from 'ai';
import { z } from 'zod';
import { fallbackModel, isRetryable, primaryModel } from '../provider';
import { contentHash, getCacheStore } from '../cache';

export const ColdEmailVariant = z.object({
  language: z.enum(['en', 'hi-roman', 'hi']),
  subject: z.string().min(8).max(80),
  body: z.string().min(60).max(900),
  callToAction: z.string().min(4).max(60),
});

export const ColdEmailOutput = z.object({
  variants: z.array(ColdEmailVariant).min(1).max(3),
  redFlags: z.array(z.string()).default([]),
});

export interface ColdEmailInput {
  /** Business info pulled from Lead row. PII subset only — never feed full lead object. */
  business: {
    name: string;
    category?: string;
    city?: string;
    state?: string;
    website?: string;
  };
  /** Review pain summary from Smart Reviews. Optional. */
  painSignal?: string;
  /** Sender's own value prop (≤800 chars). */
  myOffer: string;
  /** Sender name + sign-off. */
  signature: string;
  /** Output language preference. */
  language?: 'en' | 'hi-roman' | 'hi' | 'auto';
  /** Tone selector. */
  tone?: 'consultative' | 'direct' | 'curious' | 'formal';
}

const SYSTEM_PROMPT = `You are a cold-email writer for Indian B2B SMB outreach.

Write emails that:
- Open with a specific observation about the business (NOT "I hope this email finds you well").
- Tie the observation to a single quantified outcome the recipient cares about.
- Stay under 110 words for the body.
- Include exactly one clear CTA — a 10-minute call or a single yes/no question.
- Sound like a person, not a template. No buzzwords, no "synergy", no "leverage".
- Are DPDP-compliant: no implied prior relationship, no fabricated mutual connections.

For Hindi-Roman variants, use natural Roman-Hindi as Indian professionals actually write WhatsApp messages.
For pure Hindi, use Devanagari with simple, business-formal phrasing.

Flag any input that suggests fabricated PII or violates outreach norms (e.g. impersonating a real person).`;

export async function generateColdEmail(input: ColdEmailInput): Promise<z.infer<typeof ColdEmailOutput>> {
  const cacheKey = `cold-email:${contentHash(input as unknown as Record<string, unknown>)}`;
  const store = getCacheStore();
  const cached = await store.get(cacheKey);
  if (cached) {
    return ColdEmailOutput.parse(JSON.parse(cached));
  }

  const prompt = renderPrompt(input);
  let lastErr: unknown;

  for (const model of [primaryModel, fallbackModel]) {
    try {
      const { object } = await generateObject({
        model: model(),
        system: SYSTEM_PROMPT,
        schema: ColdEmailOutput,
        prompt,
        temperature: 0.7,
      });
      await store.set(cacheKey, JSON.stringify(object), 86_400 * 7);
      return object;
    } catch (err) {
      lastErr = err;
      if (!isRetryable(err)) break;
    }
  }
  throw lastErr;
}

function renderPrompt(input: ColdEmailInput): string {
  const lang = input.language ?? 'en';
  const tone = input.tone ?? 'consultative';
  return [
    `Target language: ${lang === 'auto' ? 'pick best from English / Hindi-Roman' : lang}`,
    `Tone: ${tone}`,
    `Business:`,
    `  name: ${input.business.name}`,
    `  category: ${input.business.category ?? 'unknown'}`,
    `  city/state: ${input.business.city ?? 'unknown'} / ${input.business.state ?? 'unknown'}`,
    `  website: ${input.business.website ?? 'unknown'}`,
    input.painSignal ? `Public pain signal (from reviews): ${input.painSignal}` : '',
    `My value prop: ${input.myOffer}`,
    `Signature: ${input.signature}`,
    ``,
    `Return 2 variants (one English, one Hindi-Roman) by default.`,
  ]
    .filter(Boolean)
    .join('\n');
}
