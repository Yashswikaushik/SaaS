import { describe, expect, it } from 'vitest';
import { hashIp } from './audit';

describe('audit hashing', () => {
  it('produces stable 64-char hex for the same IP+salt', () => {
    const a = hashIp('203.0.113.42');
    const b = hashIp('203.0.113.42');
    expect(a).toBe(b);
    expect(a).toMatch(/^[a-f0-9]{64}$/);
  });

  it('differs for different IPs', () => {
    expect(hashIp('203.0.113.42')).not.toBe(hashIp('203.0.113.43'));
  });
});
