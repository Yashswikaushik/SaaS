#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import Razorpay from 'razorpay';
import { z } from 'zod';

const KEY_ID = process.env.RAZORPAY_KEY_ID;
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
if (!KEY_ID || !KEY_SECRET) {
  console.error('RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set');
  process.exit(1);
}

const rzp = new Razorpay({ key_id: KEY_ID, key_secret: KEY_SECRET });

const server = new McpServer({ name: 'razorpay-mcp', version: '0.1.0' });

server.tool(
  'list_plans',
  'List all Razorpay plans on this account.',
  {},
  async () => {
    const r = await rzp.plans.all({ count: 100 });
    return { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] };
  },
);

server.tool(
  'list_subscriptions',
  'List Razorpay subscriptions filtered by status.',
  { status: z.string().optional(), count: z.number().int().min(1).max(100).default(25) },
  async ({ status, count }) => {
    const r = await rzp.subscriptions.all({ count, ...(status ? { status } : {}) } as never);
    return { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] };
  },
);

server.tool(
  'fetch_payment',
  'Fetch a single payment by id.',
  { paymentId: z.string() },
  async ({ paymentId }) => {
    const r = await rzp.payments.fetch(paymentId);
    return { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] };
  },
);

server.tool(
  'refund',
  'Issue a refund on a payment id (test mode only).',
  { paymentId: z.string(), amountPaise: z.number().int().positive() },
  async ({ paymentId, amountPaise }) => {
    if (!KEY_ID!.startsWith('rzp_test_')) {
      return { content: [{ type: 'text', text: 'Refused: production key' }], isError: true };
    }
    const r = await rzp.payments.refund(paymentId, { amount: amountPaise });
    return { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] };
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
