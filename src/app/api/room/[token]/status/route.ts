import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { hasPhoto } from "@/lib/photo-relay";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { token } = await params;
  
  const room = await prisma.room.findUnique({
    where: { token },
    include: {
      participants: {
        include: { user: { select: { name: true, email: true } } },
      },
      selectedFrame: {
        select: { id: true, name: true, slug: true, configJson: true },
      },
    },
  });

  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  // Ensure requesting user is a participant
  if (!room.participants.some((p) => p.userId === session.user!.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Calculate countdown state
  let countdownRemaining: number | null = null;
  if (room.countdownStartedAt && room.countdownDuration) {
    const elapsed =
      (Date.now() - room.countdownStartedAt.getTime()) / 1000;
    countdownRemaining = Math.max(
      0,
      room.countdownDuration - elapsed
    );
  }

  // Check photo relay state for each participant
  const participantIds = room.participants.map((p) => p.userId);
  const photosReady: Record<string, boolean> = {};
  for (const pid of participantIds) {
    photosReady[pid] = hasPhoto(room.id, pid);
  }

  return NextResponse.json({
    status: room.status,
    expiresAt: room.expiresAt.toISOString(),
    selectedFrameId: room.selectedFrameId,
    selectedFrame: room.selectedFrame
      ? {
          id: room.selectedFrame.id,
          name: room.selectedFrame.name,
          slug: room.selectedFrame.slug,
          configJson: room.selectedFrame.configJson,
        }
      : null,
    countdownStartedAt: room.countdownStartedAt?.toISOString() ?? null,
    countdownDuration: room.countdownDuration ?? null,
    countdownRemaining,
    serverTime: new Date().toISOString(),
    photosReady,
    participants: room.participants.map((p) => ({
      id: p.id,
      userId: p.userId,
      role: p.role,
      name: p.user.name ?? p.user.email?.split("@")[0] ?? "Guest",
      isReady: p.isReady,
      cameraGranted: p.cameraGranted,
      micGranted: p.micGranted,
    })),
  });
}
