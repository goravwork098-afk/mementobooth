"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Download, Heart, Sparkles, Clock, Copy, Check } from "lucide-react";
import confetti from "canvas-confetti";

interface KeepsakeViewProps {
  roomCode: string;
  frameName: string;
  dataUrl: string;
  hoursRemaining: number;
}

export default function KeepsakeView({
  roomCode,
  frameName,
  dataUrl,
  hoursRemaining,
}: KeepsakeViewProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ["#db4f70", "#f43f5e", "#fb7185", "#ffd1dc"],
      });
    } catch {
      // Ignore if confetti fails in headless env
    }
  }, []);

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `memento-booth-${roomCode}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <main className="keepsake-view-page">
      <div className="keepsake-view-container">
        <header className="keepsake-view-header">
          <Link href="/" className="brand">
            <span className="brand-mark">
              <Heart size={16} fill="currentColor" />
            </span>
            Memento Booth
          </Link>
          <div className="keepsake-expiry-badge">
            <Clock size={13} />
            <span>Expires in {hoursRemaining}h</span>
          </div>
        </header>

        <section className="keepsake-display-card">
          <div className="keepsake-title-meta">
            <h2>
              <Sparkles size={18} /> Our Memento
            </h2>
            <p>
              {frameName} &middot; Room {roomCode}
            </p>
          </div>

          <div className="keepsake-image-wrap">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={dataUrl}
              alt={`Memento Booth keepsake from session ${roomCode}`}
              className="keepsake-rendered-img"
            />
          </div>

          <div className="keepsake-view-actions">
            <button
              type="button"
              className="button button-primary button-lg"
              onClick={handleDownload}
            >
              <Download size={18} /> Save Photo to Device
            </button>

            <button
              type="button"
              className="button button-quiet"
              onClick={handleCopyLink}
            >
              {copied ? (
                <>
                  <Check size={16} /> Link Copied!
                </>
              ) : (
                <>
                  <Copy size={16} /> Copy Private Link
                </>
              )}
            </button>
          </div>

          <p className="keepsake-view-privacy">
            <Heart size={12} fill="currentColor" /> This private link expires
            automatically in 24 hours. Zero permanent server media storage.
          </p>
        </section>
      </div>
    </main>
  );
}

