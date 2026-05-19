import { generateObject } from 'ai';
import { z } from 'zod';
import { contentHash, getCacheStore } from '../cache';
import { fallbackModel, isRetryable, primaryModel } from '../provider';

export const ReviewSummary = z.object({
  themes: z.array(z.object({ label: z.string(), severity: z.enum(['low', 'medium', 'high']) })).max(8),
  topPains: z.array(z.string()).max(5),
  topStrengths: z.array(z.string()).max(5),
  /** One-paragraph elevator-pitch hook, ≤320 chars. */
  outreachAngle: z.string().max(320),
  /** Confidence 0-100. */
  confidence: z.number().int().min(0).max(100),
});

export interface ReviewSummaryInput {
  businessName: string;
  rating?: number;
  reviewCount?: number;
  snippets: Array<{ text: string; rating?: number; date?: string }>;
}

const SYSTEM = `You analyze public business reviews and surface specific, actionable pain
themes for B2B outreach. Be conservative: never invent facts not in the snippets.
If snippets are too few or vague, lower the confidence number.`;

export async function summarizeReviews(input: ReviewSummaryInput): Promise<z.infer<typeof ReviewSummary>> {
  const cacheKey = `review-summary:${contentHash({
    name: input.businessName,
    rating: input.rating,
    count: input.reviewCount,
    snippets: input.snippets.map((s) => s.text),
  })}`;
  const store = getCacheStore();
  const cached = await store.get(cacheKey);
  if (cached) return ReviewSummary.parse(JSON.parse(cached));

  if (!input.snippets.length) {
    const empty: z.infer<typeof ReviewSummary> = {
      themes: [],
      topPains: [],
      topStrengths: [],
      outreachAngle: '',
      confidence: 0,
    };
    return empty;
  }

  const prompt = [
    `Business: ${input.businessName}`,
    `Aggregate rating: ${input.rating ?? 'unknown'} from ${input.reviewCount ?? 'unknown'} reviews`,
    `Snippets:`,
    ...input.snippets.slice(0, 30).map((s, i) => `  ${i + 1}. (${s.rating ?? '?'}★) ${s.text}`),
  ].join('\n');

  let lastErr: unknown;
  for (const m of [primaryModel, fallbackModel]) {
    try {
      const { object } = await generateObject({
        model: m(),
        system: SYSTEM,
        schema: ReviewSummary,
        prompt,
        temperature: 0.3,
      });
      await store.set(cacheKey, JSON.stringify(object), 86_400 * 30);
      return object;
    } catch (err) {
      lastErr = err;
      if (!isRetryable(err)) break;
    }
  }
  throw lastErr;
}
