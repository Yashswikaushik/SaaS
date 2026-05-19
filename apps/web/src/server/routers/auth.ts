import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { sendOtp } from '@bharat/msg91';
import { issueOtp, verifyOtp } from '@bharat/msg91';
import { sendTemplate as sendWaTemplate } from '@bharat/aisensy';
import { audit, db, users } from '@bharat/db';
import { eq } from 'drizzle-orm';
import { toE164 } from '@/lib/intl';
import { rateLimit } from '@/lib/rate-limit';
import { router, procedure, authedProcedure, throttled } from '../trpc';
import { log } from '@/lib/logger';

export const authRouter = router({
  requestOtp: throttled(5, 60)
    .input(
      z.object({
        identity: z.string().min(3),
        channel: z.enum(['email', 'sms', 'whatsapp']),
        purpose: z.enum(['login', 'signup']).default('login'),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // Per-identity rate limit: 5/15min hard cap.
      const rl = await rateLimit({
        key: `otp:request:${input.identity}`,
        limit: 5,
        windowSeconds: 15 * 60,
      });
      if (!rl.ok) {
        throw new TRPCError({ code: 'TOO_MANY_REQUESTS', message: 'Too many OTP requests' });
      }

      const normalizedIdentity =
        input.channel === 'email' ? input.identity.toLowerCase() : toE164(input.identity);

      const { id, code } = await issueOtp({
        identity: normalizedIdentity,
        channel: input.channel,
        purpose: input.purpose,
        ip: ctx.ip,
      });

      try {
        if (input.channel === 'sms') {
          await sendOtp({ mobile: normalizedIdentity.replace('+', ''), otp: code });
        } else if (input.channel === 'whatsapp') {
          await sendWaTemplate({
            to: normalizedIdentity,
            campaignName: process.env.AISENSY_OTP_CAMPAIGN ?? 'otp_fallback',
            variables: [code, '10'],
          });
        } else {
          // email transactional send is wired separately in /app/api/auth/send-email-otp
          // for templated rendering; tRPC path returns the id to caller.
        }
      } catch (err) {
        log.error('OTP dispatch failed', { err: (err as Error).message, channel: input.channel });
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Could not send OTP' });
      }

      await audit({
        actorService: 'auth',
        action: 'otp.request',
        target: normalizedIdentity,
        ip: ctx.ip,
        userAgent: ctx.userAgent,
        payload: { channel: input.channel, purpose: input.purpose, otpId: id },
      });

      return { id, expiresInSeconds: 600 };
    }),

  verifyOtp: throttled(20, 60)
    .input(
      z.object({
        identity: z.string().min(3),
        channel: z.enum(['email', 'sms', 'whatsapp']),
        purpose: z.enum(['login', 'signup']).default('login'),
        code: z.string().regex(/^\d{4,8}$/),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const normalizedIdentity =
        input.channel === 'email' ? input.identity.toLowerCase() : toE164(input.identity);
      const ok = await verifyOtp({
        identity: normalizedIdentity,
        code: input.code,
        channel: input.channel,
        purpose: input.purpose,
      });

      await audit({
        actorService: 'auth',
        action: ok ? 'otp.verify.success' : 'otp.verify.failure',
        target: normalizedIdentity,
        ip: ctx.ip,
        userAgent: ctx.userAgent,
        payload: { channel: input.channel },
      });

      if (!ok) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid or expired OTP' });
      return { ok: true };
    }),

  me: authedProcedure.query(async ({ ctx }) => ctx.user),

  updateProfile: authedProcedure
    .input(
      z.object({
        fullName: z.string().min(1).max(100).optional(),
        locale: z.enum(['en-IN', 'hi-IN', 'ta-IN', 'te-IN', 'mr-IN', 'bn-IN', 'kn-IN']).optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await db
        .update(users)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(users.id, ctx.user.id));
      return { ok: true };
    }),
});
