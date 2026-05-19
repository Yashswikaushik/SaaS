export const CONSENT_SCOPES = ['essential', 'marketing', 'analytics', 'ai_processing'] as const;
export type ConsentScope = (typeof CONSENT_SCOPES)[number];

export const CURRENT_NOTICE_VERSION = '2025-11-13' as const;

export interface ConsentDescriptor {
  scope: ConsentScope;
  label: string;
  description: string;
  /** True if the scope is required for service operation and cannot be revoked
   *  without account deletion. */
  required: boolean;
}

export const CONSENT_DESCRIPTORS: readonly ConsentDescriptor[] = [
  {
    scope: 'essential',
    label: 'Essential service operation',
    description:
      'Account creation, authentication, billing, fraud prevention, and security. Required to use Bharat Leads.',
    required: true,
  },
  {
    scope: 'marketing',
    label: 'Marketing and outreach',
    description:
      'Send marketing emails, WhatsApp broadcasts, and product update notifications. You can revoke any time.',
    required: false,
  },
  {
    scope: 'analytics',
    label: 'Product analytics',
    description:
      'PostHog and Sentry for usage analytics and error monitoring. Helps us improve the product.',
    required: false,
  },
  {
    scope: 'ai_processing',
    label: 'AI processing',
    description:
      'Send lead data to Anthropic Claude and OpenAI to generate cold-email drafts and review summaries.',
    required: false,
  },
];
