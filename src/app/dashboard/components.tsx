"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useFormStatus } from "react-dom";
import {
  Copy,
  Check,
  Trash2,
  Loader2,
  ArrowRight,
  KeyRound,
  Plus,
  Palette,
  Sparkles,
  Globe,
  Lock,
  LayoutDashboard,
  Camera,
  Layers,
  ShieldCheck,
  Shuffle,
  Smile,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  X,
  Heart,
} from "lucide-react";
import {
  getAvatarUrl,
  AVATAR_STYLES,
  PASTEL_BG_PALETTES,
  type AvatarStyleType,
} from "@/lib/avatar";
import { resolveRoomCodeAction } from "@/app/actions/join";
import { deleteCustomFrameAction } from "@/app/actions/frame";
import { updateAvatarAction } from "@/app/actions/session";
import CustomFrameModal from "@/app/room/[token]/custom-frame-modal";

/* ── Dynamic Vector Avatar Component ── */
export function UserAvatar({
  name,
  email,
  imageUrl,
  size = 40,
  className = "",
}: {
  name?: string | null;
  email?: string | null;
  imageUrl?: string | null;
  size?: number;
  className?: string;
}) {
  const seed = name || email || "memento-user";
  const avatarUrl = imageUrl || getAvatarUrl(seed, { size: size * 2 });
  const [hasError, setHasError] = useState(false);

  const initial = (name?.[0] || email?.[0] || "M").toUpperCase();

  return (
    <div
      className={`user-avatar-wrap ${className}`}
      style={{
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
        borderRadius: "50%",
        overflow: "hidden",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #f1eeff 0%, #fff4df 100%)",
        border: "2px solid #ffffff",
        boxShadow: "0 2px 8px rgba(143, 113, 157, 0.15)",
      }}
    >
      {!hasError ? (
        <Image
          src={avatarUrl}
          alt={name ? `${name}'s avatar` : "User avatar"}
          width={size}
          height={size}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          loading="lazy"
          unoptimized
          onError={() => setHasError(true)}
        />
      ) : (
        <span
          style={{
            fontWeight: 800,
            fontSize: Math.floor(size * 0.45),
            color: "#6e5ab7",
          }}
        >
          {initial}
        </span>
      )}
    </div>
  );
}

/* ── Interactive Avatar Studio & Customizer ── */
export function AvatarStudio({
  userName,
  userEmail,
}: {
  userName?: string | null;
  userEmail?: string | null;
}) {
  const router = useRouter();
  const defaultSeed = userName || userEmail || "memento-user";

  const [selectedStyle, setSelectedStyle] = useState<AvatarStyleType>("avataaars");
  const [seed, setSeed] = useState(defaultSeed);
  const [selectedBgHex, setSelectedBgHex] = useState<string>(PASTEL_BG_PALETTES[0].hex);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Compute live preview URL based on state
  const previewUrl = getAvatarUrl(seed, {
    style: selectedStyle,
    backgroundColor: [selectedBgHex],
    size: 160,
  });

  const handleShuffle = () => {
    const randomSeed = `user-${Math.random().toString(36).substring(2, 8)}`;
    setSeed(randomSeed);
    setSaveSuccess(false);
    setErrorMsg(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setErrorMsg(null);
    try {
      await updateAvatarAction(previewUrl);
      setSaveSuccess(true);
      router.refresh();
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to update avatar");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="avatar-studio-card">
      <div className="avatar-studio-header">
        <div className="avatar-studio-title-group">
          <Smile size={18} className="text-rose" />
          <h3>Avatar Studio</h3>
        </div>
        <span className="avatar-studio-badge">
          <Sparkles size={12} /> Instant Vector Sync
        </span>
      </div>

      <p className="avatar-studio-desc">
        Pick your style, shuffle features to roll a new look, and choose your favorite pastel mood tone.
      </p>

      <div className="avatar-studio-body">
        {/* Live Preview Display */}
        <div className="avatar-preview-column">
          <div className="avatar-large-stage">
            <Image
              src={previewUrl}
              alt="Avatar live preview"
              width={100}
              height={100}
              unoptimized
              className="avatar-stage-img"
            />
          </div>
          <span className="avatar-preview-hint">Live Preview</span>
        </div>

        {/* Customization Controls */}
        <div className="avatar-controls-column">
          {/* Style Selector Tabs */}
          <div className="avatar-control-group">
            <label className="control-label">Illustration Style</label>
            <div className="avatar-style-tabs">
              {AVATAR_STYLES.map((style) => (
                <button
                  key={style.id}
                  type="button"
                  className={`avatar-style-tab ${selectedStyle === style.id ? "active" : ""}`}
                  onClick={() => {
                    setSelectedStyle(style.id);
                    setSaveSuccess(false);
                  }}
                >
                  {style.label}
                </button>
              ))}
            </div>
          </div>

          {/* Pastel Mood Tone Picker */}
          <div className="avatar-control-group">
            <label className="control-label">Background Tone</label>
            <div className="avatar-bg-palette">
              {PASTEL_BG_PALETTES.map((palette) => (
                <button
                  key={palette.id}
                  type="button"
                  className={`avatar-bg-swatch ${selectedBgHex === palette.hex ? "active" : ""}`}
                  style={{ backgroundColor: `#${palette.hex}` }}
                  onClick={() => {
                    setSelectedBgHex(palette.hex);
                    setSaveSuccess(false);
                  }}
                  title={palette.label}
                  aria-label={palette.label}
                >
                  {selectedBgHex === palette.hex && <Check size={12} />}
                </button>
              ))}
            </div>
          </div>

          {/* Action Row: Shuffle & Save aligned together */}
          <div className="avatar-actions-row">
            <button
              type="button"
              className="button button-quiet button-small shuffle-btn"
              onClick={handleShuffle}
              title="Roll a new face"
            >
              <Shuffle size={14} /> Shuffle Face
            </button>

            <button
              type="button"
              className="button button-small avatar-save-btn"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 size={14} className="spin" /> Saving…
                </>
              ) : saveSuccess ? (
                <>
                  <Check size={14} /> Avatar Saved!
                </>
              ) : (
                "Save Avatar"
              )}
            </button>

            {errorMsg && <span className="avatar-error-text">{errorMsg}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Inline Quick-Join Room Component ── */
export function QuickJoinInline() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    const cleanCode = code.trim();
    if (!cleanCode) return;

    setPending(true);
    setError(null);

    try {
      const res = await resolveRoomCodeAction(cleanCode);
      if (res.success && res.token) {
        router.push(`/join/${res.token}`);
      } else {
        setError(res.error ?? "Invalid or expired booth code.");
        setPending(false);
      }
    } catch {
      setError("Unable to connect to booth. Please try again.");
      setPending(false);
    }
  }

  return (
    <form className="quick-join-inline" onSubmit={handleJoin}>
      <div className="quick-join-input-wrap">
        <KeyRound size={16} className="quick-join-icon" />
        <input
          type="text"
          placeholder="Code e.g. 4X9K"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            setError(null);
          }}
          maxLength={9}
          className="quick-join-input"
          aria-label="Room code"
        />
        <button
          type="submit"
          disabled={pending || !code.trim()}
          className="quick-join-submit"
          aria-label="Join Booth"
        >
          {pending ? (
            <Loader2 size={14} className="spin" />
          ) : (
            <ArrowRight size={14} />
          )}
        </button>
      </div>
      {error && <span className="quick-join-error">{error}</span>}
    </form>
  );
}

/* ── Copy Invite Link Button ── */
export function CopyInviteButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  }

  return (
    <button
      type="button"
      className="copy-button"
      onClick={handleCopy}
      aria-label="Copy invite link"
    >
      {copied ? (
        <>
          <Check size={14} /> Copied!
        </>
      ) : (
        <>
          <Copy size={14} /> Copy Link
        </>
      )}
    </button>
  );
}

/* ── Delete Account Button (with confirmation) ── */
export function DeleteAccountButton({
  action,
}: {
  action: () => Promise<void>;
}) {
  const [pending, setPending] = useState(false);

  async function handleDelete() {
    if (
      !confirm(
        "Are you sure you want to delete your account? This action cannot be undone."
      )
    )
      return;
    setPending(true);
    await action();
  }

  return (
    <button
      type="button"
      className="button-danger"
      onClick={handleDelete}
      disabled={pending}
    >
      {pending ? (
        <Loader2 size={15} className="spin" />
      ) : (
        <Trash2 size={15} />
      )}
      {pending ? "Deleting..." : "Delete Account"}
    </button>
  );
}

/* ── Room Countdown Timer ── */
export function RoomCountdown({ expiresAt }: { expiresAt: string }) {
  const [remaining, setRemaining] = useState("");
  const [urgent, setUrgent] = useState(false);

  useEffect(() => {
    function tick() {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setRemaining("Expired");
        setUrgent(true);
        return;
      }
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setRemaining(`${mins}:${String(secs).padStart(2, "0")}`);
      setUrgent(mins < 5);
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  return (
    <span className={`countdown-pill ${urgent ? "countdown-urgent" : ""}`}>
      ⏱ {remaining}
    </span>
  );
}

/* ── Create Booth Button ── */
export function CreateBoothButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className="button create-booth-btn"
      disabled={pending}
    >
      {pending ? (
        <>
          <Loader2 size={16} className="spin" /> Creating...
        </>
      ) : (
        "Create a Private Booth"
      )}
    </button>
  );
}

/* ── Sidebar Navigation with Active Route Detection ── */
export function DashboardSidebarNav({
  activeRoomsCount = 0,
}: {
  activeRoomsCount?: number;
}) {
  const pathname = usePathname();

  const navItems = [
    {
      href: "/dashboard",
      label: "Overview",
      icon: LayoutDashboard,
      exact: true,
    },
    {
      href: "/dashboard/booths",
      label: "Active Booths",
      icon: Camera,
      badge: activeRoomsCount > 0 ? activeRoomsCount : undefined,
    },
    {
      href: "/dashboard/join",
      label: "Enter Code",
      icon: KeyRound,
    },
    {
      href: "/dashboard/frames",
      label: "Frame Styles",
      icon: Layers,
      exact: true,
    },
    {
      href: "/dashboard/account",
      label: "Account & Safety",
      icon: ShieldCheck,
    },
  ];

  return (
    <nav className="sidebar-nav">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname?.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`sidebar-nav-item ${isActive ? "active" : ""}`}
          >
            <Icon size={18} />
            <span>{item.label}</span>
            {item.badge !== undefined && (
              <span className="sidebar-badge">{item.badge}</span>
            )}
          </Link>
        );
      })}
      <SidebarDesignFrameButton />
    </nav>
  );
}

/* ── Mobile Horizontal Navigation Pill Bar ── */
export function DashboardMobileNav({
  activeRoomsCount = 0,
}: {
  activeRoomsCount?: number;
}) {
  const pathname = usePathname();

  const navItems = [
    {
      href: "/dashboard",
      label: "Overview",
      icon: LayoutDashboard,
      exact: true,
    },
    {
      href: "/dashboard/booths",
      label: "Booths",
      icon: Camera,
      badge: activeRoomsCount > 0 ? activeRoomsCount : undefined,
    },
    {
      href: "/dashboard/join",
      label: "Code",
      icon: KeyRound,
    },
    {
      href: "/dashboard/frames",
      label: "Frames",
      icon: Layers,
      exact: true,
    },
    {
      href: "/dashboard/account",
      label: "Account",
      icon: ShieldCheck,
    },
  ];

  return (
    <nav className="dashboard-mobile-nav">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname?.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`mobile-nav-pill ${isActive ? "active" : ""}`}
          >
            <Icon size={14} />
            <span>{item.label}</span>
            {item.badge !== undefined && (
              <span className="mobile-pill-badge">{item.badge}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

/* ── Sidebar Design Frame Button ── */
export function SidebarDesignFrameButton() {
  const pathname = usePathname();
  const isActive = pathname === "/dashboard/frames/studio";

  return (
    <Link
      href="/dashboard/frames/studio"
      className={`sidebar-nav-item ${isActive ? "active" : ""}`}
    >
      <Palette size={18} />
      <span>Design Custom Frame</span>
    </Link>
  );
}

export interface UserFrameItem {
  id: string;
  name: string;
  description: string | null;
  category: string;
  slotCount: number;
  isPublic: boolean;
  configJson: string;
}

/* ── Dashboard Frame Studio & Custom Frames Manager ── */
export function DashboardFramesManager({
  userFrames,
}: {
  userFrames: UserFrameItem[];
}) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleFrameCreated = () => {
    setIsModalOpen(false);
    router.refresh();
  };

  const handleDelete = async (frameId: string) => {
    if (!confirm("Are you sure you want to delete this custom frame?")) return;
    setDeletingId(frameId);
    try {
      await deleteCustomFrameAction(frameId);
      router.refresh();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete frame");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="dashboard-frames-manager">
      <div className="frames-manager-header">
        <Link
          href="/dashboard/frames/studio"
          className="button button-small design-frame-btn"
        >
          <Plus size={15} /> Design Custom Frame
        </Link>
      </div>

      {userFrames.length > 0 && (
        <div className="user-frames-subgroup">
          <h3 className="user-frames-title">
            <Sparkles size={16} /> My Custom Keepsake Designs ({userFrames.length})
          </h3>
          <div className="frames-showcase-grid">
            {userFrames.map((frame) => {
              let parsedBg = "#fff4f6";
              let headline = "Custom Keepsake";
              try {
                const config = JSON.parse(frame.configJson);
                if (config.backgroundColor) parsedBg = config.backgroundColor;
                if (config.decorations?.[0]?.content) {
                  headline = config.decorations[0].content;
                }
              } catch {
                // Keep default
              }

              return (
                <div key={frame.id} className="frame-showcase-card user-created-frame">
                  <div
                    className="frame-mini-preview"
                    style={{ background: parsedBg }}
                  >
                    {Array.from({ length: Math.min(frame.slotCount, 4) }).map((_, i) => (
                      <div key={i} className="frame-sample-slot" />
                    ))}
                  </div>

                  <div className="frame-showcase-meta">
                    <div className="frame-title-bar">
                      <strong>{frame.name}</strong>
                      <span className="frame-visibility-tag">
                        {frame.isPublic ? (
                          <>
                            <Globe size={11} /> Public
                          </>
                        ) : (
                          <>
                            <Lock size={11} /> Private
                          </>
                        )}
                      </span>
                    </div>
                    <small className="frame-headline-preview">&ldquo;{headline}&rdquo;</small>
                    <small className="frame-specs">
                      {frame.slotCount}-cut &bull; custom design
                    </small>

                    <div className="frame-card-actions">
                      <button
                        type="button"
                        className="delete-frame-btn"
                        onClick={() => handleDelete(frame.id)}
                        disabled={deletingId === frame.id}
                        title="Delete custom frame"
                      >
                        {deletingId === frame.id ? (
                          <Loader2 size={13} className="spin" />
                        ) : (
                          <Trash2 size={13} />
                        )}
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Interactive Custom Frame Studio Modal */}
      <CustomFrameModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onFrameCreated={handleFrameCreated}
      />
    </div>
  );
}

/* ── Interactive Collapsible Dashboard Shell (Desktop Collapse & Mobile Drawer) ── */
export function DashboardLayoutShell({
  children,
  sidebarTop,
  sidebarBottom,
  mobileUserActions,
  mobileNav,
}: {
  children: React.ReactNode;
  sidebarTop: React.ReactNode;
  sidebarBottom: React.ReactNode;
  mobileUserActions: React.ReactNode;
  mobileNav: React.ReactNode;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();
  const [prevPathname, setPrevPathname] = useState(pathname);

  // Close mobile drawer upon route change during render
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setIsMobileOpen(false);
  }

  return (
    <div className={`dashboard-layout ${isCollapsed ? "sidebar-collapsed" : ""}`}>
      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          className="sidebar-mobile-backdrop"
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Desktop & Mobile Drawer Sidebar */}
      <aside className={`dashboard-sidebar ${isMobileOpen ? "sidebar-mobile-open" : ""}`}>
        <div className="sidebar-collapse-header">
          <Link href="/" className="sidebar-brand">
            <span className="brand-mark">
              <Heart size={16} fill="currentColor" />
            </span>
            <span className="brand-text">Memento Booth</span>
          </Link>

          <button
            type="button"
            className="sidebar-toggle-btn desktop-only"
            onClick={() => setIsCollapsed((prev) => !prev)}
            title={isCollapsed ? "Expand sidebar labels" : "Collapse to icons"}
            aria-label="Toggle sidebar collapse"
          >
            {isCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </button>

          <button
            type="button"
            className="sidebar-toggle-btn mobile-only"
            onClick={() => setIsMobileOpen(false)}
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="sidebar-top">
          {sidebarTop}
        </div>

        <div className="sidebar-bottom">
          {sidebarBottom}
        </div>
      </aside>

      {/* Main Content Viewport */}
      <main className="dashboard-main">
        {/* Mobile Header */}
        <header className="dashboard-mobile-header">
          <div className="mobile-header-top">
            <button
              type="button"
              className="mobile-menu-btn"
              onClick={() => setIsMobileOpen(true)}
              aria-label="Open sidebar menu"
            >
              <Menu size={20} />
            </button>

            <Link href="/" className="brand">
              <span className="brand-mark">
                <Heart size={15} fill="currentColor" />
              </span>
              <span>Memento Booth</span>
            </Link>

            <div className="mobile-user-actions">
              {mobileUserActions}
            </div>
          </div>

          {mobileNav}
        </header>

        <div className="dashboard-content-shell">
          {children}

          <footer className="dashboard-footer">
            <span>Private by design &bull; Browser-side composition</span>
            <span>&copy; 2026 Memento Booth</span>
          </footer>
        </div>
      </main>
    </div>
  );
}
