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

export async function updateAvatarAction(avatarUrl: string) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const userId = session.user.id;
  const email = session.user.email;
  if (!userId && !email) {
    throw new Error("Missing user identifier");
  }

  // Validate URL protocol and hostname to ensure security
  if (!avatarUrl || typeof avatarUrl !== "string") {
    throw new Error("Invalid avatar URL");
  }

  let parsed: URL;
  try {
    parsed = new URL(avatarUrl);
  } catch {
    throw new Error("Invalid URL format");
  }

  if (parsed.protocol !== "https:" || parsed.hostname !== "api.dicebear.com") {
    throw new Error("Avatar URL must originate from trusted provider");
  }

  const user = await prisma.user.findFirst({
    where: userId ? { id: userId } : { email: email! },
    select: { id: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { image: avatarUrl },
  });

  return { success: true, avatarUrl };
}
