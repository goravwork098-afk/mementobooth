"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Copy,
  Check,
  Heart,
  Loader2,
  LogOut,
  Camera,
  X,
  Play,
  QrCode as QrIcon,
  FlipHorizontal,
  SwitchCamera,
  Volume2,
  VolumeX,
  Smartphone,
  Tablet,
  Monitor,
  Sparkles,
  Smile,
  Palette,
} from "lucide-react";
import QRCode from "qrcode";
import FramePicker from "./frame-picker";
import Composer from "./composer";
import { CAMERA_FILTERS, getFilterById } from "@/lib/camera-filters";
import {
  FACE_STICKER_PRESETS,
  getDefaultFaceBox,
  renderFaceSticker,
} from "@/lib/face-stickers";
import {
  toggleReadyAction,
  leaveRoomAction,
  closeRoomAction,
} from "@/app/actions/lobby";
import { RoomCountdown } from "@/app/dashboard/components";
import {
  startCountdownAction,
  recordCaptureEvent,
  transitionToComposingAction,
  resetCountdownAction,
} from "@/app/actions/capture";
import { playCountdownBeep, playShutterSound } from "@/lib/audio-effects";
import type { FrameConfig } from "@/types/frame";

/* ──────────────────────────────────────────────────────────── */
/*  Types                                                       */
/* ──────────────────────────────────────────────────────────── */

interface LobbyProps {
  roomId: string;
  token: string;
  code: string;
  inviteUrl: string;
  initialRoomState: RoomState;
  currentUserId: string;
  isHost: boolean;
}

interface Participant {
  id: string;
  userId: string;
  role: "HOST" | "GUEST";
  name: string;
  isReady: boolean;
  cameraGranted: boolean;
  micGranted: boolean;
  deviceType?: string | null;
  deviceModel?: string | null;
}

interface RoomState {
  status: string;
  expiresAt: string;
  selectedFrameId: string | null;
  selectedFrame: {
    id: string;
    name: string;
    slug: string;
    configJson: string;
  } | null;
  countdownStartedAt: string | null;
  countdownDuration: number | null;
  countdownRemaining: number | null;
  serverTime: string;
  photosReady: Record<string, boolean>;
  participants: Participant[];
}

type SessionPhase =
  | "lobby"       // waiting for both to join + pick frame + mark ready
  | "countdown"   // synchronized countdown running
  | "capturing"   // flash + capture
  | "uploading"   // uploading photo to relay
  | "waiting"     // waiting for partner's photo
  | "composing"   // both photos ready, composing
  | "done";       // download available

const COUNTDOWN_OPTIONS = [3, 5, 10] as const;

/* ──────────────────────────────────────────────────────────── */
/*  Component                                                   */
/* ──────────────────────────────────────────────────────────── */

export default function Lobby({
  roomId,
  token,
  code,
  inviteUrl,
  initialRoomState,
  currentUserId,
  isHost,
}: LobbyProps) {
  const router = useRouter();
  // ── State ──
  const [roomState, setRoomState] = useState<RoomState>({
    ...initialRoomState,
    selectedFrame: initialRoomState.selectedFrame ?? null,
    countdownStartedAt: null,
    countdownDuration: null,
    countdownRemaining: null,
    serverTime: new Date().toISOString(),
    photosReady: {},
  });
  const [phase, setPhase] = useState<SessionPhase>("lobby");
  const [countdownDisplay, setCountdownDisplay] = useState<number>(0);
  const [selectedDuration, setSelectedDuration] =
    useState<(typeof COUNTDOWN_OPTIONS)[number]>(3);

  const [copied, setCopied] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [showQr, setShowQr] = useState(false);
  const [pendingReady, setPendingReady] = useState(false);
  const [pendingAction, setPendingAction] = useState(false);

  // Camera
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [cameraGranted, setCameraGranted] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [isMirrored, setIsMirrored] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedFilterId, setSelectedFilterId] = useState<string>("natural");
  const activeFilter = getFilterById(selectedFilterId);
  const [selectedStickerId, setSelectedStickerId] = useState<string>("none");
  const [activeEffectTab, setActiveEffectTab] = useState<"filters" | "stickers">("filters");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const arCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const lastBeepNumRef = useRef<number>(-1);

  const toggleCameraFacing = useCallback(() => {
    setFacingMode((prev) => {
      const next = prev === "user" ? "environment" : "user";
      setIsMirrored(next === "user");
      return next;
    });
  }, []);

  const toggleMirror = useCallback(() => {
    setIsMirrored((prev) => !prev);
  }, []);

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => !prev);
  }, []);

  // Photos & Multi-Slot State
  const [myPhotos, setMyPhotos] = useState<string[]>([]);
  const [partnerPhotos, setPartnerPhotos] = useState<string[]>([]);
  const [currentSlotIndex, setCurrentSlotIndex] = useState<number>(0);
  const [frameConfig, setFrameConfig] = useState<FrameConfig | null>(null);

  // Refs for intervals & clock calibration
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const clockOffsetRef = useRef<number>(0);

  // Dynamic slot count from frame config or selected frame
  const totalSlots =
    frameConfig?.slots?.length ??
    (roomState.selectedFrame?.configJson
      ? (() => {
          try {
            return (JSON.parse(roomState.selectedFrame.configJson) as FrameConfig)
              .slots.length;
          } catch {
            return 2;
          }
        })()
      : 2);

  /* ── Teardown camera when composing ── */
  useEffect(() => {
    if (phase === "composing" && localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
  }, [phase, localStream]);

  /* ── Generate QR Code ── */
  useEffect(() => {
    if (inviteUrl) {
      QRCode.toDataURL(inviteUrl, {
        width: 180,
        margin: 1,
        color: {
          dark: "#3d1326",
          light: "#ffffff",
        },
      })
        .then(setQrCodeUrl)
        .catch(console.error);
    }
  }, [inviteUrl]);

  /* ── Initialize camera ── */
  useEffect(() => {
    let cancelled = false;

    async function initCamera() {
      try {
        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach((t) => t.stop());
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        localStreamRef.current = stream;
        setLocalStream(stream);
        setCameraGranted(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Camera access failed:", err);
        setCameraGranted(false);
      }
    }

    initCamera();
    return () => {
      cancelled = true;
    };
  }, [facingMode]);

  // Ensure video element gets stream
  useEffect(() => {
    if (videoRef.current && localStream) {
      videoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Create canvas once
  useEffect(() => {
    canvasRef.current = document.createElement("canvas");
  }, []);

  // Live AR Face Sticker render loop
  useEffect(() => {
    let animId: number;
    const canvas = arCanvasRef.current;
    const video = videoRef.current;

    function renderLoop() {
      if (canvas && video && selectedStickerId !== "none") {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const vw = video.videoWidth || 1280;
          const vh = video.videoHeight || 720;
          if (canvas.width !== vw || canvas.height !== vh) {
            canvas.width = vw;
            canvas.height = vh;
          }
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          const faceBox = getDefaultFaceBox(canvas.width, canvas.height);
          renderFaceSticker(ctx, selectedStickerId, faceBox, performance.now());
        }
      } else if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
      animId = requestAnimationFrame(renderLoop);
    }

    animId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animId);
  }, [selectedStickerId]);

  /* ── Fetch partner's photos ── */
  const fetchAllPartnerPhotos = useCallback(async () => {
    try {
      const res = await fetch(`/api/room/${token}/photo`);
      const data = await res.json();
      if (data.partnerPhotos) {
        const photosList: string[] = [];
        for (let i = 0; i < totalSlots; i++) {
          if (data.partnerPhotos[i]) {
            photosList[i] = data.partnerPhotos[i];
          }
        }
        setPartnerPhotos(photosList);
        if (data.allReady) {
          setPhase("composing");
          try {
            await transitionToComposingAction(roomId);
          } catch {
            /* ignore */
          }
          return true;
        }
      }
    } catch {
      /* ignore */
    }
    return false;
  }, [token, roomId, totalSlots]);

  /* ── Poll for partner's photos ── */
  const pollForPartnerPhotos = useCallback(() => {
    const interval = setInterval(async () => {
      const finished = await fetchAllPartnerPhotos();
      if (finished) clearInterval(interval);
    }, 1500);

    // Timeout after 2 minutes
    setTimeout(() => clearInterval(interval), 120_000);
  }, [fetchAllPartnerPhotos]);

  /* ── Capture from camera ── */
  const doCapture = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (soundEnabled) {
      playShutterSound();
    }

    // Flash visual effect
    setPhase("capturing");
    await new Promise((r) => setTimeout(r, 200));

    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    ctx.save();
    if (activeFilter.canvasFilter !== "none") {
      ctx.filter = activeFilter.canvasFilter;
    }

    if (isMirrored) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      if (selectedStickerId !== "none") {
        ctx.filter = "none";
        const faceBox = getDefaultFaceBox(canvas.width, canvas.height);
        renderFaceSticker(ctx, selectedStickerId, faceBox, performance.now());
      }
    } else {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      if (selectedStickerId !== "none") {
        ctx.filter = "none";
        const faceBox = getDefaultFaceBox(canvas.width, canvas.height);
        renderFaceSticker(ctx, selectedStickerId, faceBox, performance.now());
      }
    }
    ctx.restore();
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);

    setMyPhotos((prev) => {
      const next = [...prev];
      next[currentSlotIndex] = dataUrl;
      return next;
    });

    try {
      await recordCaptureEvent(roomId, currentSlotIndex);
    } catch {
      /* ignore */
    }

    setPhase("uploading");
    try {
      const res = await fetch(`/api/room/${token}/photo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dataUrl,
          slotIndex: currentSlotIndex,
          totalSlots,
        }),
      });
      const data = await res.json();

      if (data.allSlotsCompleted) {
        await fetchAllPartnerPhotos();
      } else if (currentSlotIndex + 1 < totalSlots) {
        // Advance to next pose slot
        setCurrentSlotIndex((idx) => idx + 1);
        setPhase("lobby");
        // If host, auto-start countdown for next pose after 2.5s breather
        if (isHost) {
          setTimeout(async () => {
            try {
              await startCountdownAction(
                roomId,
                selectedDuration,
                currentSlotIndex + 1
              );
            } catch {
              /* ignore */
            }
          }, 2500);
        }
      } else {
        setPhase("waiting");
        pollForPartnerPhotos();
      }
    } catch (err) {
      console.error("Upload failed:", err);
      setPhase("lobby");
    }
  }, [
    roomId,
    token,
    currentSlotIndex,
    totalSlots,
    isHost,
    selectedDuration,
    fetchAllPartnerPhotos,
    pollForPartnerPhotos,
    isMirrored,
    soundEnabled,
    activeFilter,
    selectedStickerId,
  ]);

  /* ── Calibrated local countdown display ── */
  const startLocalCountdown = useCallback(
    (serverStartTimeMs: number, durationSec: number) => {
      if (countdownRef.current) clearInterval(countdownRef.current);
      lastBeepNumRef.current = -1;

      // Calibrate countdown against server clock offset
      const targetLocalEndTime =
        serverStartTimeMs - clockOffsetRef.current + durationSec * 1000;

      const tick = () => {
        const remaining = Math.max(
          0,
          (targetLocalEndTime - Date.now()) / 1000
        );
        const displayNum = Math.ceil(remaining);
        setCountdownDisplay(displayNum);

        if (
          displayNum > 0 &&
          displayNum <= 3 &&
          displayNum !== lastBeepNumRef.current
        ) {
          lastBeepNumRef.current = displayNum;
          if (soundEnabled) {
            playCountdownBeep(displayNum === 1);
          }
        }

        if (remaining <= 0) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          setPhase("capturing");
          doCapture();
        }
      };

      tick();
      countdownRef.current = setInterval(tick, 100);
    },
    [doCapture, soundEnabled]
  );

  /* ── Poll for room updates ── */
  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch(`/api/room/${token}/status`);
        if (!res.ok) return;
        const data: RoomState = await res.json();
        setRoomState(data);

        // Calibrate clock offset on each poll
        if (data.serverTime) {
          clockOffsetRef.current =
            new Date(data.serverTime).getTime() - Date.now();
        }

        // Parse frame config if available
        if (data.selectedFrame?.configJson) {
          try {
            setFrameConfig(JSON.parse(data.selectedFrame.configJson));
          } catch {
            /* ignore parse errors */
          }
        }

        // Auto-redirect on expiry / completion
        if (
          data.status === "EXPIRED" ||
          (data.status === "COMPLETED" && phase === "done")
        ) {
          router.push("/dashboard");
          return;
        }

        // Un-trap guest when retake is triggered
        if (
          data.status === "READY" &&
          (phase === "composing" || phase === "done")
        ) {
          setPhase("lobby");
          setMyPhotos([]);
          setPartnerPhotos([]);
          setCurrentSlotIndex(0);
          return;
        }

        // Detect countdown started by polling
        if (
          data.countdownStartedAt &&
          data.countdownDuration &&
          phase === "lobby"
        ) {
          const remaining = data.countdownRemaining ?? 0;
          if (remaining > 0) {
            setPhase("countdown");
            startLocalCountdown(
              new Date(data.countdownStartedAt).getTime(),
              data.countdownDuration
            );
          } else if (remaining <= 0) {
            // Countdown already reached zero — trigger capture
            setPhase("capturing");
            doCapture();
          }
        }
      } catch {
        // Ignore polling errors
      }
    };

    const interval = phase === "countdown" ? 800 : 1500;
    pollRef.current = setInterval(poll, interval);
    poll(); // immediate first poll

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [token, phase, router, startLocalCountdown, doCapture]);

  /* ── Handle "Start Countdown" ── */
  const handleStartCountdown = async () => {
    setPendingAction(true);
    try {
      await startCountdownAction(roomId, selectedDuration);
      setPhase("countdown");
      startLocalCountdown(Date.now(), selectedDuration);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Could not start countdown";
      alert(message);
    } finally {
      setPendingAction(false);
    }
  };

  /* ── Handle ready toggle ── */
  const handleToggleReady = async () => {
    setPendingReady(true);
    try {
      await toggleReadyAction(roomId);
      setRoomState((prev) => {
        const parts = [...prev.participants];
        const me = parts.find((p) => p.userId === currentUserId);
        if (me) me.isReady = !me.isReady;
        return { ...prev, participants: parts };
      });
    } finally {
      setPendingReady(false);
    }
  };

  /* ── Copy invite ── */
  const copyInvite = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  };

  /* ── Leave ── */
  const handleLeave = async () => {
    if (!confirm("Are you sure you want to leave this booth?")) return;
    setPendingAction(true);
    await leaveRoomAction(roomId);
    router.push("/dashboard");
  };

  /* ── Close room ── */
  const handleClose = async () => {
    if (!confirm("Close this booth for everyone?")) return;
    setPendingAction(true);
    await closeRoomAction(roomId);
    router.push("/dashboard");
  };

  /* ── Retake ── */
  const handleRetake = async () => {
    setMyPhotos([]);
    setPartnerPhotos([]);
    setCurrentSlotIndex(0);
    setPhase("lobby");
    setCountdownDisplay(0);
    try {
      await resetCountdownAction(roomId);
    } catch {
      /* ignore */
    }
  };

  /* ── Derived ── */
  const host = roomState.participants.find((p) => p.role === "HOST");
  const guest = roomState.participants.find((p) => p.role === "GUEST");
  const me = roomState.participants.find(
    (p) => p.userId === currentUserId
  );
  const bothReady =
    host?.isReady &&
    guest?.isReady &&
    roomState.selectedFrameId;

  /* ── Cleanup ── */
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
      localStream?.getTracks().forEach((t) => t.stop());
    };
  }, [localStream]);

  /* ──────────────────────────────────────────────────────── */
  /*  COMPOSING PHASE — show canvas composer                  */
  /* ──────────────────────────────────────────────────────── */
  if (
    phase === "composing" &&
    myPhotos.length > 0 &&
    partnerPhotos.length > 0 &&
    frameConfig
  ) {
    return (
      <main className="lobby-page">
        <Composer
          frameConfig={frameConfig}
          frameName={roomState.selectedFrame?.name ?? "Memento"}
          myPhotos={myPhotos}
          partnerPhotos={partnerPhotos}
          myRole={isHost ? "HOST" : "GUEST"}
          roomCode={code}
          onRetake={handleRetake}
          onComplete={() => setPhase("done")}
        />
      </main>
    );
  }

  /* ──────────────────────────────────────────────────────── */
  /*  MAIN LOBBY RENDER                                       */
  /* ──────────────────────────────────────────────────────── */
  return (
    <main className="lobby-page">
      {/* ── Header ── */}
      <header className="lobby-header">
        <div className="lobby-brand">
          <span className="brand-mark">
            <Heart size={15} fill="currentColor" />
          </span>
          Memento Booth
        </div>
        <div className="lobby-code">{code}</div>
        <div className="lobby-meta">
          <span
            className={`status-badge ${
              roomState.status === "WAITING"
                ? "status-waiting"
                : roomState.status === "READY" ||
                  roomState.status === "ACTIVE"
                ? "status-ready"
                : "status-waiting"
            }`}
          >
            {roomState.status === "ACTIVE"
              ? "Live"
              : roomState.status}
          </span>
          <RoomCountdown expiresAt={roomState.expiresAt} />
        </div>
      </header>

      <div className="lobby-content">
        {/* ── Invite Panel (no guest yet) ── */}
        {!guest && (
          <div className="invite-panel">
            <div className="invite-header">
              <Heart size={16} fill="currentColor" />
              <h3>Invite your person</h3>
            </div>
            <p>Send this link to your partner to join:</p>
            <div className="invite-link-row">
              <code className="invite-url">{inviteUrl}</code>
              <button
                className="copy-button"
                onClick={copyInvite}
              >
                {copied ? (
                  <>
                    <Check size={14} /> Copied!
                  </>
                ) : (
                  <>
                    <Copy size={14} /> Copy
                  </>
                )}
              </button>
              <button
                className="copy-button"
                type="button"
                onClick={() => setShowQr((v) => !v)}
              >
                <QrIcon size={14} /> {showQr ? "Hide QR" : "QR"}
              </button>
            </div>
            {showQr && qrCodeUrl && (
              <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ background: "#ffffff", padding: "12px", borderRadius: "16px", boxShadow: "0 10px 25px rgba(61,19,38,0.08)", border: "1px solid #efe8ec" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrCodeUrl} alt="Room QR Code" width={160} height={160} style={{ display: "block", borderRadius: "8px" }} />
                </div>
                <small style={{ marginTop: "8px", color: "var(--muted)", fontSize: "12px" }}>Scan with camera to join immediately</small>
              </div>
            )}
          </div>
        )}

        {/* ── Participant Cards ── */}
        <div className="participants-grid">
          {/* HOST */}
          <div
            className={`participant-card ${
              host?.isReady ? "is-ready" : ""
            }`}
          >
            <div className="avatar-large">
              {host?.name?.[0]?.toUpperCase() ?? "H"}
            </div>
            <h3>
              {host?.userId === currentUserId
                ? "You (Host)"
                : host?.name ?? "Host"}
            </h3>
            <div className="participant-status">
              <span className="status-dot online" /> Online
            </div>
            {host?.deviceModel && (
              <div className="participant-device-badge">
                {host.deviceType === "MOBILE" ? (
                  <Smartphone size={12} />
                ) : host.deviceType === "TABLET" ? (
                  <Tablet size={12} />
                ) : (
                  <Monitor size={12} />
                )}
                <span>{host.deviceModel}</span>
              </div>
            )}
            <div className="participant-flags">
              {host?.isReady ? (
                <span className="flag flag-ready">
                  <Check size={12} /> Ready
                </span>
              ) : (
                <span className="flag flag-wait">Not Ready</span>
              )}
            </div>
          </div>

          {/* HEART DIVIDER */}
          <div className="participant-divider">
            <Heart size={20} fill="currentColor" />
          </div>

          {/* GUEST */}
          <div
            className={`participant-card ${
              guest ? (guest.isReady ? "is-ready" : "") : "empty-slot"
            }`}
          >
            {guest ? (
              <>
                <div className="avatar-large">
                  {guest.name?.[0]?.toUpperCase() ?? "G"}
                </div>
                <h3>
                  {guest.userId === currentUserId
                    ? "You (Guest)"
                    : guest.name}
                </h3>
                <div className="participant-status">
                  <span className="status-dot online" /> Online
                </div>
                {guest.deviceModel && (
                  <div className="participant-device-badge">
                    {guest.deviceType === "MOBILE" ? (
                      <Smartphone size={12} />
                    ) : guest.deviceType === "TABLET" ? (
                      <Tablet size={12} />
                    ) : (
                      <Monitor size={12} />
                    )}
                    <span>{guest.deviceModel}</span>
                  </div>
                )}
                <div className="participant-flags">
                  {guest.isReady ? (
                    <span className="flag flag-ready">
                      <Check size={12} /> Ready
                    </span>
                  ) : (
                    <span className="flag flag-wait">
                      Not Ready
                    </span>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="avatar-large waiting-avatar">?</div>
                <h3 className="waiting-text">Waiting…</h3>
                <div className="participant-status">
                  <span className="status-dot offline" /> Offline
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Camera Preview ── */}
        <div className="camera-section">
          {cameraGranted && localStream ? (
            <div className="camera-preview">
              {/* Camera Hardware & Utility Controls */}
              <div className="camera-controls-bar">
                <button
                  type="button"
                  className="camera-ctrl-btn"
                  onClick={toggleCameraFacing}
                  title={`Switch to ${facingMode === "user" ? "rear" : "selfie"} camera`}
                  aria-label="Switch camera"
                >
                  <SwitchCamera size={15} />
                  <span>{facingMode === "user" ? "Selfie" : "Rear"}</span>
                </button>
                <button
                  type="button"
                  className={`camera-ctrl-btn ${isMirrored ? "active" : ""}`}
                  onClick={toggleMirror}
                  title="Toggle horizontal mirror view"
                  aria-label="Toggle horizontal mirror view"
                >
                  <FlipHorizontal size={15} />
                  <span>{isMirrored ? "Mirrored" : "Natural"}</span>
                </button>
                <button
                  type="button"
                  className={`camera-ctrl-btn ${soundEnabled ? "active" : ""}`}
                  onClick={toggleSound}
                  title="Toggle shutter and countdown sounds"
                  aria-label="Toggle sound"
                >
                  {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
                  <span>{soundEnabled ? "Sound" : "Muted"}</span>
                </button>
              </div>

              {/* Camera Effects Switcher (Filters vs AR Stickers) */}
              <div className="camera-effect-modes">
                <button
                  type="button"
                  className={`effect-mode-btn ${activeEffectTab === "filters" ? "active" : ""}`}
                  onClick={() => setActiveEffectTab("filters")}
                >
                  <Palette size={12} /> Filters
                </button>
                <button
                  type="button"
                  className={`effect-mode-btn ${activeEffectTab === "stickers" ? "active" : ""}`}
                  onClick={() => setActiveEffectTab("stickers")}
                >
                  <Smile size={12} /> AR Stickers
                </button>
              </div>

              {/* Aesthetic Filter / AR Sticker Carousel */}
              <div className="camera-filter-carousel">
                {activeEffectTab === "filters"
                  ? CAMERA_FILTERS.map((f) => {
                      const isSelected = f.id === selectedFilterId;
                      return (
                        <button
                          key={f.id}
                          type="button"
                          className={`filter-pill ${isSelected ? "active" : ""}`}
                          onClick={() => setSelectedFilterId(f.id)}
                          title={f.description}
                          aria-pressed={isSelected}
                        >
                          {f.id !== "natural" && <Sparkles size={11} />}
                          <span>{f.name}</span>
                        </button>
                      );
                    })
                  : FACE_STICKER_PRESETS.map((s) => {
                      const isSelected = s.id === selectedStickerId;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          className={`filter-pill ${isSelected ? "active" : ""}`}
                          onClick={() => setSelectedStickerId(s.id)}
                          title={s.description}
                          aria-pressed={isSelected}
                        >
                          {s.id !== "none" && <Sparkles size={11} />}
                          <span>{s.name}</span>
                        </button>
                      );
                    })}
              </div>

              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                style={{
                  transform: isMirrored ? "scaleX(-1)" : "none",
                  filter: activeFilter.css,
                }}
              />

              {/* Live AR Stickers Overlay Canvas */}
              <canvas
                ref={arCanvasRef}
                className="camera-ar-canvas"
                style={{
                  transform: isMirrored ? "scaleX(-1)" : "none",
                }}
              />

              {/* Countdown Overlay */}
              {phase === "countdown" && countdownDisplay > 0 && (
                <div className="countdown-overlay">
                  <span className="pose-badge">
                    Pose {currentSlotIndex + 1} of {totalSlots}
                  </span>
                  <div className="countdown-number">
                    {countdownDisplay}
                  </div>
                </div>
              )}

              {/* Flash effect */}
              {phase === "capturing" && (
                <div className="flash-overlay" />
              )}

              {/* Uploading indicator */}
              {(phase === "uploading" || phase === "waiting") && (
                <div className="countdown-overlay">
                  <span className="pose-badge">
                    Pose {currentSlotIndex + 1} of {totalSlots}
                  </span>
                  <Loader2 size={32} className="spin" />
                  <span className="capture-status-text">
                    {phase === "uploading"
                      ? `Sending pose ${currentSlotIndex + 1}…`
                      : "Waiting for your person…"}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="camera-permission-prompt">
              <Camera size={40} />
              <p>Camera access needed for the booth</p>
              <button
                className="button button-small"
                onClick={() =>
                  navigator.mediaDevices
                    .getUserMedia({ video: true })
                    .then((stream) => {
                      setLocalStream(stream);
                      setCameraGranted(true);
                    })
                    .catch(() =>
                      alert("Please allow camera access in your browser settings")
                    )
                }
              >
                Enable Camera
              </button>
            </div>
          )}
        </div>

        {/* ── Frame Picker ── */}
        {phase === "lobby" && (
          <FramePicker
            roomId={roomId}
            selectedFrameId={roomState.selectedFrameId}
            isHost={isHost}
          />
        )}

        {/* ── Countdown Duration Picker (host only, when both ready) ── */}
        {phase === "lobby" && bothReady && isHost && (
          <div className="countdown-picker">
            <h4>Countdown timer</h4>
            <div className="countdown-options">
              {COUNTDOWN_OPTIONS.map((d) => (
                <button
                  key={d}
                  className={`countdown-option ${
                    selectedDuration === d ? "selected" : ""
                  }`}
                  onClick={() => setSelectedDuration(d)}
                >
                  {d}s
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Footer Actions ── */}
      <footer className="lobby-footer">
        <div className="lobby-actions">
          {/* Ready toggle */}
          {phase === "lobby" && guest && (
            <button
              className={`button ready-toggle ${
                me?.isReady ? "is-ready" : ""
              }`}
              onClick={handleToggleReady}
              disabled={
                pendingReady ||
                (!roomState.selectedFrameId && isHost)
              }
            >
              {pendingReady ? (
                <Loader2 className="spin" size={18} />
              ) : me?.isReady ? (
                <>
                  <Check size={18} /> Ready!
                </>
              ) : (
                <>
                  <Heart size={18} /> I&apos;m Ready
                </>
              )}
            </button>
          )}

          {/* Start Countdown (host only, both ready) */}
          {phase === "lobby" && bothReady && isHost && (
            <button
              className="button start-countdown-btn"
              onClick={handleStartCountdown}
              disabled={pendingAction}
            >
              {pendingAction ? (
                <Loader2 className="spin" size={18} />
              ) : (
                <>
                  <Play size={18} /> Start Countdown
                </>
              )}
            </button>
          )}

          {/* Leave / Close */}
          {phase === "lobby" && (
            <>
              <button
                className="button button-quiet button-danger"
                onClick={handleLeave}
                disabled={pendingAction}
              >
                <LogOut size={16} /> Leave
              </button>
              {isHost && (
                <button
                  className="button button-quiet"
                  onClick={handleClose}
                  disabled={pendingAction}
                >
                  <X size={16} /> Close Room
                </button>
              )}
            </>
          )}
        </div>

        {/* Status message */}
        <div className="status-message">
          {phase === "countdown"
            ? "Get ready to pose!"
            : phase === "capturing"
            ? "Smile!"
            : phase === "uploading"
            ? "Sending your photo…"
            : phase === "waiting"
            ? "Waiting for your person's photo…"
            : !guest
            ? "Waiting for your person to join…"
            : !roomState.selectedFrameId
            ? "Waiting for host to pick a style…"
            : bothReady
            ? "All ready! Host can start the countdown."
            : "Both here! Tap ready when you're set."}
        </div>
      </footer>
    </main>
  );
}