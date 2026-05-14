/**
 * AI rate limiter — 20 calls per user per hour.
 *
 * Cross-project standard "aiRateLimiter (20/hr by user)" pattern. Keys by the
 * authenticated user id (req.user.userId set by authenticateToken) and falls
 * back to IP for unauthenticated clients.
 *
 * Configurable via AI_HOURLY_LIMIT env var.
 */

import rateLimit from 'express-rate-limit';
import type { Request } from 'express';

const HOURLY_LIMIT = Number.parseInt(process.env.AI_HOURLY_LIMIT || '20', 10);

function userOrIpKey(req: Request): string {
  const u: any = (req as any).user;
  if (u?.userId) return `user:${u.userId}`;
  if (u?.id) return `user:${u.id}`;
  return req.ip || 'anon';
}

export const aiRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: HOURLY_LIMIT,
  keyGenerator: userOrIpKey,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'AI_HOURLY_LIMIT',
    message: `Hourly AI budget exhausted (${HOURLY_LIMIT} calls/hr). Try again later.`,
  },
});

export const aiBurstLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  keyGenerator: userOrIpKey,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'AI_BURST_LIMIT', message: 'AI burst limit exceeded — slow down.' },
});

export default aiRateLimiter;
