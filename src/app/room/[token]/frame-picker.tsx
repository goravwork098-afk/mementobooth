"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Check,
  Loader2,
  Sparkles,
  Plus,
  Trash2,
  Globe,
  Layout,
  User,
} from "lucide-react";
import { selectFrameAction } from "@/app/actions/lobby";
import {
  deleteCustomFrameAction,
  toggleFramePublicAction,
} from "@/app/actions/frame";
import CustomFrameModal from "./custom-frame-modal";

interface Frame {
  id: string;
  slug: string;
  name: string;
  category: string;
  configJson: string;
  isPublic?: boolean;
  createdById?: string | null;
  creator?: { name: string | null } | null;
}

type FrameTab = "all" | "official" | "community" | "my";

export default function FramePicker({
  roomId,
  selectedFrameId,
  isHost,
}: {
  roomId: string;
  selectedFrameId: string | null;
  isHost: boolean;
}) {
  const [frames, setFrames] = useState<Frame[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<FrameTab>("all");

  const fetchFrames = useCallback(async () => {
    try {
      const res = await fetch("/api/frames");
      if (res.ok) {
        const data = await res.json();
        setFrames(data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFrames();
  }, [fetchFrames]);

  async function select(id: string) {
    if (!isHost || pendingId) return;
    setPendingId(id);
    try {
      await selectFrameAction(roomId, id);
    } finally {
      setPendingId(null);
    }
  }

  async function handleDeleteFrame(e: React.MouseEvent, frameId: string) {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this custom frame?")) return;

    try {
      await deleteCustomFrameAction(frameId);
      await fetchFrames();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete frame");
    }
  }

  async function handleTogglePublic(e: React.MouseEvent, frameId: string) {
    e.stopPropagation();
    try {
      await toggleFramePublicAction(frameId);
      await fetchFrames();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to toggle frame visibility");
    }
  }

  const handleFrameCreated = async (newFrameId: string) => {
    await fetchFrames();
    await select(newFrameId);
  };

  if (loading) {
    return (
      <div className="frame-picker-loading">
        <Loader2 className="spin" /> Loading frames...
      </div>
    );
  }

  const filteredFrames = frames.filter((f) => {
    if (activeTab === "official") return f.category !== "CUSTOM";
    if (activeTab === "community")
      return f.category === "CUSTOM" && f.isPublic;
    if (activeTab === "my") return Boolean(f.createdById);
    return true;
  });

  const selected = frames.find((f) => f.id === selectedFrameId) ?? frames[0];

  const hasMyFrames = frames.some((f) => Boolean(f.createdById));
  const hasCommunityFrames = frames.some(
    (f) => f.category === "CUSTOM" && f.isPublic
  );

  return (
    <div className="frame-picker">
      <div className="frame-picker-header">
        <div className="frame-title-row">
          <h3>
            <Sparkles size={16} /> Choose a Style
          </h3>
          {isHost && (
            <button
              type="button"
              className="button button-quiet button-sm"
              onClick={() => setIsModalOpen(true)}
            >
              <Plus size={14} /> Design Custom Frame
            </button>
          )}
        </div>
        {!isHost && (
          <span className="host-only-note">Only the host can change this</span>
        )}
      </div>

      {/* ── Category Filter Tabs ── */}
      <div className="frame-category-tabs">
        <button
          type="button"
          className={`frame-category-tab ${activeTab === "all" ? "active" : ""}`}
          onClick={() => setActiveTab("all")}
        >
          <Sparkles size={13} /> All ({frames.length})
        </button>
        <button
          type="button"
          className={`frame-category-tab ${activeTab === "official" ? "active" : ""}`}
          onClick={() => setActiveTab("official")}
        >
          <Layout size={13} /> Official Presets
        </button>
        {hasCommunityFrames && (
          <button
            type="button"
            className={`frame-category-tab ${activeTab === "community" ? "active" : ""}`}
            onClick={() => setActiveTab("community")}
          >
            <Globe size={13} /> Community Showcase
          </button>
        )}
        {hasMyFrames && (
          <button
            type="button"
            className={`frame-category-tab ${activeTab === "my" ? "active" : ""}`}
            onClick={() => setActiveTab("my")}
          >
            <User size={13} /> My Designs
          </button>
        )}
      </div>

      <div className="frame-grid">
        {/* Creator prompt card for host */}
        {isHost && (activeTab === "all" || activeTab === "my") && (
          <button
            type="button"
            className="frame-card frame-card-create"
            onClick={() => setIsModalOpen(true)}
          >
            <div className="create-frame-icon-wrap">
              <Plus size={24} />
            </div>
            <div className="frame-card-info">
              <strong>Custom Frame</strong>
              <small>Design your own</small>
            </div>
          </button>
        )}

        {filteredFrames.map((frame) => {
          const isSelected = frame.id === selectedFrameId;
          const isPending = frame.id === pendingId;
          const isCustom = frame.category === "CUSTOM";
          const isMyFrame = Boolean(frame.createdById);

          return (
            <button
              key={frame.id}
              className={`frame-card ${isSelected ? "selected" : ""}`}
              onClick={() => select(frame.id)}
              disabled={!isHost || isPending}
            >
              <div className={`frame-card-preview theme-${frame.slug}`}>
                <div className="slot-box" />
                <div className="slot-box" />
              </div>
              <div className="frame-card-info">
                <strong>{frame.name}</strong>
                <div className="frame-card-meta">
                  <small>{frame.category}</small>
                  {isCustom && frame.isPublic && (
                    <span className="frame-author-badge">
                      <Globe size={10} />
                      {frame.creator?.name ? `By ${frame.creator.name}` : "Community"}
                    </span>
                  )}
                </div>
              </div>

              {isSelected && (
                <div className="frame-check">
                  <Check size={14} />
                </div>
              )}
              {isPending && (
                <div className="frame-check">
                  <Loader2 size={14} className="spin" />
                </div>
              )}

              {isCustom && isHost && isMyFrame && (
                <div className="frame-owner-actions">
                  <button
                    type="button"
                    className={`frame-visibility-btn ${frame.isPublic ? "is-public" : ""}`}
                    onClick={(e) => handleTogglePublic(e, frame.id)}
                    title={
                      frame.isPublic
                        ? "Published to Community Showcase (Click to make private)"
                        : "Private to you (Click to share with Community Showcase)"
                    }
                  >
                    <Globe size={11} />
                  </button>
                  <button
                    type="button"
                    className="frame-delete-btn"
                    onClick={(e) => handleDeleteFrame(e, frame.id)}
                    title="Delete this custom frame"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {selected && (
        <div className="frame-preview-panel">
          <p>
            Currently selected: <strong>{selected.name}</strong>
          </p>
        </div>
      )}

      {/* Custom Frame Studio Modal */}
      <CustomFrameModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onFrameCreated={handleFrameCreated}
      />
    </div>
  );
}
