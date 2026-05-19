import { TRPCError } from '@trpc/server';
import { and, eq, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { db, leads, orgs } from '@bharat/db';
import { orgProcedure, router } from '../trpc';

const OSRM_BASE = process.env.OSRM_BASE_URL ?? 'http://localhost:5000';

export const routesRouter = router({
  optimize: orgProcedure
    .input(
      z.object({
        leadIds: z.array(z.string().uuid()).min(2).max(25),
        start: z.tuple([z.number(), z.number()]),
        end: z.tuple([z.number(), z.number()]).optional(),
        roundtrip: z.boolean().default(false),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const orgRow = (await db.select().from(orgs).where(eq(orgs.id, ctx.org.id)).limit(1))[0];
      if (!orgRow?.routesEnabled) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Routes require Growth+ plan' });
      }

      const rows = await db
        .select({ id: leads.id, lat: leads.lat, lng: leads.lng, name: leads.businessName })
        .from(leads)
        .where(and(eq(leads.orgId, ctx.org.id), inArray(leads.id, input.leadIds)));
      if (rows.length !== input.leadIds.length) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Some leads not found' });
      }

      const coords = [
        `${input.start[0]},${input.start[1]}`,
        ...rows.map((r) => `${r.lng},${r.lat}`),
      ];
      if (input.end) coords.push(`${input.end[0]},${input.end[1]}`);

      const url = `${OSRM_BASE}/trip/v1/driving/${coords.join(';')}?source=first&roundtrip=${
        input.roundtrip ? 'true' : 'false'
      }&overview=false&steps=false`;

      const res = await fetch(url, { headers: { 'User-Agent': 'BharatLeads/1.0' } });
      if (!res.ok) {
        throw new TRPCError({ code: 'BAD_GATEWAY', message: `OSRM failed: ${res.status}` });
      }
      const data = (await res.json()) as {
        trips: Array<{ duration: number; distance: number }>;
        waypoints: Array<{ waypoint_index: number; trips_index: number }>;
      };
      if (!data.trips?.[0]) throw new TRPCError({ code: 'BAD_GATEWAY', message: 'No trips' });

      const ordered = data.waypoints
        .map((w, idx) => ({ idx, order: w.waypoint_index }))
        .sort((a, b) => a.order - b.order)
        .map((w) => {
          if (w.idx === 0) return { type: 'start' as const, ...input.start };
          if (input.end && w.idx === coords.length - 1) {
            return { type: 'end' as const, lng: input.end[0], lat: input.end[1] };
          }
          const r = rows[w.idx - 1];
          return r
            ? { type: 'lead' as const, id: r.id, name: r.name, lat: r.lat ?? 0, lng: r.lng ?? 0 }
            : null;
        })
        .filter(Boolean);

      const trip = data.trips[0];
      return {
        ordered,
        durationSeconds: trip.duration,
        distanceMeters: trip.distance,
        googleMapsUrl: buildGoogleMapsUrl(ordered),
      };
    }),
});

function buildGoogleMapsUrl(
  ordered: Array<
    { type: 'start' | 'end'; 0: number; 1: number } | { type: 'lead'; lat: number; lng: number }
  >,
): string {
  const points = ordered.map((p) => {
    if ('lat' in p) return `${p.lat},${p.lng}`;
    return `${p[1]},${p[0]}`;
  });
  return `https://www.google.com/maps/dir/${points.join('/')}`;
}
