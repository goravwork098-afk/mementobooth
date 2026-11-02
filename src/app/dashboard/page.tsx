import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Camera,
  Heart,
  Sparkles,
  Users,
  Image as ImageIcon,
  KeyRound,
  ShieldCheck,
  Layers,
} from "lucide-react";
import { auth } from "@/auth";
import { createRoomAction } from "@/app/actions/room";
import prisma from "@/lib/prisma";
import { FREE_TIER_ENTITLEMENTS } from "@/types/entitlements";
import {
  CopyInviteButton,
  RoomCountdown,
  CreateBoothButton,
  UserAvatar,
  QuickJoinInline,
} from "./components";

export default async function DashboardOverviewPage() {
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
      OR: [
        { hostId: userId },
        { participants: { some: { userId, role: "GUEST" } } },
      ],
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
    take: 2,
  });

  const totalActiveRoomsCount = await prisma.room.count({
    where: {
      OR: [
        { hostId: userId },
        { participants: { some: { userId, role: "GUEST" } } },
      ],
      status: { in: ["WAITING", "READY"] },
      expiresAt: { gt: new Date() },
    },
  });

  // Count user's custom frames
  const customFramesCount = await prisma.frame.count({
    where: { createdById: userId },
  });

  // Current month usage
  const yearMonth = `${new Date().getFullYear()}-${String(
    new Date().getMonth() + 1
  ).padStart(2, "0")}`;
  const usage = await prisma.usageRecord.findUnique({
    where: { userId_yearMonth: { userId, yearMonth } },
  });
  const roomsUsed = usage?.roomsCreatedCount ?? 0;
  const roomsMax = FREE_TIER_ENTITLEMENTS.maxRoomsPerMonth;

  const baseUrl =
    process.env.NEXTAUTH_URL ?? process.env.VERCEL_URL ?? "http://localhost:3133";

  return (
    <div className="overview-container">
      {/* ── Welcome & Command Panel ── */}
      <section className="welcome-panel">
        <div className="welcome-copy">
          <p className="eyebrow">
            <Sparkles size={14} /> private room for two
          </p>
          <h1>
            Welcome, {name}.
            <br />
            <em>Ready for a moment?</em>
          </h1>
          <p>
            Start a private booth or join your person. Photos are composed
            directly in your browser and never saved on servers.
          </p>

          <div className="welcome-actions">
            <form action={createRoomAction}>
              <CreateBoothButton />
            </form>
            <div className="quick-join-wrapper">
              <QuickJoinInline />
            </div>
          </div>
        </div>

        <div className="welcome-art">
          <div className="dash-heart">
            <Heart size={32} fill="currentColor" />
          </div>
          <div className="dash-card">
            <Camera size={18} />
            <span>
              your next keepsake
              <br />
              <strong>starts right here</strong>
            </span>
          </div>
        </div>
      </section>

      {/* ── Quick Overview Stats Hub ── */}
      <section className="overview-hub-grid">
        <Link href="/dashboard/booths" className="hub-card">
          <div className="hub-card-icon tone-rose">
            <Camera size={22} />
          </div>
          <div className="hub-card-content">
            <div className="hub-card-metric">{totalActiveRoomsCount}</div>
            <div className="hub-card-title">Active Booths</div>
            <p className="hub-card-desc">
              {totalActiveRoomsCount > 0
                ? "Rooms currently open and awaiting capture"
                : "No open sessions right now"}
            </p>
          </div>
          <span className="hub-card-arrow">
            <ArrowRight size={16} />
          </span>
        </Link>

        <Link href="/dashboard/frames" className="hub-card">
          <div className="hub-card-icon tone-lavender">
            <Layers size={22} />
          </div>
          <div className="hub-card-content">
            <div className="hub-card-metric">{customFramesCount}</div>
            <div className="hub-card-title">Custom Frames</div>
            <p className="hub-card-desc">
              {customFramesCount > 0
                ? `${customFramesCount} tailored designs created by you`
                : "Design romantic 2-cut & 4-cut frames"}
            </p>
          </div>
          <span className="hub-card-arrow">
            <ArrowRight size={16} />
          </span>
        </Link>

        <Link href="/dashboard/join" className="hub-card">
          <div className="hub-card-icon tone-gold">
            <KeyRound size={22} />
          </div>
          <div className="hub-card-content">
            <div className="hub-card-metric">4-Letter</div>
            <div className="hub-card-title">Enter Room Code</div>
            <p className="hub-card-desc">
              Instantly connect to your partner&apos;s booth session
            </p>
          </div>
          <span className="hub-card-arrow">
            <ArrowRight size={16} />
          </span>
        </Link>

        <Link href="/dashboard/account" className="hub-card">
          <div className="hub-card-icon tone-green">
            <ShieldCheck size={22} />
          </div>
          <div className="hub-card-content">
            <div className="hub-card-metric">{roomsMax - roomsUsed} Left</div>
            <div className="hub-card-title">Monthly Quota & Safety</div>
            <p className="hub-card-desc">
              {roomsUsed} of {roomsMax} booths used this calendar month
            </p>
          </div>
          <span className="hub-card-arrow">
            <ArrowRight size={16} />
          </span>
        </Link>
      </section>

      {/* ── Active Booths Section (Recent) ── */}
      <section className="dashboard-section">
        <div className="section-title-row">
          <div>
            <h2 className="rooms-heading">
              <Users size={20} /> Active Sessions
            </h2>
            <span className="section-subtitle">
              {totalActiveRoomsCount > 0
                ? "Live photobooth rooms ready for camera sync"
                : "No active rooms right now"}
            </span>
          </div>
          {totalActiveRoomsCount > 2 && (
            <Link href="/dashboard/booths" className="section-see-all-link">
              View all ({totalActiveRoomsCount}) <ArrowRight size={14} />
            </Link>
          )}
        </div>

        {activeRooms.length === 0 ? (
          <div className="dashboard-empty-card">
            <div className="empty-icon">
              <Camera size={24} />
            </div>
            <h3>No active booths right now</h3>
            <p>
              Create a room to generate a private 4-letter code, or enter your
              partner&apos;s code to connect.
            </p>
            <form action={createRoomAction}>
              <CreateBoothButton />
            </form>
          </div>
        ) : (
          <div className="rooms-grid">
            {activeRooms.map((room) => {
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
                      {room.status === "WAITING"
                        ? "Waiting for Guest"
                        : "Ready"}
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
                            <small className="participant-role">
                              Guest Connected
                            </small>
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
      </section>
    </div>
  );
}
