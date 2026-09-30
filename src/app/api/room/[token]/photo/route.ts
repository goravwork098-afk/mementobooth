import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import {
  storePhoto,
  getPartnerPhoto,
  hasPhoto,
} from "@/lib/photo-relay";

export const runtime = "nodejs";

/**
 * POST — Upload a captured photo to the ephemeral relay.
 * Body: { dataUrl: string }
 *
 * The photo is held in memory only (never written to disk/DB)
 * and auto-expires after 5 minutes.
 */
export async function POST(
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
    include: { participants: true },
  });

  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  const participant = room.participants.find(
    (p) => p.userId === session.user!.id
  );
  if (!participant) {
    return NextResponse.json({ error: "Not a participant" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body?.dataUrl || typeof body.dataUrl !== "string") {
    return NextResponse.json(
      { error: "Missing dataUrl" },
      { status: 400 }
    );
  }

  // Store in ephemeral relay — NOT persisted anywhere
  storePhoto(room.id, session.user!.id, body.dataUrl);

  // Check if both participants have uploaded
  const allIds = room.participants.map((p) => p.userId);
  const bothUploaded = allIds.every((id) => hasPhoto(room.id, id));

  return NextResponse.json({
    uploaded: true,
    bothReady: bothUploaded,
  });
}

/**
 * GET — Fetch the partner's captured photo from the relay.
 * Returns the data URL if available, or null.
 */
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
    include: { participants: true },
  });

  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  if (!room.participants.some((p) => p.userId === session.user!.id)) {
    return NextResponse.json({ error: "Not a participant" }, { status: 403 });
  }

  const allIds = room.participants.map((p) => p.userId);
  const partner = getPartnerPhoto(room.id, session.user!.id, allIds);
  const myPhoto = hasPhoto(room.id, session.user!.id);

  return NextResponse.json({
    partnerPhoto: partner?.dataUrl ?? null,
    myPhotoUploaded: myPhoto,
    bothReady: partner !== null && myPhoto,
  });
}
