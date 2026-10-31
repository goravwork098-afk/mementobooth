"use server";

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { detectDeviceInfo } from "@/lib/device-detection";

export async function joinRoomAction(token: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const userId = session.user.id;
  const reqHeaders = await headers();
  const deviceInfo = detectDeviceInfo(reqHeaders);

  const room = await prisma.room.findUnique({
    where: { token },
    include: { participants: true },
  });

  if (!room) throw new Error("Room not found.");
  if (room.expiresAt <= new Date()) throw new Error("This room has expired.");

  // 1. Host re-entry check
  if (room.hostId === userId) {
    await prisma.roomParticipant.updateMany({
      where: { roomId: room.id, userId },
      data: {
        deviceType: deviceInfo.deviceType,
        deviceModel: deviceInfo.deviceModel,
        os: deviceInfo.os,
        browser: deviceInfo.browser,
      },
    });
    redirect(`/room/${token}`);
  }

  // 2. Already a participant re-entry check (must precede status check so refreshing in READY rooms works)
  const existing = room.participants.find((p) => p.userId === userId);
  if (existing) {
    await prisma.roomParticipant.updateMany({
      where: { roomId: room.id, userId },
      data: {
        deviceType: deviceInfo.deviceType,
        deviceModel: deviceInfo.deviceModel,
        os: deviceInfo.os,
        browser: deviceInfo.browser,
      },
    });
    redirect(`/room/${token}`);
  }

  // 3. New participants require WAITING status
  if (room.status !== "WAITING") {
    throw new Error("This room is no longer accepting new guests.");
  }

  // 4. Capacity check
  if (room.participants.length >= 2) {
    throw new Error("This room is already full.");
  }

  await prisma.$transaction(async (tx) => {
    const currentCount = await tx.roomParticipant.count({
      where: { roomId: room.id },
    });
    if (currentCount >= 2) {
      throw new Error("This room is already full.");
    }

    await tx.roomParticipant.create({
      data: {
        roomId: room.id,
        userId,
        role: "GUEST",
        deviceType: deviceInfo.deviceType,
        deviceModel: deviceInfo.deviceModel,
        os: deviceInfo.os,
        browser: deviceInfo.browser,
      },
    });

    await tx.roomEvent.create({
      data: {
        roomId: room.id,
        eventType: "GUEST_JOINED",
        metadata: JSON.stringify({ userId }),
      },
    });
  });

  redirect(`/room/${token}`);
}

export interface ResolveRoomCodeResult {
  success: boolean;
  token?: string;
  error?: string;
}

/**
 * Resolves a human-readable room display code (e.g. "LOVE-4X9K" or "4X9K")
 * to its secure cryptographic token URL with room state and capacity validation.
 */
export async function resolveRoomCodeAction(
  rawCode: string
): Promise<ResolveRoomCodeResult> {
  const trimmed = rawCode.trim().toUpperCase();
  if (!trimmed) {
    return { success: false, error: "Please enter a room code." };
  }

  // Support both "LOVE-XXXX" and shorthand "XXXX"
  const formattedCode = trimmed.startsWith("LOVE-")
    ? trimmed
    : `LOVE-${trimmed}`;

  const room = await prisma.room.findUnique({
    where: { code: formattedCode },
    include: { participants: true },
  });

  if (!room) {
    return {
      success: false,
      error: "No booth found with that code. Please check and try again.",
    };
  }

  if (room.expiresAt <= new Date()) {
    return {
      success: false,
      error: "This booth session has expired.",
    };
  }

  if (room.status === "COMPLETED") {
    return {
      success: false,
      error: "This booth session has ended.",
    };
  }

  if (room.participants.length >= 2) {
    return {
      success: false,
      error: "This booth is already full (maximum 2 participants).",
    };
  }

  return { success: true, token: room.token };
}
