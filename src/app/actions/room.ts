"use server";

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { randomBytes } from "crypto";
import { generateRoomCode } from "@/lib/room-code";
import { detectDeviceInfo } from "@/lib/device-detection";
import { FREE_TIER_ENTITLEMENTS, PRO_TIER_ENTITLEMENTS } from "@/types/entitlements";

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

  const yearMonth = `${new Date().getFullYear()}-${String(
    new Date().getMonth() + 1
  ).padStart(2, "0")}`;

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
    // 1. Check subscription status
    const subscription = await tx.subscription.findUnique({
      where: { userId },
      select: { status: true },
    });
    const isPro =
      subscription?.status === "ACTIVE" || subscription?.status === "TRIALING";
    const maxRooms = isPro
      ? PRO_TIER_ENTITLEMENTS.maxRoomsPerMonth
      : FREE_TIER_ENTITLEMENTS.maxRoomsPerMonth;

    // 2. Check usage record atomically inside transaction
    const usage = await tx.usageRecord.findUnique({
      where: { userId_yearMonth: { userId, yearMonth } },
    });

    if (usage && usage.roomsCreatedCount >= maxRooms) {
      throw new Error(
        isPro
          ? "Monthly booth limit reached."
          : "Monthly booth limit reached. Upgrade to Pro to create more booths."
      );
    }

    const reqHeaders = await headers();
    const deviceInfo = detectDeviceInfo(reqHeaders);

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
        deviceType: deviceInfo.deviceType,
        deviceModel: deviceInfo.deviceModel,
        os: deviceInfo.os,
        browser: deviceInfo.browser,
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
