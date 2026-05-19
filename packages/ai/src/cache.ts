import { createHash } from 'node:crypto';

/**
 * Content-addressed cache abstraction. Implementations:
 *   - In-memory (default, useful for tests)
 *   - Redis (production)
 *
 * Key derivation is a SHA-256 of the canonicalized input — caller picks the inputs.
 */

export interface CacheStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds: number): Promise<void>;
}

export function contentHash(input: Record<string, unknown>): string {
  const canonical = JSON.stringify(input, Object.keys(input).sort());
  return createHash('sha256').update(canonical).digest('hex');
}

class MemoryStore implements CacheStore {
  private map = new Map<string, { value: string; expiresAt: number }>();
  async get(key: string) {
    const v = this.map.get(key);
    if (!v) return null;
    if (v.expiresAt < Date.now()) {
      this.map.delete(key);
      return null;
    }
    return v.value;
  }
  async set(key: string, value: string, ttlSeconds: number) {
    this.map.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1_000 });
  }
}

let _store: CacheStore = new MemoryStore();
export function setCacheStore(s: CacheStore): void {
  _store = s;
}
export function getCacheStore(): CacheStore {
  return _store;
}
