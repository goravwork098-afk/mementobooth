import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Layers, Sparkles, Palette } from "lucide-react";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { DashboardFramesManager } from "../components";

export default async function DashboardFramesPage() {
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

  // Fetch user's custom created frames
  const userFrames = await prisma.frame.findMany({
    where: { createdById: userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      description: true,
      category: true,
      slotCount: true,
      isPublic: true,
      configJson: true,
    },
  });

  // Fetch preset frames for the showcase shelf
  const featuredFrames = await prisma.frame.findMany({
    where: { category: { not: "CUSTOM" }, isPublic: true },
    take: 8,
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      description: true,
      category: true,
      slotCount: true,
      isPremium: true,
    },
  });

  return (
    <div className="dashboard-page-container">
      <div className="page-header-row">
        <div>
          <h1 className="page-heading">
            <Layers size={24} /> Frame Styles & Studio
          </h1>
          <p className="page-subheading">
            Design personalized photostrips with custom headers, palettes, and date stamps.
          </p>
        </div>
        <Link href="/dashboard/frames/studio" className="button button-small">
          <Palette size={15} /> Design Custom Frame
        </Link>
      </div>

      {/* Interactive Custom Frame Studio Launcher & User Frame Collection */}
      <Suspense fallback={<div className="loading-state">Loading Frame Studio…</div>}>
        <DashboardFramesManager userFrames={userFrames} />
      </Suspense>

      {/* Official Preset Shelf */}
      <div className="preset-frames-subgroup">
        <h3 className="user-frames-title">
          <Sparkles size={16} /> Official Presets
        </h3>
        <div className="frames-showcase-grid">
          {featuredFrames.length > 0 ? (
            featuredFrames.map((frame) => (
              <div key={frame.id} className="frame-showcase-card">
                <div className="frame-mini-preview">
                  <div className="frame-sample-slot slot-a" />
                  <div className="frame-sample-slot slot-b" />
                </div>
                <div className="frame-showcase-meta">
                  <strong>{frame.name}</strong>
                  <small>
                    {frame.slotCount}-cut &bull; {frame.category.toLowerCase()}
                  </small>
                </div>
              </div>
            ))
          ) : (
            <>
              <div className="frame-showcase-card">
                <div className="frame-mini-preview">
                  <div className="frame-sample-slot slot-a" />
                  <div className="frame-sample-slot slot-b" />
                </div>
                <div className="frame-showcase-meta">
                  <strong>Classic 2-Cut</strong>
                  <small>2-cut &bull; classic</small>
                </div>
              </div>
              <div className="frame-showcase-card">
                <div className="frame-mini-preview tone-rose">
                  <div className="frame-sample-slot slot-a" />
                  <div className="frame-sample-slot slot-b" />
                </div>
                <div className="frame-showcase-meta">
                  <strong>Romantic Blush</strong>
                  <small>2-cut &bull; romantic</small>
                </div>
              </div>
              <div className="frame-showcase-card">
                <div className="frame-mini-preview tone-lavender">
                  <div className="frame-sample-slot slot-a" />
                  <div className="frame-sample-slot slot-b" />
                </div>
                <div className="frame-showcase-meta">
                  <strong>Lavender Dream</strong>
                  <small>2-cut &bull; seasonal</small>
                </div>
              </div>
              <div className="frame-showcase-card">
                <div className="frame-mini-preview tone-gold">
                  <div className="frame-sample-slot slot-a" />
                  <div className="frame-sample-slot slot-b" />
                </div>
                <div className="frame-showcase-meta">
                  <strong>Golden Hour</strong>
                  <small>2-cut &bull; vintage</small>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

