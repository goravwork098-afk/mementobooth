import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { FREE_TIER_ENTITLEMENTS } from "@/types/entitlements";
import { signOutAction } from "@/app/actions/session";
import {
  UserAvatar,
  DashboardSidebarNav,
  DashboardMobileNav,
  DashboardLayoutShell,
} from "./components";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
  const userEmail = session.user.email ?? "";

  const dbUserRecord = await prisma.user.findUnique({
    where: { id: userId },
    select: { image: true },
  });
  const userImage = dbUserRecord?.image ?? session.user.image ?? null;

  // Count active rooms (WAITING or READY, not expired)
  const activeCount = await prisma.room.count({
    where: {
      OR: [
        { hostId: userId },
        { participants: { some: { userId, role: "GUEST" } } },
      ],
      status: { in: ["WAITING", "READY"] },
      expiresAt: { gt: new Date() },
    },
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
  const quotaPercent = Math.min(100, Math.round((roomsUsed / roomsMax) * 100));

  return (
    <DashboardLayoutShell
      sidebarTop={<DashboardSidebarNav activeRoomsCount={activeCount} />}
      sidebarBottom={
        <>
          {/* Monthly Quota Meter */}
          <div className="sidebar-quota-card">
            <div className="quota-header">
              <span className="quota-label">Monthly Booths</span>
              <span className="quota-count">
                {roomsUsed} / {roomsMax}
              </span>
            </div>
            <div className="quota-bar-track">
              <div
                className="quota-bar-fill"
                style={{ width: `${quotaPercent}%` }}
              />
            </div>
            <small className="quota-hint">Resets on the 1st of each month</small>
          </div>

          {/* User Profile Card */}
          <div className="sidebar-user-card">
            <UserAvatar name={name} email={userEmail} imageUrl={userImage} size={42} />
            <div className="sidebar-user-meta">
              <strong className="sidebar-user-name">{name}</strong>
              <small className="sidebar-user-email">{userEmail}</small>
            </div>
            <form action={signOutAction} className="sidebar-logout-form">
              <button
                className="sidebar-logout-btn"
                aria-label="Sign out"
                title="Sign out"
              >
                <LogOut size={16} />
              </button>
            </form>
          </div>
        </>
      }
      mobileUserActions={
        <>
          <UserAvatar name={name} email={userEmail} imageUrl={userImage} size={32} />
          <form action={signOutAction}>
            <button className="mobile-logout-btn" aria-label="Sign out" title="Sign out">
              <LogOut size={16} />
            </button>
          </form>
        </>
      }
      mobileNav={<DashboardMobileNav activeRoomsCount={activeCount} />}
    >
      {children}
    </DashboardLayoutShell>
  );
}

