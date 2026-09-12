import Link from "next/link";
import { redirect } from "next/navigation";
import { Heart, ArrowRight, Users, Clock, AlertTriangle } from "lucide-react";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { joinRoomAction } from "@/app/actions/join";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function JoinPage({ params }: PageProps) {
  const { token } = await params;
  const session = await auth();

  const room = await prisma.room.findUnique({
    where: { token },
    include: {
      participants: {
        include: { user: { select: { name: true, email: true } } },
      },
      host: { select: { name: true } },
    },
  });

  // ── Invalid token ──
  if (!room) {
    return (
      <main className="auth-page">
        <div className="auth-orbit orbit-one" />
        <div className="auth-orbit orbit-two" />
        <div className="auth-shell">
          <Link href="/" className="brand auth-brand">
            <span className="brand-mark">
              <Heart size={17} fill="currentColor" />
            </span>
            Memento Booth
          </Link>
          <section className="auth-card">
            <div className="error-state">
              <AlertTriangle size={32} />
              <h1>Invalid Invite</h1>
              <p>This invite link is not valid. Ask your partner for a new one.</p>
              <Link href="/" className="button">
                Go Home <ArrowRight size={16} />
              </Link>
            </div>
          </section>
        </div>
      </main>
    );
  }

  // ── Expired ──
  if (room.expiresAt <= new Date()) {
    return (
      <main className="auth-page">
        <div className="auth-orbit orbit-one" />
        <div className="auth-orbit orbit-two" />
        <div className="auth-shell">
          <Link href="/" className="brand auth-brand">
            <span className="brand-mark">
              <Heart size={17} fill="currentColor" />
            </span>
            Memento Booth
          </Link>
          <section className="auth-card">
            <div className="error-state">
              <Clock size={32} />
              <h1>Room Expired</h1>
              <p>This booth session has ended. Ask your partner to create a new one.</p>
              <Link href="/" className="button">
                Go Home <ArrowRight size={16} />
              </Link>
            </div>
          </section>
        </div>
      </main>
    );
  }

  // ── Full ──
  if (room.participants.length >= 2) {
    // If user is already a participant, redirect to room
    if (session?.user?.id) {
      const isParticipant = room.participants.some(
        (p) => p.userId === session.user!.id
      );
      if (isParticipant) redirect(`/room/${token}`);
    }

    return (
      <main className="auth-page">
        <div className="auth-orbit orbit-one" />
        <div className="auth-orbit orbit-two" />
        <div className="auth-shell">
          <Link href="/" className="brand auth-brand">
            <span className="brand-mark">
              <Heart size={17} fill="currentColor" />
            </span>
            Memento Booth
          </Link>
          <section className="auth-card">
            <div className="error-state">
              <Users size={32} />
              <h1>Room is Full</h1>
              <p>This booth already has two people. It&apos;s a cozy space for two!</p>
              <Link href="/" className="button">
                Go Home <ArrowRight size={16} />
              </Link>
            </div>
          </section>
        </div>
      </main>
    );
  }

  // ── Not authenticated → show invite page with sign-in CTA ──
  if (!session?.user) {
    return (
      <main className="auth-page">
        <div className="auth-orbit orbit-one" />
        <div className="auth-orbit orbit-two" />
        <div className="auth-shell">
          <Link href="/" className="brand auth-brand">
            <span className="brand-mark">
              <Heart size={17} fill="currentColor" />
            </span>
            Memento Booth
          </Link>
          <section className="auth-card">
            <div className="auth-kicker">
              <Heart size={14} fill="currentColor" /> you&apos;re invited
            </div>
            <h1>
              Join <em>{room.host.name ?? "your person"}&apos;s</em> booth
            </h1>
            <p className="auth-intro">
              Room <strong>{room.code}</strong> is waiting for you. Sign in to
              join and start making memories together.
            </p>
            <Link
              href={`/login?callbackUrl=${encodeURIComponent(`/join/${token}`)}`}
              className="button auth-submit"
            >
              Sign in to Join <ArrowRight size={16} />
            </Link>
          </section>
        </div>
      </main>
    );
  }

  // ── Authenticated: already a participant → redirect ──
  const isParticipant = room.participants.some(
    (p) => p.userId === session.user!.id
  );
  if (isParticipant) {
    redirect(`/room/${token}`);
  }

  // ── Authenticated: can join → show join confirmation ──
  const joinWithToken = joinRoomAction.bind(null, token);

  return (
    <main className="auth-page">
      <div className="auth-orbit orbit-one" />
      <div className="auth-orbit orbit-two" />
      <div className="auth-shell">
        <Link href="/" className="brand auth-brand">
          <span className="brand-mark">
            <Heart size={17} fill="currentColor" />
          </span>
          Memento Booth
        </Link>
        <section className="auth-card">
          <div className="auth-kicker">
            <Heart size={14} fill="currentColor" /> you&apos;re invited
          </div>
          <h1>
            Join <em>{room.host.name ?? "your person"}&apos;s</em> booth
          </h1>
          <p className="auth-intro">
            Room <strong>{room.code}</strong> is ready and waiting. Step in and
            make a little memory together.
          </p>
          <form action={joinWithToken}>
            <button type="submit" className="button auth-submit">
              Join This Booth <ArrowRight size={16} />
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
