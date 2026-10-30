import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import {
  storePhoto,
  getPartnerPhoto,
  getAllPartnerPhotos,
  hasPhoto,
  hasAllPhotos,
} from "@/lib/photo-relay";

export const runtime = "nodejs";

/**
 * POST — Upload a captured photo slot to the ephemeral relay.
 * Body: { dataUrl: string, slotIndex?: number, totalSlots?: number }
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
    include: { participants: true, selectedFrame: true },
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

  const slotIndex = typeof body.slotIndex === "number" ? body.slotIndex : 0;
  const totalSlots =
    typeof body.totalSlots === "number"
      ? body.totalSlots
      : room.selectedFrame?.slotCount ?? 2;

  // Store in ephemeral relay for this specific slot
  storePhoto(room.id, session.user!.id, body.dataUrl, slotIndex);

  // Check if both participants have uploaded for this slot
  const allIds = room.participants.map((p) => p.userId);
  const bothReadyForSlot = allIds.every((id) => hasPhoto(room.id, id, slotIndex));

  // Check if both participants have completed all slots
  const allSlotsCompleted = allIds.every((id) =>
    hasAllPhotos(room.id, id, totalSlots)
  );

  return NextResponse.json({
    uploaded: true,
    slotIndex,
    bothReadyForSlot,
    allSlotsCompleted,
  });
}

/**
 * GET — Fetch the partner's captured photos from the relay.
 * Returns either all partner photos or a specific slot.
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
    include: { participants: true, selectedFrame: true },
  });

  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  if (!room.participants.some((p) => p.userId === session.user!.id)) {
    return NextResponse.json({ error: "Not a participant" }, { status: 403 });
  }

  const totalSlots = room.selectedFrame?.slotCount ?? 2;
  const allIds = room.participants.map((p) => p.userId);

  const url = new URL(request.url);
  const slotParam = url.searchParams.get("slotIndex");

  if (slotParam !== null) {
    const slotIndex = parseInt(slotParam, 10);
    const partner = getPartnerPhoto(
      room.id,
      session.user!.id,
      allIds,
      slotIndex
    );
    const myPhoto = hasPhoto(room.id, session.user!.id, slotIndex);

    return NextResponse.json({
      slotIndex,
      partnerPhoto: partner?.dataUrl ?? null,
      myPhotoUploaded: myPhoto,
      bothReady: partner !== null && myPhoto,
    });
  }

  // Return all partner photos for all slots
  const partnerData = getAllPartnerPhotos(
    room.id,
    session.user!.id,
    allIds,
    totalSlots
  );

  const myPhotosCompleted = hasAllPhotos(
    room.id,
    session.user!.id,
    totalSlots
  );
  const partnerPhotosCompleted = allIds
    .filter((id) => id !== session.user!.id)
    .every((id) => hasAllPhotos(room.id, id, totalSlots));

  return NextResponse.json({
    partnerPhotos: partnerData?.photos ?? {},
    totalSlots,
    allReady: myPhotosCompleted && partnerPhotosCompleted,
  });
}
