import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Camera,
  Users,
  Image as ImageIcon,
} from "lucide-react";
import { auth } from "@/auth";
import { createRoomAction } from "@/app/actions/room";
import prisma from "@/lib/prisma";
import {
  CopyInviteButton,
  RoomCountdown,
  CreateBoothButton,
  UserAvatar,
} from "../components";

export default async function DashboardBoothsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  let userId = session.user.id;
  if (!userId && session.user.email) {
    const dbUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    userId = dbUser?.id;
  }
  if (!userId) redirect("/login");

  const name =
    session.user.name ?? session.user.email?.split("@")[0] ?? "there";

  // Fetch active rooms (WAITING or READY, not expired)
  const activeRooms = await prisma.room.findMany({
    where: {
      hostId: userId,
      status: { in: ["WAITING", "READY"] },
      expiresAt: { gt: new Date() },
    },
    include: {
      participants: {
        include: { user: { select: { name: true, email: true, image: true } } },
      },
      selectedFrame: { select: { name: true, slug: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Fetch guest rooms
  const guestRooms = await prisma.room.findMany({
    where: {
      participants: { some: { userId, role: "GUEST" } },
      status: { in: ["WAITING", "READY"] },
      expiresAt: { gt: new Date() },
    },
    include: {
      participants: {
        include: { user: { select: { name: true, email: true, image: true } } },
      },
      selectedFrame: { select: { name: true, slug: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const allRooms = [...activeRooms, ...guestRooms];
  const baseUrl =
    process.env.NEXTAUTH_URL ?? process.env.VERCEL_URL ?? "http://localhost:3133";

  return (
    <div className="dashboard-page-container">
      <div className="page-header-row">
        <div>
          <h1 className="page-heading">
            <Users size={24} /> Active Booths
          </h1>
          <p className="page-subheading">
            Manage your live photobooth rooms, invite your partner, or jump back in.
          </p>
        </div>
        <form action={createRoomAction}>
          <CreateBoothButton />
        </form>
      </div>

      {allRooms.length === 0 ? (
        <div className="dashboard-empty-card">
          <div className="empty-icon">
            <Camera size={26} />
          </div>
          <h3>No active booths right now</h3>
          <p>
            Start a new booth session to generate a shareable link and a private 4-letter room code.
          </p>
          <form action={createRoomAction}>
            <CreateBoothButton />
          </form>
        </div>
      ) : (
        <div className="rooms-grid">
          {allRooms.map((room) => {
            const isHost = room.hostId === userId;
            const hostParticipant = room.participants.find(
              (p) => p.role === "HOST"
            );
            const guestParticipant = room.participants.find(
              (p) => p.role === "GUEST"
            );
            const inviteUrl = `${baseUrl}/join/${room.token}`;

            const hostName = isHost
              ? name
              : hostParticipant?.user?.name ?? "Host";
            const guestName = guestParticipant
              ? guestParticipant.userId === userId
                ? name
                : guestParticipant.user?.name ??
                  guestParticipant.user?.email ??
                  "Guest"
              : null;

            return (
              <article key={room.id} className="room-card">
                <div className="room-card-header">
                  <span className="room-code">{room.code}</span>
                  <span
                    className={`status-badge ${
                      room.status === "WAITING"
                        ? "status-waiting"
                        : "status-ready"
                    }`}
                  >
                    {room.status === "WAITING" ? "Waiting for Guest" : "Ready"}
                  </span>
                </div>

                <div className="room-card-meta">
                  <RoomCountdown expiresAt={room.expiresAt.toISOString()} />
                  {room.selectedFrame ? (
                    <span className="frame-badge">
                      <ImageIcon size={13} />
                      {room.selectedFrame.name}
                    </span>
                  ) : (
                    <span className="frame-badge frame-none">
                      Standard Frame
                    </span>
                  )}
                </div>

                {/* Couple Participant Display with Dynamic Vector Avatars */}
                <div className="room-card-people-duo">
                  <div className="participant-item">
                    <UserAvatar
                      name={hostName}
                      email={hostParticipant?.user?.email}
                      imageUrl={hostParticipant?.user?.image}
                      size={34}
                    />
                    <div className="participant-info">
                      <strong>{isHost ? "You (Host)" : hostName}</strong>
                      <small className="participant-role">Booth Host</small>
                    </div>
                  </div>

                  <div className="participant-item">
                    {guestParticipant ? (
                      <>
                        <UserAvatar
                          name={guestName}
                          email={guestParticipant.user?.email}
                          imageUrl={guestParticipant.user?.image}
                          size={34}
                        />
                        <div className="participant-info">
                          <strong>
                            {guestParticipant.userId === userId
                              ? "You (Guest)"
                              : guestName}
                          </strong>
                          <small className="participant-role">Guest Connected</small>
                        </div>
                      </>
                    ) : (
                      <div className="participant-waiting-box">
                        <span className="waiting-pulse" />
                        <span>Waiting for partner…</span>
                      </div>
                    )}
                  </div>
                </div>

                {isHost && !guestParticipant && (
                  <div className="room-card-invite">
                    <code className="invite-url">{inviteUrl}</code>
                    <CopyInviteButton url={inviteUrl} />
                  </div>
                )}

                <Link
                  href={`/room/${room.token}`}
                  className="button button-small room-rejoin"
                >
                  {isHost ? "Enter Photobooth" : "Rejoin Booth"}{" "}
                  <ArrowRight size={14} />
                </Link>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

