"use server";

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";

export async function joinRoomAction(token: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const userId = session.user.id;

  const room = await prisma.room.findUnique({
    where: { token },
    include: { participants: true },
  });

  if (!room) throw new Error("Room not found.");
  if (room.expiresAt <= new Date()) throw new Error("This room has expired.");

  // 1. Host re-entry check
  if (room.hostId === userId) {
    redirect(`/room/${token}`);
  }

  // 2. Already a participant re-entry check (must precede status check so refreshing in READY rooms works)
  const existing = room.participants.find((p) => p.userId === userId);
  if (existing) {
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
