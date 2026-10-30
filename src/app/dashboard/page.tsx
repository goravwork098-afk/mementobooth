import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Camera,
  Heart,
  LogOut,
  Sparkles,
  Users,
} from "lucide-react";
import { auth } from "@/auth";
import { signOutAction } from "@/app/actions/session";
import { createRoomAction } from "@/app/actions/room";
import prisma from "@/lib/prisma";
import { FREE_TIER_ENTITLEMENTS } from "@/types/entitlements";
import {
  CopyInviteButton,
  DeleteAccountButton,
  RoomCountdown,
  CreateBoothButton,
} from "./components";
import { deleteAccountAction } from "@/app/actions/session";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // JWT sessions may not include id — look up by email as fallback
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
        include: { user: { select: { name: true, email: true } } },
      },
      selectedFrame: { select: { name: true, slug: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Also fetch rooms where user is a guest participant
  const guestRooms = await prisma.room.findMany({
    where: {
      participants: { some: { userId, role: "GUEST" } },
      status: { in: ["WAITING", "READY"] },
      expiresAt: { gt: new Date() },
    },
    include: {
      participants: {
        include: { user: { select: { name: true, email: true } } },
      },
      selectedFrame: { select: { name: true, slug: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const allRooms = [...activeRooms, ...guestRooms];

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
    <main className="dashboard-page">
      {/* ── Nav ── */}
      <nav className="dashboard-nav">
        <Link href="/" className="brand">
          <span className="brand-mark">
            <Heart size={17} fill="currentColor" />
          </span>
          Memento Booth
        </Link>
        <div className="dashboard-user">
          <span className="avatar">{name[0]?.toUpperCase()}</span>
          <span className="user-name">{name}</span>
          <form action={signOutAction}>
            <button className="icon-button" aria-label="Sign out" title="Sign out">
              <LogOut size={17} />
            </button>
          </form>
        </div>
      </nav>

      {/* ── Welcome + Create ── */}
      <section className="welcome-panel">
        <div className="welcome-copy">
          <p className="eyebrow">
            <Sparkles size={14} /> your little corner
          </p>
          <h1>
            Welcome, {name}.
            <br />
            <em>Ready for a moment?</em>
          </h1>
          <p>
            Start a private booth and invite your person. Your photos stay
            in your browser — never on our servers.
          </p>

          <div className="welcome-actions">
            <form action={createRoomAction}>
              <CreateBoothButton />
            </form>
            <span className="usage-info">
              <Camera size={13} /> {roomsUsed} of {roomsMax} booths this month
            </span>
          </div>
        </div>
        <div className="welcome-art">
          <div className="dash-heart">
            <Heart size={32} fill="currentColor" />
          </div>
          <div className="dash-card">
            <Camera size={18} />
            <span>
              your next memory
              <br />
              <strong>starts with a hello</strong>
            </span>
          </div>
        </div>
      </section>

      {/* ── Active Rooms ── */}
      <section className="rooms-section">
        <h2 className="rooms-heading">
          <Users size={20} /> Active Booths
        </h2>

        {allRooms.length === 0 ? (
          <div className="dashboard-empty">
            <div className="empty-icon">
              <Camera size={22} />
            </div>
            <h3>No booths yet</h3>
            <p>Create your first room and send the invite to your person.</p>
          </div>
        ) : (
          <div className="rooms-grid">
            {allRooms.map((room) => {
              const isHost = room.hostId === userId;
              const guestParticipant = room.participants.find(
                (p) => p.role === "GUEST"
              );
              const inviteUrl = `${baseUrl}/join/${room.token}`;

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
                        ? "Waiting"
                        : "Ready"}
                    </span>
                  </div>

                  <div className="room-card-meta">
                    <RoomCountdown
                      expiresAt={room.expiresAt.toISOString()}
                    />
                    {room.selectedFrame ? (
                      <span className="frame-badge">
                        🖼 {room.selectedFrame.name}
                      </span>
                    ) : (
                      <span className="frame-badge frame-none">
                        No frame yet
                      </span>
                    )}
                  </div>

                  <div className="room-card-people">
                    <span className="participant-chip host-chip">
                      {isHost ? "You (Host)" : room.participants.find((p) => p.role === "HOST")?.user.name ?? "Host"}
                    </span>
                    {guestParticipant ? (
                      <span className="participant-chip guest-chip">
                        {guestParticipant.userId === userId
                          ? "You (Guest)"
                          : guestParticipant.user.name ??
                            guestParticipant.user.email ??
                            "Guest"}
                      </span>
                    ) : (
                      <span className="participant-chip waiting-chip">
                        Waiting for guest…
                      </span>
                    )}
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
                    {isHost ? "Open Lobby" : "Rejoin"}{" "}
                    <ArrowRight size={14} />
                  </Link>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Account ── */}
      <section className="account-section">
        <h3>Account</h3>
        <div className="account-actions">
          <form action={signOutAction}>
            <button className="button button-quiet button-small">
              <LogOut size={14} /> Sign Out
            </button>
          </form>
          <DeleteAccountButton action={deleteAccountAction} />
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="dashboard-footer">
        <span>Private by design.</span>
        <span>© 2026 Memento Booth</span>
      </footer>
    </main>
  );
}
