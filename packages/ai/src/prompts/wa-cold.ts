import { generateObject } from 'ai';
import { z } from 'zod';
import { contentHash, getCacheStore } from '../cache';
import { fallbackModel, isRetryable, primaryModel } from '../provider';

export const WaColdOutput = z.object({
  templateVariables: z
    .object({
      greeting: z.string().max(60),
      hook: z.string().max(180),
      cta: z.string().max(80),
    })
    .strict(),
  language: z.enum(['en', 'hi-roman', 'hi']),
});

export interface WaColdInput {
  business: { name: string; category?: string; city?: string };
  painSignal?: string;
  myOffer: string;
  templateBody: string; // approved template with {{1}} {{2}} {{3}} placeholders
  language?: 'en' | 'hi-roman' | 'hi';
}

const SYSTEM = `You generate WhatsApp template variable values that fill a pre-approved Meta
template. Follow the template's variable order and length limits. Keep it
warm-but-direct, like a founder messaging a SMB owner. No emojis unless the
template uses them. Match the user's chosen language.`;

export async function generateWaCold(input: WaColdInput): Promise<z.infer<typeof WaColdOutput>> {
  const cacheKey = `wa-cold:${contentHash(input as unknown as Record<string, unknown>)}`;
  const cache = getCacheStore();
  const hit = await cache.get(cacheKey);
  if (hit) return WaColdOutput.parse(JSON.parse(hit));

  const prompt = [
    `Template body: """${input.templateBody}"""`,
    `Business: ${input.business.name} (${input.business.category ?? 'unknown'}, ${input.business.city ?? 'unknown'})`,
    input.painSignal ? `Pain signal: ${input.painSignal}` : '',
    `My offer: ${input.myOffer}`,
    `Language: ${input.language ?? 'en'}`,
  ]
    .filter(Boolean)
    .join('\n');

  let lastErr: unknown;
  for (const m of [primaryModel, fallbackModel]) {
    try {
      const { object } = await generateObject({
        model: m(),
        system: SYSTEM,
        schema: WaColdOutput,
        prompt,
        temperature: 0.6,
      });
      await cache.set(cacheKey, JSON.stringify(object), 86_400);
      return object;
    } catch (err) {
      lastErr = err;
      if (!isRetryable(err)) break;
    }
  }
  throw lastErr;
}
