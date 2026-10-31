import prisma from "@/lib/prisma";

export interface IpSecurityCheckResult {
  blocked: boolean;
  reason?: string | null;
  retryAfterSec?: number;
}

export interface SecurityFailureResult {
  failedAttempts: number;
  isBlocked: boolean;
  blockedUntil?: Date | null;
}

/**
 * Checks PostgreSQL to verify if an IP address is currently blocked due to
 * repeated brute-force attacks or suspicious credential stuffing.
 */
export async function checkIpSecurity(ip: string): Promise<IpSecurityCheckResult> {
  const normalizedIp = ip.trim();
  const now = new Date();

  try {
    const record = await prisma.suspiciousIpRecord.findUnique({
      where: { ipAddress: normalizedIp },
    });

    if (!record) {
      return { blocked: false };
    }

    // Check if actively blocked
    if (record.isBlocked) {
      if (record.blockedUntil && record.blockedUntil > now) {
        const retryAfterSec = Math.max(
          1,
          Math.ceil((record.blockedUntil.getTime() - now.getTime()) / 1000)
        );
        return {
          blocked: true,
          reason: record.reason ?? "Suspicious activity detected",
          retryAfterSec,
        };
      }

      // Ban has expired -> automatically lift block and reset counter
      await prisma.suspiciousIpRecord.update({
        where: { id: record.id },
        data: {
          isBlocked: false,
          failedAttempts: 0,
          blockedUntil: null,
          lastSeenAt: now,
        },
      });
      return { blocked: false };
    }

    return { blocked: false };
  } catch (error) {
    console.error("IP security check error:", error);
    // On unexpected DB failure, default to unblocked for availability unless fail-closed is strictly needed
    return { blocked: false };
  }
}

/**
 * Records a failed verification attempt or suspicious authentication event in PostgreSQL.
 * If consecutive failures exceed the threshold (default: 5), the IP is automatically blocked.
 */
export async function recordSuspiciousFailure(
  ip: string,
  reason: string = "FAILED_OTP_VERIFICATION",
  maxFailuresBeforeBlock: number = 5,
  blockDurationMinutes: number = 30
): Promise<SecurityFailureResult> {
  const normalizedIp = ip.trim();
  const now = new Date();
  const blockUntil = new Date(now.getTime() + blockDurationMinutes * 60 * 1000);

  try {
    return await prisma.$transaction(async (tx) => {
      const existing = await tx.suspiciousIpRecord.findUnique({
        where: { ipAddress: normalizedIp },
      });

      if (!existing) {
        const created = await tx.suspiciousIpRecord.create({
          data: {
            ipAddress: normalizedIp,
            failedAttempts: 1,
            isBlocked: maxFailuresBeforeBlock <= 1,
            blockedUntil: maxFailuresBeforeBlock <= 1 ? blockUntil : null,
            reason,
            lastSeenAt: now,
          },
        });
        return {
          failedAttempts: created.failedAttempts,
          isBlocked: created.isBlocked,
          blockedUntil: created.blockedUntil,
        };
      }

      const nextAttempts = existing.failedAttempts + 1;
      const shouldBlock = nextAttempts >= maxFailuresBeforeBlock;

      const updated = await tx.suspiciousIpRecord.update({
        where: { id: existing.id },
        data: {
          failedAttempts: nextAttempts,
          isBlocked: shouldBlock ? true : existing.isBlocked,
          blockedUntil: shouldBlock ? blockUntil : existing.blockedUntil,
          reason,
          lastSeenAt: now,
        },
      });

      return {
        failedAttempts: updated.failedAttempts,
        isBlocked: updated.isBlocked,
        blockedUntil: updated.blockedUntil,
      };
    });
  } catch (error) {
    console.error("Failed to record suspicious failure:", error);
    return {
      failedAttempts: 1,
      isBlocked: false,
    };
  }
}

/**
 * Resets failed attempt counter in PostgreSQL upon authentic, successful sign-in.
 */
export async function recordSuccessfulAuth(ip: string): Promise<void> {
  const normalizedIp = ip.trim();
  try {
    const existing = await prisma.suspiciousIpRecord.findUnique({
      where: { ipAddress: normalizedIp },
    });

    if (existing && !existing.isBlocked) {
      await prisma.suspiciousIpRecord.update({
        where: { id: existing.id },
        data: {
          failedAttempts: 0,
          lastSeenAt: new Date(),
        },
      });
    }
  } catch (error) {
    console.error("Failed to reset auth success counter:", error);
  }
}

