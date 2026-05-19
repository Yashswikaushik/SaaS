#!/usr/bin/env tsx
import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const OUT = path.resolve('docs/screenshots');

const SHOTS = [
  { path: '/', name: 'landing-hero', viewport: { width: 1440, height: 900 } },
  { path: '/', name: 'landing-full', viewport: { width: 1440, height: 900 }, fullPage: true },
  { path: '/pricing', name: 'pricing', viewport: { width: 1440, height: 900 }, fullPage: true },
  { path: '/vs/leadsquared', name: 'vs-leadsquared', viewport: { width: 1440, height: 900 }, fullPage: true },
  { path: '/legal/privacy', name: 'legal-privacy', viewport: { width: 1440, height: 900 }, fullPage: true },
  { path: '/login', name: 'login', viewport: { width: 1440, height: 900 } },
  { path: '/signup', name: 'signup', viewport: { width: 1440, height: 900 } },
  // Mobile
  { path: '/', name: 'landing-mobile', viewport: { width: 390, height: 844 }, fullPage: true },
  { path: '/pricing', name: 'pricing-mobile', viewport: { width: 390, height: 844 }, fullPage: true },
] as const;

async function main() {
  await fs.mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();
  for (const s of SHOTS) {
    const ctx = await browser.newContext({ viewport: s.viewport, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    page.on('pageerror', (e) => console.error(`[${s.name}] pageerror:`, e.message));
    const res = await page.goto(`${BASE}${s.path}`, { waitUntil: 'networkidle', timeout: 30_000 });
    if (!res || !res.ok()) {
      console.error(`[${s.name}] status ${res?.status()} for ${s.path}`);
    }
    // Dismiss cookie banner if present so it doesn't cover the page
    const banner = page.getByRole('button', { name: /Accept all|Essential only/i }).first();
    if (await banner.isVisible().catch(() => false)) {
      await banner.click();
      await page.waitForTimeout(300);
    }
    const file = path.join(OUT, `${s.name}.png`);
    await page.screenshot({ path: file, fullPage: 'fullPage' in s ? s.fullPage : false });
    console.log(`✓ ${file}`);
    await ctx.close();
  }
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
