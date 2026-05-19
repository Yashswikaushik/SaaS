#!/usr/bin/env tsx
import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const OUT = path.resolve('docs/screenshots');

interface Shot {
  path: string;
  name: string;
  viewport: { width: number; height: number };
  fullPage?: boolean;
  waitForSelector?: string;
}

const SHOTS: Shot[] = [
  {
    path: '/app',
    name: 'app-dashboard',
    viewport: { width: 1440, height: 900 },
    waitForSelector: 'h1:has-text("Pipeline today")',
  },
  {
    path: '/app/leads',
    name: 'app-leads',
    viewport: { width: 1440, height: 900 },
    fullPage: true,
    waitForSelector: 'h1:has-text("Leads")',
  },
  {
    path: '/app/billing',
    name: 'app-billing',
    viewport: { width: 1440, height: 900 },
    fullPage: true,
    waitForSelector: 'h1:has-text("Billing")',
  },
  {
    path: '/app/privacy',
    name: 'app-privacy',
    viewport: { width: 1440, height: 900 },
    fullPage: true,
    waitForSelector: 'h1:has-text("Privacy")',
  },
  {
    path: '/app/team',
    name: 'app-team',
    viewport: { width: 1440, height: 900 },
    fullPage: true,
    waitForSelector: 'h1:has-text("Team")',
  },
  {
    path: '/app/settings',
    name: 'app-settings',
    viewport: { width: 1440, height: 900 },
    waitForSelector: 'h1:has-text("Settings")',
  },
];

async function main() {
  await fs.mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();
  for (const s of SHOTS) {
    const ctx = await browser.newContext({ viewport: s.viewport, deviceScaleFactor: 2 });
    await ctx.addCookies([
      { name: 'org_slug', value: 'demo', domain: 'localhost', path: '/', sameSite: 'Lax' },
    ]);
    const page = await ctx.newPage();
    page.on('pageerror', (e) => console.error(`[${s.name}] pageerror:`, e.message));
    page.on('console', (m) => {
      if (m.type() === 'error') console.error(`[${s.name}] console:`, m.text());
    });
    try {
      const res = await page.goto(`${BASE}${s.path}`, { waitUntil: 'networkidle', timeout: 30_000 });
      if (!res || !res.ok()) console.error(`[${s.name}] http ${res?.status()}`);
      if (s.waitForSelector) {
        await page.waitForSelector(s.waitForSelector, { timeout: 10_000 }).catch(() => {
          console.warn(`[${s.name}] selector wait timed out — proceeding to shoot anyway`);
        });
      }
      // Give the page extra time to settle (tRPC fetches, hydration)
      await page.waitForLoadState('networkidle', { timeout: 8_000 }).catch(() => undefined);
      // Dismiss cookie banner if present
      const banner = page.getByRole('button', { name: /Accept all|Essential only/i }).first();
      if (await banner.isVisible().catch(() => false)) {
        await banner.click();
        await page.waitForTimeout(300);
      }
      await page.waitForTimeout(500);
      const file = path.join(OUT, `${s.name}.png`);
      await page.screenshot({ path: file, fullPage: !!s.fullPage });
      console.log(`✓ ${file}`);
    } catch (err) {
      console.error(`[${s.name}] FAILED:`, (err as Error).message);
    }
    await ctx.close();
  }
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
