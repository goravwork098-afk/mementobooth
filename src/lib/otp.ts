import { createHash, randomInt } from "node:crypto";
import prisma from "@/lib/prisma";

const OTP_TTL_MS = 10 * 60 * 1000;

export function hashOtp(email: string, code: string) {
  return createHash("sha256").update(`${email.toLowerCase()}:${code}`).digest("hex");
}

export async function createEmailOtp(email: string) {
  const normalized = email.trim().toLowerCase();
  const code = randomInt(100000, 1000000).toString();
  await prisma.emailOtp.deleteMany({ where: { email: normalized } });
  await prisma.emailOtp.create({ data: { email: normalized, codeHash: hashOtp(normalized, code), expiresAt: new Date(Date.now() + OTP_TTL_MS) } });
  return { email: normalized, code };
}

export async function consumeEmailOtp(email: string, code: string) {
  const normalized = email.trim().toLowerCase();
  const now = new Date();
  const record = await prisma.emailOtp.findFirst({
    where: { email: normalized, consumedAt: null },
    orderBy: { createdAt: "desc" },
  });

  if (!record || record.expiresAt <= now || record.attempts >= 5) return null;

  if (record.codeHash !== hashOtp(normalized, code)) {
    await prisma.emailOtp.updateMany({
      where: { id: record.id, consumedAt: null },
      data: { attempts: { increment: 1 } },
    });
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
    return tx.user.upsert({
      where: { email: normalized },
      update: {},
      create: { email: normalized },
    });
  });

  return consumed;
}
