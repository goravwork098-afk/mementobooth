"use server";

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { randomBytes } from "crypto";
import { FREE_TIER_ENTITLEMENTS } from "@/types/entitlements";

function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `LOVE-${result}`;
}

export async function createRoomAction() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  let userId = session.user.id;
  if (!userId && session.user.email) {
    const dbUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    userId = dbUser?.id;
  }
  if (!userId) {
    throw new Error("Unauthorized");
  }

  // Check entitlement limits
  const yearMonth = `${new Date().getFullYear()}-${String(
    new Date().getMonth() + 1
  ).padStart(2, "0")}`;
  const usage = await prisma.usageRecord.findUnique({
    where: { userId_yearMonth: { userId, yearMonth } },
  });
  if (
    usage &&
    usage.roomsCreatedCount >= FREE_TIER_ENTITLEMENTS.maxRoomsPerMonth
  ) {
    // TODO: check if user has a pro subscription
    throw new Error("Monthly room limit reached. Upgrade to create more booths.");
  }

  // Generate unique room code with retry
  let code = generateRoomCode();
  let attempts = 0;
  while (attempts < 5) {
    const existing = await prisma.room.findUnique({ where: { code } });
    if (!existing) break;
    code = generateRoomCode();
    attempts++;
  }

  const token = randomBytes(16).toString("hex");
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 min TTL

  const room = await prisma.$transaction(async (tx) => {
    const newRoom = await tx.room.create({
      data: {
        code,
        token,
        hostId: userId,
        expiresAt,
        maxDurationSec: 1800,
      },
    });

    await tx.roomParticipant.create({
      data: {
        roomId: newRoom.id,
        userId,
        role: "HOST",
      },
    });

    await tx.roomEvent.create({
      data: {
        roomId: newRoom.id,
        eventType: "ROOM_CREATED",
        metadata: JSON.stringify({ role: "HOST" }),
      },
    });

    await tx.usageRecord.upsert({
      where: { userId_yearMonth: { userId, yearMonth } },
      update: { roomsCreatedCount: { increment: 1 } },
      create: { userId, yearMonth, roomsCreatedCount: 1 },
    });

    return newRoom;
  });

  redirect(`/room/${room.token}`);
}
