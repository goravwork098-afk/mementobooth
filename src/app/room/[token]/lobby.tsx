"use client";

import { useEffect, useState } from "react";
import { Copy, Check, Heart, Loader2, LogOut, Camera, X } from "lucide-react";
import FramePicker from "./frame-picker";
import { toggleReadyAction, leaveRoomAction, closeRoomAction } from "@/app/actions/lobby";
import { RoomCountdown } from "@/app/dashboard/components";

interface LobbyProps {
  roomId: string;
  token: string;
  code: string;
  inviteUrl: string;
  initialRoomState: any;
  currentUserId: string;
  isHost: boolean;
}

export default function Lobby({
  roomId,
  token,
  code,
  inviteUrl,
  initialRoomState,
  currentUserId,
  isHost,
}: LobbyProps) {
  const [roomState, setRoomState] = useState(initialRoomState);
  const [copied, setCopied] = useState(false);
  const [pendingReady, setPendingReady] = useState(false);
  const [pendingAction, setPendingAction] = useState(false);

  // Poll for updates every 3s
  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch(`/api/room/${token}/status`);
        if (res.ok) {
          const data = await res.json();
          setRoomState(data);
          // Auto-redirect if completed or expired (handled by server but good to catch here too)
          if (data.status === "COMPLETED" || new Date(data.expiresAt) <= new Date()) {
            window.location.reload();
          }
        }
      } catch (e) {
        // ignore polling errors
      }
    };
    const id = setInterval(poll, 3000);
    return () => clearInterval(id);
  }, [token]);

  const copyInvite = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleToggleReady = async () => {
    setPendingReady(true);
    try {
      await toggleReadyAction(roomId);
      // Optimistic update
      const parts = [...roomState.participants];
      const me = parts.find((p) => p.userId === currentUserId);
      if (me) me.isReady = !me.isReady;
      setRoomState({ ...roomState, participants: parts });
    } finally {
      setPendingReady(false);
    }
  };

  const handleLeave = async () => {
    if (!confirm("Are you sure you want to leave this booth?")) return;
    setPendingAction(true);
    await leaveRoomAction(roomId);
    window.location.href = "/dashboard";
  };

  const handleClose = async () => {
    if (!confirm("Are you sure you want to close this booth for everyone?")) return;
    setPendingAction(true);
    await closeRoomAction(roomId);
    window.location.href = "/dashboard";
  };

  const hostParticipant = roomState.participants.find((p: any) => p.role === "HOST");
  const guestParticipant = roomState.participants.find((p: any) => p.role === "GUEST");
  const me = roomState.participants.find((p: any) => p.userId === currentUserId);

  const bothReady =
    hostParticipant?.isReady &&
    guestParticipant?.isReady &&
    roomState.selectedFrameId;

  return (
    <main className="lobby-page">
      <header className="lobby-header">
        <div className="lobby-code">{code}</div>
        <div className="lobby-meta">
          <span className="status-badge status-waiting">Waiting</span>
          <RoomCountdown expiresAt={roomState.expiresAt} />
        </div>
      </header>

      <div className="lobby-content">
        <div className="participants-grid">
          {/* HOST CARD */}
          <div className="participant-card">
            <div className="avatar-large">{hostParticipant?.name?.[0]?.toUpperCase() ?? "H"}</div>
            <h3>{hostParticipant?.userId === currentUserId ? "You (Host)" : hostParticipant?.name ?? "Host"}</h3>
            <div className="participant-status">
              <span className="status-dot online" /> Online
            </div>
            <div className="participant-flags">
              {hostParticipant?.isReady ? (
                <span className="flag flag-ready"><Check size={12} /> Ready</span>
              ) : (
                <span className="flag flag-wait">Not Ready</span>
              )}
            </div>
          </div>

          {/* GUEST CARD */}
          <div className="participant-card">
            {guestParticipant ? (
              <>
                <div className="avatar-large">{guestParticipant.name?.[0]?.toUpperCase() ?? "G"}</div>
                <h3>{guestParticipant.userId === currentUserId ? "You (Guest)" : guestParticipant.name}</h3>
                <div className="participant-status">
                  <span className="status-dot online" /> Online
                </div>
                <div className="participant-flags">
                  {guestParticipant.isReady ? (
                    <span className="flag flag-ready"><Check size={12} /> Ready</span>
                  ) : (
                    <span className="flag flag-wait">Not Ready</span>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="avatar-large waiting-avatar">?</div>
                <h3 className="waiting-text">Waiting...</h3>
                <div className="participant-status">
                  <span className="status-dot offline" /> Offline
                </div>
              </>
            )}
          </div>
        </div>

        {isHost && !guestParticipant && (
          <div className="invite-panel">
            <h4><Heart size={15} /> Invite Your Person</h4>
            <p>Share this link with them to join the room.</p>
            <div className="invite-url-box">
              <code>{inviteUrl}</code>
              <button className="copy-button" onClick={copyInvite}>
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
          </div>
        )}

        <FramePicker
          roomId={roomId}
          selectedFrameId={roomState.selectedFrameId}
          isHost={isHost}
        />
      </div>

      <footer className="lobby-footer">
        <div className="lobby-actions">
          <button
            className={`button ready-toggle ${me?.isReady ? "is-ready" : ""}`}
            onClick={handleToggleReady}
            disabled={pendingReady || (!roomState.selectedFrameId && isHost) || !guestParticipant}
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
          
          <button className="button button-quiet button-danger" onClick={handleLeave} disabled={pendingAction}>
            <LogOut size={16} /> Leave
          </button>
          
          {isHost && (
            <button className="button button-quiet" onClick={handleClose} disabled={pendingAction}>
              <X size={16} /> Close Room
            </button>
          )}
        </div>

        <div className="status-message">
          {!guestParticipant
            ? "Waiting for your person to join..."
            : !roomState.selectedFrameId
            ? "Waiting for host to pick a style..."
            : bothReady
            ? "All ready! Starting booth soon..."
            : "Both here! Tap ready when you're set."}
        </div>
      </footer>
    </main>
  );
}
