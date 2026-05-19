---
name: whatsapp-aisensy
description: WhatsApp Business API via AiSensy. Template approval tracking, broadcast, session messages, opt-out keyword handling. Use when sending WA messages, building templates, or handling inbound webhooks. Trigger on mentions of WhatsApp, WA, AiSensy, broadcast, template.
---

# WhatsApp via AiSensy

## Two message classes
1. **Template (HSM)** — pre-approved by Meta. Required when starting a conversation or 24h after last user reply.
2. **Session** — free-form. Allowed only within 24h of user's last inbound message.

## Template lifecycle
- Submit template → AiSensy → Meta. Approval 1–24h.
- Track in `wa_templates` table: `name`, `category` (MARKETING/UTILITY/AUTHENTICATION), `language`, `body`, `status`, `meta_template_id`.
- Never hardcode template IDs — read from DB by name.

## Outbound send
```ts
import { aisensy } from '@bharat/aisensy';

await assertConsent({ userId, scope: 'marketing' }); // throws if not granted
await aisensy.sendTemplate({
  to: '+919999999999', // E.164
  campaignName: 'cold_outreach_v1',
  variables: { '1': leadName, '2': painPoint, '3': pricingURL },
});
// Persist to lead_messages with consent_check snapshot
```

## Inbound webhook
- `POST /api/webhooks/aisensy` — verify `Authorization: Bearer <AISENSY_WEBHOOK_TOKEN>`
- Parse message → if text matches opt-out regex → flip `consents.marketing` to `false`, reply with confirmation template `optout_confirmation`.

## Opt-out keywords (case-insensitive, trimmed)
```
STOP, UNSUBSCRIBE, NO, STOPALL, OPTOUT,
रोकें, बंद, मना, हटाओ,
நிறுத்து, வேண்டாம்,
ఆపండి, వద్దు,
ರೋಕು, ಬೇಡ,
থামাও, না
```

## Click-to-WhatsApp ads (CTW)
- AiSensy → Meta Ads Manager integration → cheapest channel (₹15–45/lead).
- Tracked via `?utm_source=ctw&utm_campaign=<name>` on landing pages.

## Pricing awareness (Jan 2026 India rates)
- Marketing: ~₹0.86/message
- Utility/Authentication: ~₹0.115/message
- Service (user-initiated): free for 24h window

Cost-control rule: estimate cost in `aisensy.estimateBroadcastCost(recipients, template)` BEFORE sending, error if user has no remaining budget.
