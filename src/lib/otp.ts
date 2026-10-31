import { createHash, randomInt, timingSafeEqual } from "node:crypto";
import prisma from "@/lib/prisma";
import { recordSuspiciousFailure, recordSuccessfulAuth } from "@/lib/security";

const OTP_TTL_MS = 10 * 60 * 1000;

export function hashOtp(email: string, code: string) {
  return createHash("sha256").update(`${email.toLowerCase()}:${code}`).digest("hex");
}

export async function createEmailOtp(email: string, ipAddress?: string) {
  const normalized = email.trim().toLowerCase();
  const code = randomInt(100000, 1000000).toString();
  await prisma.emailOtp.deleteMany({ where: { email: normalized } });
  await prisma.emailOtp.create({
    data: {
      email: normalized,
      codeHash: hashOtp(normalized, code),
      ipAddress: ipAddress ?? null,
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    },
  });
  return { email: normalized, code };
}

export async function consumeEmailOtp(email: string, code: string, name?: string) {
  const normalized = email.trim().toLowerCase();
  const now = new Date();
  const record = await prisma.emailOtp.findFirst({
    where: { email: normalized, consumedAt: null },
    orderBy: { createdAt: "desc" },
  });

  if (!record || record.expiresAt <= now || record.attempts >= 5) return null;

  // Timing-safe constant-time hash comparison to eliminate side-channel vulnerabilities
  const expectedHash = hashOtp(normalized, code);
  const recordBuffer = Buffer.from(record.codeHash, "utf-8");
  const expectedBuffer = Buffer.from(expectedHash, "utf-8");
  const isMatch =
    recordBuffer.length === expectedBuffer.length &&
    timingSafeEqual(recordBuffer, expectedBuffer);

  if (!isMatch) {
    await prisma.emailOtp.updateMany({
      where: { id: record.id, consumedAt: null },
      data: { attempts: { increment: 1 } },
    });
    if (record.ipAddress) {
      await recordSuspiciousFailure(
        record.ipAddress,
        "FAILED_OTP_VERIFICATION",
        5,
        30
      );
    }
    return null;
  }

  const consumed = await prisma.$transaction(async (tx) => {
    const result = await tx.emailOtp.updateMany({
      where: {
        id: record.id,
        consumedAt: null,
        expiresAt: { gt: now },
        attempts: { lt: 5 },
        codeHash: record.codeHash,
      },
      data: { consumedAt: now },
    });
    if (result.count !== 1) return null;

    const trimmedName = name?.trim();
    return tx.user.upsert({
      where: { email: normalized },
      update: trimmedName ? { name: trimmedName } : {},
      create: { email: normalized, name: trimmedName || null },
    });
  });

  if (consumed && record.ipAddress) {
    await recordSuccessfulAuth(record.ipAddress);
  }

  return consumed;
}
