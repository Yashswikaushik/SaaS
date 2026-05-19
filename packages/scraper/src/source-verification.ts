/**
 * Source verification per DPDP §3(c)(ii). Only persist enrichment data
 * extracted from a business's *own* website OR a license-clean public API.
 *
 * This module verifies a candidate URL truly belongs to a given business by
 * checking the page's canonical link AND its schema.org LocalBusiness JSON-LD.
 *
 * It is intentionally *strict*: when in doubt, reject. Better to lose data
 * than to persist a personal contact under a non-verifiable provenance.
 */

import { z } from 'zod';

const FETCH_TIMEOUT_MS = 8_000;
const MAX_BYTES = 1_500_000;

const SchemaLocalBusiness = z.object({
  '@type': z.union([z.literal('LocalBusiness'), z.literal('Organization'), z.string()]),
  name: z.string().optional(),
  url: z.string().url().optional(),
});

export interface VerifyOwnerSourceInput {
  candidateUrl: string;
  expectedBusinessName: string;
}

export interface VerifyOwnerSourceResult {
  verified: boolean;
  canonicalUrl?: string;
  reason?: string;
}

export async function verifyOwnerSource(input: VerifyOwnerSourceInput): Promise<VerifyOwnerSourceResult> {
  let url: URL;
  try {
    url = new URL(input.candidateUrl);
  } catch {
    return { verified: false, reason: 'invalid URL' };
  }
  if (!/^https?:$/.test(url.protocol)) {
    return { verified: false, reason: 'non-http(s)' };
  }

  const robotsOk = await checkRobots(url);
  if (!robotsOk) return { verified: false, reason: 'robots.txt disallow' };

  let html: string;
  try {
    html = await fetchLimited(url.toString());
  } catch (err) {
    return { verified: false, reason: `fetch error: ${(err as Error).message}` };
  }

  const canonical = extractCanonical(html, url);
  if (canonical && new URL(canonical).hostname !== url.hostname) {
    return { verified: false, reason: 'canonical hostname mismatch' };
  }

  const jsonLd = extractJsonLdBusinesses(html);
  const expected = input.expectedBusinessName.toLowerCase();
  const nameMatch = jsonLd.some(
    (b) => b.name && b.name.toLowerCase().includes(expected.slice(0, Math.min(expected.length, 20))),
  );

  if (!nameMatch) {
    return { verified: false, reason: 'no schema.org LocalBusiness name match' };
  }

  return { verified: true, canonicalUrl: canonical ?? url.toString() };
}

async function fetchLimited(url: string): Promise<string> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'BharatLeads/1.0 (+contact: hello@bharatleads.in)' },
      redirect: 'follow',
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`http ${res.status}`);
    const reader = res.body?.getReader();
    if (!reader) return await res.text();
    const decoder = new TextDecoder();
    let total = 0;
    let out = '';
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_BYTES) break;
      out += decoder.decode(value, { stream: true });
    }
    out += decoder.decode();
    return out;
  } finally {
    clearTimeout(t);
  }
}

async function checkRobots(url: URL): Promise<boolean> {
  try {
    const r = await fetch(`${url.protocol}//${url.host}/robots.txt`, {
      headers: { 'User-Agent': 'BharatLeads/1.0' },
      redirect: 'follow',
    });
    if (!r.ok) return true; // fail-open: absent robots is allowed
    const txt = await r.text();
    return !hasDisallow(txt, '/');
  } catch {
    return true;
  }
}

function hasDisallow(robotsTxt: string, path: string): boolean {
  // Very conservative parser: walks UA blocks, checks Disallow lines.
  let active = false;
  for (const line of robotsTxt.split(/\r?\n/)) {
    const m = line.trim();
    if (!m || m.startsWith('#')) continue;
    const [k, ...rest] = m.split(':');
    const v = rest.join(':').trim();
    if (k && k.toLowerCase() === 'user-agent') {
      active = v === '*' || /bharatleads/i.test(v);
    } else if (active && k && k.toLowerCase() === 'disallow') {
      if (v === '/' || (v.length > 0 && path.startsWith(v))) return true;
    }
  }
  return false;
}

function extractCanonical(html: string, base: URL): string | undefined {
  const m = html.match(/<link[^>]+rel=["']?canonical["']?[^>]+href=["']([^"']+)["']/i);
  if (!m) return undefined;
  try {
    return new URL(m[1]!, base).toString();
  } catch {
    return undefined;
  }
}

function extractJsonLdBusinesses(html: string): Array<z.infer<typeof SchemaLocalBusiness>> {
  const out: Array<z.infer<typeof SchemaLocalBusiness>> = [];
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html))) {
    try {
      const parsed = JSON.parse(match[1] ?? '{}') as unknown;
      const candidates = Array.isArray(parsed) ? parsed : [parsed];
      for (const c of candidates) {
        const r = SchemaLocalBusiness.safeParse(c);
        if (r.success) out.push(r.data);
      }
    } catch {
      // ignore malformed JSON-LD blocks
    }
  }
  return out;
}
