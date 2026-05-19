#!/usr/bin/env tsx
/**
 * Local-dev seed script. Inserts a sample org + owner + a couple of leads so the
 * UI is not empty on first run. Idempotent — safe to re-run.
 *
 * Usage:
 *   DATABASE_URL=postgres://… pnpm tsx scripts/seed.ts
 */

import { eq } from 'drizzle-orm';
import { closeDb, db, leads, orgMembers, orgs, users } from '@bharat/db';

async function main() {
  const email = 'founder@bharatleads.in';
  const [existingUser] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const userId = existingUser
    ? existingUser.id
    : (
        await db
          .insert(users)
          .values({
            authId: 'seed:founder',
            email,
            fullName: 'Founder',
            phone: '+919999999999',
            locale: 'en-IN',
          })
          .returning({ id: users.id })
      )[0]!.id;

  const [existingOrg] = await db.select().from(orgs).where(eq(orgs.slug, 'demo')).limit(1);
  const orgId = existingOrg
    ? existingOrg.id
    : (
        await db
          .insert(orgs)
          .values({
            name: 'Demo Co.',
            slug: 'demo',
            billingStateCode: '29',
            billingCity: 'Bengaluru',
            ownerUserId: userId,
            plan: 'starter',
            planStatus: 'active',
            leadCap: 150,
            seatCap: 1,
            aiEmailsPerLead: 1,
            reviewsPerLead: 15,
            waMessagesPerMonth: 100,
          })
          .returning({ id: orgs.id })
      )[0]!.id;

  const [existingMember] = await db
    .select()
    .from(orgMembers)
    .where(eq(orgMembers.userId, userId))
    .limit(1);
  if (!existingMember) {
    await db.insert(orgMembers).values({ orgId, userId, role: 'owner', acceptedAt: new Date() });
  }

  const sample = [
    {
      businessName: 'Third Wave Coffee — Indiranagar',
      category: 'catering.cafe',
      lat: 12.978,
      lng: 77.638,
      city: 'Bengaluru',
      state: 'Karnataka',
    },
    {
      businessName: 'Cafe Coffee Day — Koramangala',
      category: 'catering.cafe',
      lat: 12.9352,
      lng: 77.6245,
      city: 'Bengaluru',
      state: 'Karnataka',
    },
  ];

  for (const s of sample) {
    await db
      .insert(leads)
      .values({
        orgId,
        ownerUserId: userId,
        sourceUrl: 'https://www.geoapify.com/places/demo',
        sourceMethod: 'geoapify_api',
        sourceVerifiedAt: new Date(),
        externalId: `seed:${s.businessName}`,
        businessName: s.businessName,
        category: s.category,
        lat: s.lat,
        lng: s.lng,
        city: s.city,
        state: s.state,
        countryCode: 'IN',
        contact: { website: 'https://example.in' },
      })
      .onConflictDoNothing();
  }

  console.log(`Seed complete. Login as ${email} (set up Supabase Auth with this email to test).`);
  await closeDb();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
