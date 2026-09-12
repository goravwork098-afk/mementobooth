import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

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
    },
  });

  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  // Ensure requesting user is a participant
  if (!room.participants.some((p) => p.userId === session.user!.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({
    status: room.status,
    expiresAt: room.expiresAt,
    selectedFrameId: room.selectedFrameId,
    participants: room.participants.map((p) => ({
      id: p.id,
      userId: p.userId,
      role: p.role,
      name: p.user.name ?? p.user.email?.split("@")[0] ?? "Guest",
      isReady: p.isReady,
      cameraGranted: p.cameraGranted,
      micGranted: p.micGranted,
      streamActive: p.streamActive,
    })),
  });
}
