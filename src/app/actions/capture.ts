"use server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";

/**
 * Start the countdown for a room (host-only).
 * Sets countdownStartedAt + countdownDuration on the Room record so both
 * participants can synchronize via polling the room status API.
 */
export async function startCountdownAction(
  roomId: string,
  duration: 3 | 5 | 10 = 3
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: { participants: true },
  });

  if (!room) throw new Error("Room not found");
  if (room.hostId !== session.user.id)
    throw new Error("Only the host can start the countdown");
  if (room.participants.length < 2)
    throw new Error("Both participants must be in the room");
  if (!room.selectedFrameId)
    throw new Error("A frame must be selected first");

  // Check both are ready
  const hostReady = room.participants.find(
    (p) => p.role === "HOST"
  )?.isReady;
  const guestReady = room.participants.find(
    (p) => p.role === "GUEST"
  )?.isReady;
  if (!hostReady || !guestReady)
    throw new Error("Both participants must be ready");

  await prisma.$transaction([
    prisma.room.update({
      where: { id: roomId },
      data: {
        status: "ACTIVE",
        countdownStartedAt: new Date(),
        countdownDuration: duration,
      },
    }),
    prisma.roomEvent.create({
      data: {
        roomId,
        eventType: "COUNTDOWN_START",
        metadata: JSON.stringify({ duration, startedBy: session.user.id }),
      },
    }),
  ]);
}

/**
 * Record that a capture event happened (without storing any media).
 * The actual photo data stays client-side and goes through the
 * ephemeral in-memory relay only — never touches the database.
 */
export async function recordCaptureEvent(roomId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await prisma.roomEvent.create({
    data: {
      roomId,
      eventType: "PHOTO_CAPTURED",
      metadata: JSON.stringify({
        userId: session.user.id,
        timestamp: new Date().toISOString(),
        // NO photo data stored — privacy promise upheld
      }),
    },
  });
}

/**
 * Transition room to COMPOSING state after both photos are captured.
 */
export async function transitionToComposingAction(roomId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await prisma.room.update({
    where: { id: roomId },
    data: { status: "COMPOSING" },
  });
}

/**
 * Mark room as COMPLETED after download.
 */
export async function completeRoomAction(roomId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await prisma.room.update({
    where: { id: roomId },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
      // Clear countdown fields
      countdownStartedAt: null,
      countdownDuration: null,
    },
  });
}

/**
 * Reset countdown (for retake).
 */
export async function resetCountdownAction(roomId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await prisma.$transaction([
    prisma.room.update({
      where: { id: roomId },
      data: {
        status: "READY",
        countdownStartedAt: null,
        countdownDuration: null,
      },
    }),
    // Reset participant ready states
    prisma.roomParticipant.updateMany({
      where: { roomId },
      data: { isReady: false },
    }),
  ]);
}