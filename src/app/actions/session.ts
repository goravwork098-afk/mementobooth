"use server";

import { signOut, auth } from "@/auth";
import prisma from "@/lib/prisma";
import { clearRoomPhotos } from "@/lib/photo-relay";

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}

export async function deleteAccountAction() {
  const session = await auth();
  if (!session?.user) return;

  const userId = session.user.id;
  const email = session.user.email;
  if (!userId && !email) return;

  const user = await prisma.user.findFirst({
    where: userId ? { id: userId } : { email: email! },
    include: { hostedRooms: { select: { id: true } } },
  });

  if (!user) return;

  // Clear ephemeral photo buffers for all rooms hosted by this user
  for (const room of user.hostedRooms) {
    clearRoomPhotos(room.id);
  }

  // Deleting user triggers foreign key cascading deletes across:
  // - hostedRooms (Room) -> RoomParticipant, RoomEvent
  // - participations (RoomParticipant)
  // - sessions (Session)
  // - accounts (Account)
  // - subscription (Subscription)
  // - usageRecords (UsageRecord)
  await prisma.user.delete({ where: { id: user.id } });

  await signOut({ redirectTo: "/" });
}
