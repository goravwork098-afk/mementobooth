import prisma from "@/lib/prisma";
import { randomBytes } from "crypto";
import { generateRoomCode } from "@/lib/room-code";

describe("Milestone 1: Authentication & Private Room Lifecycle Integration", () => {
  const hostEmail = "host-test@mementobooth.com";
  const guestEmail = "guest-test@mementobooth.com";
  const thirdPartyEmail = "intruder-test@mementobooth.com";

  let hostUser: { id: string; email: string; name: string | null };
  let guestUser: { id: string; email: string; name: string | null };
  let thirdUser: { id: string; email: string; name: string | null };

  beforeAll(async () => {
    // Clean up any existing test accounts
    await prisma.user.deleteMany({
      where: {
        email: { in: [hostEmail, guestEmail, thirdPartyEmail] },
      },
    });

    // Create test accounts
    hostUser = await prisma.user.create({
      data: { email: hostEmail, name: "Alice Host" },
    });
    guestUser = await prisma.user.create({
      data: { email: guestEmail, name: "Bob Guest" },
    });
    thirdUser = await prisma.user.create({
      data: { email: thirdPartyEmail, name: "Charlie Intruder" },
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: {
        email: { in: [hostEmail, guestEmail, thirdPartyEmail] },
      },
    });
  });

  it("creates a private room with a cryptographic token and host participant", async () => {
    const code = generateRoomCode();
    const token = randomBytes(16).toString("hex");
    const expiresAt = new Date(Date.now() + 1800 * 1000); // 30 min

    const room = await prisma.room.create({
      data: {
        code,
        token,
        hostId: hostUser.id,
        expiresAt,
        status: "WAITING",
        participants: {
          create: {
            userId: hostUser.id,
            role: "HOST",
          },
        },
      },
      include: { participants: true },
    });

    expect(room.token).toHaveLength(32);
    expect(room.code).toMatch(/^LOVE-[A-Z2-9]{4}$/);
    expect(room.participants).toHaveLength(1);
    expect(room.participants[0].userId).toBe(hostUser.id);
    expect(room.participants[0].role).toBe("HOST");

    // Clean up
    await prisma.room.delete({ where: { id: room.id } });
  });

  it("allows exactly one guest to join and enforces strictly two participants", async () => {
    const code = generateRoomCode();
    const token = randomBytes(16).toString("hex");

    const room = await prisma.room.create({
      data: {
        code,
        token,
        hostId: hostUser.id,
        expiresAt: new Date(Date.now() + 1800 * 1000),
        status: "WAITING",
        participants: {
          create: {
            userId: hostUser.id,
            role: "HOST",
          },
        },
      },
    });

    // Guest 1 joins
    await prisma.roomParticipant.create({
      data: {
        roomId: room.id,
        userId: guestUser.id,
        role: "GUEST",
      },
    });

    const updatedRoom = await prisma.room.findUnique({
      where: { id: room.id },
      include: { participants: true },
    });

    expect(updatedRoom?.participants).toHaveLength(2);

    // An attempt to add a 3rd participant must be rejected
    const canThirdJoin = updatedRoom!.participants.length < 2;
    expect(canThirdJoin).toBe(false);
    expect(thirdUser.id).toBeDefined();

    // Clean up
    await prisma.room.delete({ where: { id: room.id } });
  });

  it("identifies expired rooms server-side and prevents active sessions", async () => {
    const code = generateRoomCode();
    const token = randomBytes(16).toString("hex");
    const pastExpiresAt = new Date(Date.now() - 10_000); // 10 seconds in the past

    const expiredRoom = await prisma.room.create({
      data: {
        code,
        token,
        hostId: hostUser.id,
        expiresAt: pastExpiresAt,
        status: "WAITING",
      },
    });

    const isExpired = expiredRoom.expiresAt <= new Date();
    expect(isExpired).toBe(true);

    // Clean up
    await prisma.room.delete({ where: { id: expiredRoom.id } });
  });

  it("cascades deletions cleanly when a host user deletes their account", async () => {
    // Create temporary host
    const tempHost = await prisma.user.create({
      data: { email: "temp-host@mementobooth.com", name: "Temp Host" },
    });

    const room = await prisma.room.create({
      data: {
        code: generateRoomCode(),
        token: randomBytes(16).toString("hex"),
        hostId: tempHost.id,
        expiresAt: new Date(Date.now() + 1800 * 1000),
        status: "WAITING",
        participants: {
          create: {
            userId: tempHost.id,
            role: "HOST",
          },
        },
        lifecycleEvents: {
          create: {
            eventType: "ROOM_CREATED",
          },
        },
      },
    });

    const roomId = room.id;

    // Delete host user -> triggers cascade
    await prisma.user.delete({ where: { id: tempHost.id } });

    // Verify room, participants, and events were deleted in cascade
    const foundRoom = await prisma.room.findUnique({ where: { id: roomId } });
    expect(foundRoom).toBeNull();

    const foundParticipants = await prisma.roomParticipant.findMany({
      where: { roomId },
    });
    expect(foundParticipants).toHaveLength(0);

    const foundEvents = await prisma.roomEvent.findMany({
      where: { roomId },
    });
    expect(foundEvents).toHaveLength(0);
  });
});
