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
  if (room.status !== "WAITING") throw new Error("This room is no longer accepting guests.");

  // Already a participant?
  const existing = room.participants.find((p) => p.userId === userId);
  if (existing) {
    redirect(`/room/${token}`);
  }

  // Room full? (max 2 participants)
  if (room.participants.length >= 2) {
    throw new Error("This room is already full.");
  }

  // Can't join your own room as guest
  if (room.hostId === userId) {
    redirect(`/room/${token}`);
  }

  await prisma.$transaction(async (tx) => {
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
