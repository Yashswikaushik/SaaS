import { anthropic } from '@ai-sdk/anthropic';
import { openai } from '@ai-sdk/openai';

export const MODELS = {
  primary: 'claude-sonnet-4-6',
  fallback: 'gpt-4.1-mini',
} as const;

export const primaryModel = () => anthropic(MODELS.primary);
export const fallbackModel = () => openai(MODELS.fallback);

export interface AiError {
  retryable: boolean;
  cause: unknown;
}

/** Returns true if error suggests a transient/retryable provider failure. */
export function isRetryable(err: unknown): boolean {
  const e = err as { status?: number; code?: string; name?: string } | undefined;
  if (!e) return false;
  if (e.status && [408, 429, 500, 502, 503, 504].includes(e.status)) return true;
  if (e.code === 'ETIMEDOUT' || e.code === 'ECONNRESET') return true;
  return false;
}
