import type { Plan as DbPlan } from '@bharat/db';

export type PlanTier = Exclude<DbPlan['plan'], undefined>;

export interface PlanPricing {
  tier: 'free' | 'starter' | 'growth' | 'scale' | 'agency';
  monthlyPaise: number;
  annualPaise: number;
  leadCap: number;
  monthlyRenewalCap: number;
  seatCap: number;
  aiEmailsPerLead: number;
  reviewsPerLead: number;
  waMessagesPerMonth: number;
  routesEnabled: boolean;
  aiAssistantEnabled: boolean;
  whiteLabelEnabled: boolean;
}

export const PLAN_PRICING: Record<PlanPricing['tier'], PlanPricing> = {
  free: {
    tier: 'free',
    monthlyPaise: 0,
    annualPaise: 0,
    leadCap: 15,
    monthlyRenewalCap: 0,
    seatCap: 1,
    aiEmailsPerLead: 1,
    reviewsPerLead: 10,
    waMessagesPerMonth: 0,
    routesEnabled: false,
    aiAssistantEnabled: false,
    whiteLabelEnabled: false,
  },
  starter: {
    tier: 'starter',
    monthlyPaise: 99_900,
    annualPaise: 9_99_900,
    leadCap: 150,
    monthlyRenewalCap: 50,
    seatCap: 1,
    aiEmailsPerLead: 1,
    reviewsPerLead: 15,
    waMessagesPerMonth: 100,
    routesEnabled: false,
    aiAssistantEnabled: false,
    whiteLabelEnabled: false,
  },
  growth: {
    tier: 'growth',
    monthlyPaise: 2_49_900,
    annualPaise: 24_99_000,
    leadCap: 600,
    monthlyRenewalCap: 100,
    seatCap: 2,
    aiEmailsPerLead: 2,
    reviewsPerLead: 25,
    waMessagesPerMonth: 500,
    routesEnabled: true,
    aiAssistantEnabled: false,
    whiteLabelEnabled: false,
  },
  scale: {
    tier: 'scale',
    monthlyPaise: 4_99_900,
    annualPaise: 49_99_000,
    leadCap: 2_000,
    monthlyRenewalCap: 200,
    seatCap: 5,
    aiEmailsPerLead: 4,
    reviewsPerLead: 50,
    waMessagesPerMonth: 2_000,
    routesEnabled: true,
    aiAssistantEnabled: true,
    whiteLabelEnabled: false,
  },
  agency: {
    tier: 'agency',
    monthlyPaise: 12_99_900,
    annualPaise: 1_29_99_000,
    leadCap: 8_000,
    monthlyRenewalCap: 400,
    seatCap: 15,
    aiEmailsPerLead: Number.MAX_SAFE_INTEGER,
    reviewsPerLead: 100,
    waMessagesPerMonth: 10_000,
    routesEnabled: true,
    aiAssistantEnabled: true,
    whiteLabelEnabled: true,
  },
};

export function razorpayPlanIdFor(tier: PlanPricing['tier'], cycle: 'monthly' | 'yearly'): string {
  const key =
    `RAZORPAY_PLAN_${tier.toUpperCase()}_${cycle === 'monthly' ? 'MONTHLY' : 'ANNUAL'}` as const;
  const id = process.env[key];
  if (!id) throw new Error(`${key} env var not set`);
  return id;
}
