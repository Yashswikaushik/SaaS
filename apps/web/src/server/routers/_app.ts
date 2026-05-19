import { router } from '../trpc';
import { authRouter } from './auth';
import { leadsRouter } from './leads';
import { aiRouter } from './ai';
import { billingRouter } from './billing';
import { dpdpRouter } from './dpdp';
import { whatsappRouter } from './whatsapp';
import { teamRouter } from './team';
import { territoriesRouter } from './territories';
import { routesRouter } from './routes';

export const appRouter = router({
  auth: authRouter,
  leads: leadsRouter,
  ai: aiRouter,
  billing: billingRouter,
  dpdp: dpdpRouter,
  whatsapp: whatsappRouter,
  team: teamRouter,
  territories: territoriesRouter,
  routes: routesRouter,
});

export type AppRouter = typeof appRouter;
