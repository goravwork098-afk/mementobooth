import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Clock, Heart, AlertTriangle } from "lucide-react";
import Lobby from "./lobby";

export default async function RoomPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect(`/login?callbackUrl=/room/${token}`);
  const userId = session.user.id;

  const room = await prisma.room.findUnique({
    where: { token },
    include: {
      participants: {
        include: { user: { select: { name: true, email: true } } },
      },
      host: { select: { name: true } },
    },
  });

  if (!room) {
    return (
      <main className="auth-page">
        <div className="auth-shell">
          <Link href="/" className="brand auth-brand">
            <span className="brand-mark">
              <Heart size={17} fill="currentColor" />
            </span>
            Memento Booth
          </Link>
          <section className="auth-card error-state">
            <AlertTriangle size={32} />
            <h1>Room Not Found</h1>
            <p>We couldn&apos;t find this booth.</p>
            <Link href="/dashboard" className="button">
              Go to Dashboard <ArrowRight size={16} />
            </Link>
          </section>
        </div>
      </main>
    );
  }

  // Ensure current user is a participant
  const currentParticipant = room.participants.find((p) => p.userId === userId);
  if (!currentParticipant) {
    return (
      <main className="auth-page">
        <div className="auth-shell">
          <Link href="/" className="brand auth-brand">
            <span className="brand-mark">
              <Heart size={17} fill="currentColor" />
            </span>
            Memento Booth
          </Link>
          <section className="auth-card error-state">
            <AlertTriangle size={32} />
            <h1>Access Denied</h1>
            <p>You are not a participant in this booth.</p>
            <Link href="/dashboard" className="button">
              Go to Dashboard <ArrowRight size={16} />
            </Link>
          </section>
        </div>
      </main>
    );
  }

  // Handle expired/completed
  if (room.expiresAt <= new Date() || room.status === "COMPLETED") {
    return (
      <main className="auth-page">
        <div className="auth-shell">
          <Link href="/" className="brand auth-brand">
            <span className="brand-mark">
              <Heart size={17} fill="currentColor" />
            </span>
            Memento Booth
          </Link>
          <section className="auth-card error-state">
            <Clock size={32} />
            <h1>Room Closed</h1>
            <p>This session has ended.</p>
            <Link href="/dashboard" className="button">
              Go to Dashboard <ArrowRight size={16} />
            </Link>
          </section>
        </div>
      </main>
    );
  }

  const baseUrl =
    process.env.NEXTAUTH_URL ?? process.env.VERCEL_URL ?? "http://localhost:3133";
  const inviteUrl = `${baseUrl}/join/${room.token}`;

  return (
    <Lobby
      roomId={room.id}
      token={room.token}
      code={room.code}
      inviteUrl={inviteUrl}
      initialRoomState={{
        status: room.status,
        expiresAt: room.expiresAt.toISOString(),
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
      }}
      currentUserId={userId}
      isHost={currentParticipant.role === "HOST"}
    />
  );
}
