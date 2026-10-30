"use server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function toggleReadyAction(roomId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  
  // Need to get participant by user ID and room ID
  const participant = await prisma.roomParticipant.findFirst({
    where: { roomId, userId: session.user.id },
  });
  
  if (!participant) throw new Error("Participant not found");

  await prisma.roomParticipant.update({
    where: { id: participant.id },
    data: { isReady: !participant.isReady },
  });
  
  // Re-fetch room to check if both are ready to transition status?
  // We'll let the client handle status transition requests for now
}

export async function selectFrameAction(roomId: string, frameId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const room = await prisma.room.findUnique({ where: { id: roomId } });
  if (!room) throw new Error("Room not found");
  if (room.hostId !== session.user.id) throw new Error("Only the host can select the frame");

  await prisma.room.update({
    where: { id: roomId },
    data: { selectedFrameId: frameId },
  });
}

export async function leaveRoomAction(roomId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const participant = await prisma.roomParticipant.findFirst({
    where: { roomId, userId: session.user.id },
  });

  if (!participant) return;

  await prisma.$transaction([
    prisma.roomParticipant.delete({ where: { id: participant.id } }),
    prisma.roomEvent.create({
      data: {
        roomId,
        eventType: "PARTICIPANT_LEFT",
        metadata: JSON.stringify({ userId: session.user.id }),
      },
    }),
  ]);
}

export async function closeRoomAction(roomId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const room = await prisma.room.findUnique({ where: { id: roomId } });
  if (!room) throw new Error("Room not found");
  if (room.hostId !== session.user.id) throw new Error("Only the host can close the room");

  await prisma.room.update({
    where: { id: roomId },
    data: { status: "COMPLETED", completedAt: new Date() },
  });
}
