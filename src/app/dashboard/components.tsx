"use client";

import { useState, useEffect } from "react";
import { Copy, Check, Trash2, Loader2 } from "lucide-react";

/* ── Copy Invite Link Button ── */
export function CopyInviteButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select a hidden input
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

import { useFormStatus } from "react-dom";

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
