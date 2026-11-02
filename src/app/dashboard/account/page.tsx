import { redirect } from "next/navigation";
import { ShieldCheck, LogOut, Heart, Lock, Sparkles, AlertTriangle } from "lucide-react";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { FREE_TIER_ENTITLEMENTS } from "@/types/entitlements";
import { signOutAction, deleteAccountAction } from "@/app/actions/session";
import { UserAvatar, DeleteAccountButton, AvatarStudio } from "../components";

export default async function DashboardAccountPage() {
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

  const dbUserRecord = await prisma.user.findUnique({
    where: { id: userId },
    select: { image: true },
  });
  const userImage = dbUserRecord?.image ?? session.user.image ?? null;

  const name =
    session.user.name ?? session.user.email?.split("@")[0] ?? "there";
  const userEmail = session.user.email ?? "";

  // Current month usage
  const yearMonth = `${new Date().getFullYear()}-${String(
    new Date().getMonth() + 1
  ).padStart(2, "0")}`;
  const usage = await prisma.usageRecord.findUnique({
    where: { userId_yearMonth: { userId, yearMonth } },
  });
  const roomsUsed = usage?.roomsCreatedCount ?? 0;
  const roomsMax = FREE_TIER_ENTITLEMENTS.maxRoomsPerMonth;

  return (
    <div className="dashboard-page-container">
      <div className="page-header-row">
        <div>
          <h1 className="page-heading">
            <ShieldCheck size={24} /> Account & Privacy
          </h1>
          <p className="page-subheading">
            Manage your personal profile, review our zero-server privacy model, or sign out.
          </p>
        </div>
      </div>

      <div className="account-grid-layout">
        {/* Profile Card */}
        <div className="account-card profile-summary-card">
          <div className="profile-hero-row">
            <UserAvatar name={name} email={userEmail} imageUrl={userImage} size={64} />
            <div className="profile-hero-info">
              <h2>{name}</h2>
              <span className="profile-email-badge">{userEmail}</span>
              <span className="tier-tag">Free Couple Plan</span>
            </div>
          </div>

          <div className="account-stats-row">
            <div className="account-stat-box">
              <span className="stat-label">Monthly Allowance</span>
              <strong className="stat-val">
                {roomsUsed} / {roomsMax} booths
              </strong>
              <small className="stat-hint">3 private rooms each month</small>
            </div>
            <div className="account-stat-box">
              <span className="stat-label">Privacy Mode</span>
              <strong className="stat-val stat-val-safe">
                <Lock size={14} /> Strict Ephemeral
              </strong>
              <small className="stat-hint">Zero images stored on server</small>
            </div>
          </div>
        </div>

        {/* Interactive Avatar Studio */}
        <AvatarStudio
          userName={name}
          userEmail={userEmail}
        />

        {/* Privacy Architecture Guarantees */}
        <div className="account-card privacy-guarantees-card">
          <div className="card-section-header">
            <Heart size={18} className="text-rose" />
            <h3>Our Privacy Principles</h3>
          </div>
          <ul className="privacy-features-list">
            <li>
              <div className="privacy-bullet-icon">
                <Lock size={14} />
              </div>
              <div>
                <strong>Client-Side Processing Exclusively</strong>
                <p>
                  Photo collage compositing happens directly inside your browser
                  canvas. High-resolution raw photos are never transmitted to our
                  backend.
                </p>
              </div>
            </li>
            <li>
              <div className="privacy-bullet-icon">
                <Sparkles size={14} />
              </div>
              <div>
                <strong>Peer-to-Peer Camera Streaming</strong>
                <p>
                  Live video streams between you and your partner travel over
                  encrypted WebRTC connections.
                </p>
              </div>
            </li>
            <li>
              <div className="privacy-bullet-icon">
                <ShieldCheck size={14} />
              </div>
              <div>
                <strong>Automatic Session Eviction</strong>
                <p>
                  Room tokens expire automatically within 2 hours, and temporary
                  session states are purged cleanly.
                </p>
              </div>
            </li>
          </ul>
        </div>

        {/* Session & Danger Zone */}
        <div className="account-card danger-zone-card">
          <div className="card-section-header">
            <AlertTriangle size={18} className="text-rose" />
            <h3>Session & Account Controls</h3>
          </div>
          <p className="danger-zone-desc">
            End your current login session across this device, or permanently
            delete your account and all associated custom frames.
          </p>
          <div className="account-actions-flex">
            <form action={signOutAction}>
              <button className="button button-quiet button-small">
                <LogOut size={14} /> Sign Out of Memento Booth
              </button>
            </form>
            <DeleteAccountButton action={deleteAccountAction} />
          </div>
        </div>
      </div>
    </div>
  );
}

