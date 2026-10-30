import prisma from "@/lib/prisma";

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  retryAfterSec?: number;
}

/**
 * Database-backed rate limiter for brute-force protection.
 * Persisted in PostgreSQL to survive server restarts and scale across workers.
 *
 * @param key Unique key to rate limit (e.g. `ip:192.168.1.1` or `email:user@domain.com`)
 * @param maxPoints Maximum allowed requests in the sliding window
 * @param windowSeconds Window length in seconds
 */
export async function checkRateLimit(
  key: string,
  maxPoints: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const now = new Date();
  const windowMs = windowSeconds * 1000;
  const newExpiresAt = new Date(now.getTime() + windowMs);

  try {
    return await prisma.$transaction(async (tx) => {
      const existing = await tx.rateLimitRecord.findUnique({
        where: { key },
      });

      // If record exists and has not expired
      if (existing && existing.expiresAt > now) {
        if (existing.points >= maxPoints) {
          const retryAfterSec = Math.max(
            1,
            Math.ceil((existing.expiresAt.getTime() - now.getTime()) / 1000)
          );
          return {
            success: false,
            remaining: 0,
            retryAfterSec,
          };
        }

        const updated = await tx.rateLimitRecord.update({
          where: { id: existing.id },
          data: { points: { increment: 1 } },
        });

        return {
          success: true,
          remaining: Math.max(0, maxPoints - updated.points),
        };
      }

      // Record does not exist or is expired -> reset
      await tx.rateLimitRecord.upsert({
        where: { key },
        create: {
          key,
          points: 1,
          expiresAt: newExpiresAt,
        },
        update: {
          points: 1,
          expiresAt: newExpiresAt,
        },
      });

      return {
        success: true,
        remaining: maxPoints - 1,
      };
    });
  } catch (error) {
    console.error("Rate limit check error:", error);
    // In fail-closed security mode, return rate-limited on critical DB failures
    return {
      success: false,
      remaining: 0,
      retryAfterSec: 30,
    };
  }
}

