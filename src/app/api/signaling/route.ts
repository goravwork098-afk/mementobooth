import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, roomId, senderId, payload } = body;

    if (!type || !roomId || !senderId) {
      return NextResponse.json(
        { error: "Missing required fields: type, roomId, senderId" },
        { status: 400 }
      );
    }

    // Authenticate sender
    const session = await auth();
    if (!session?.user?.id || session.user.id !== senderId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify room participation
    const room = await prisma.room.findUnique({
      where: { token: roomId },
      include: {
        participants: {
          include: { user: { select: { name: true, email: true } } },
        },
        host: { select: { name: true } },
      },
    });

    if (!room) {
      return NextResponse.json(
        { error: "Room not found" },
        { status: 404 }
      );
    }

    const participant = room.participants.find(
          (p) => p.userId === senderId
        );
    if (!participant) {
      return NextResponse.json(
        { error: "Not a participant in this room" },
        { status: 403 }
      );
    }

    // Handle different message types
    switch (type) {
      case "offer":
      case "answer":
        // Broadcast SDP offer/answer to the other participant
        const otherParticipant = room.participants.find(
          (p) => p.userId !== senderId
        );

        if (otherParticipant) {
          return NextResponse.json({
            status: "broadcast",
            type,
            senderId,
            payload,
            recipientId: otherParticipant.userId,
          });
        }
        return NextResponse.json({
          status: "no_other_participant",
          type,
          senderId,
        });

      case "ice-candidate":
        // Broadcast ICE candidate to the other participant
        const iceRecipient = room.participants.find(
          (p) => p.userId !== senderId
        );

        if (iceRecipient) {
          return NextResponse.json({
            status: "broadcast",
            type,
            senderId,
            payload: { candidate: payload?.candidate },
            recipientId: iceRecipient.userId,
          });
        }
        return NextResponse.json({
          status: "no_other_participant",
          type,
          senderId,
        });

      case "ready":
        // Update participant ready state in database
        await prisma.roomParticipant.updateMany({
          where: { roomId: room.id, userId: senderId },
          data: { isReady: payload?.isReady },
        });

        // Check if both participants are ready and have a frame selected
        const updatedRoom = await prisma.room.findUnique({
          where: { id: room.id },
          include: {
            participants: {
              include: { user: true },
            },
            selectedFrame: true,
          },
        });

        if (updatedRoom?.hostId && updatedRoom.participants.length === 2) {
          const hostReady =
            updatedRoom.participants.find((p) => p.role === "HOST")?.isReady;
          const guestReady =
            updatedRoom.participants.find((p) => p.role === "GUEST")?.isReady;

          const bothReady =
            hostReady &&
            guestReady &&
            updatedRoom.selectedFrameId;

          if (bothReady && updatedRoom.status === "WAITING") {
            await prisma.room.update({
              where: { id: room.id },
              data: { status: "READY" },
            });
          }
        }

        return NextResponse.json({
          status: "ready-updated",
          isReady: payload?.isReady,
        });

      case "heartbeat":
        // Acknowledge heartbeat
        return NextResponse.json({
          status: "ack",
          type,
          senderId,
          timestamp: payload?.timestamp,
        });

      default:
        return NextResponse.json(
          { error: "Unknown message type" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Signaling error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({ status: "ok" });
}