"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Download, RotateCcw, Heart, Sparkles, Loader2 } from "lucide-react";
import type { FrameConfig, PhotoSlot, FrameDecoration } from "@/types/frame";

interface ComposerProps {
  frameConfig: FrameConfig;
  frameName: string;
  myPhoto: string;      // data URL from local capture
  partnerPhoto: string;  // data URL from relay
  myRole: "HOST" | "GUEST";
  roomCode: string;
  onRetake: () => void;
  onComplete: () => void;
}

export default function Composer({
  frameConfig,
  frameName,
  myPhoto,
  partnerPhoto,
  myRole,
  roomCode,
  onRetake,
  onComplete,
}: ComposerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [composing, setComposing] = useState(true);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const compose = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { canvasWidth, canvasHeight } = frameConfig;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // ── 1. Background ──
    if (frameConfig.backgroundGradient) {
      const gradient = ctx.createLinearGradient(
        0,
        0,
        0,
        canvasHeight
      );
      gradient.addColorStop(0, frameConfig.backgroundColor);
      gradient.addColorStop(1, frameConfig.backgroundGradient);
      ctx.fillStyle = gradient;
    } else {
      ctx.fillStyle = frameConfig.backgroundColor;
    }
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // ── 2. Draw photo slots ──
    const loadImage = (src: string): Promise<HTMLImageElement> =>
      new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      });

    const [myImg, partnerImg] = await Promise.all([
      loadImage(myPhoto),
      loadImage(partnerPhoto),
    ]);

    for (const slot of frameConfig.slots) {
      // Calculate absolute pixel coordinates from percentage
      const sx = (slot.x / 100) * canvasWidth;
      const sy = (slot.y / 100) * canvasHeight;
      const sw = (slot.width / 100) * canvasWidth;
      const sh = (slot.height / 100) * canvasHeight;
      const radius = slot.borderRadius ?? 0;

      ctx.save();

      // Apply rotation if specified
      if (slot.rotation) {
        const cx = sx + sw / 2;
        const cy = sy + sh / 2;
        ctx.translate(cx, cy);
        ctx.rotate((slot.rotation * Math.PI) / 180);
        ctx.translate(-cx, -cy);
      }

      // Rounded rectangle clip
      ctx.beginPath();
      ctx.roundRect(sx, sy, sw, sh, radius);
      ctx.clip();

      // Determine which photo goes in this slot
      let img: HTMLImageElement;
      if (slot.assignedUser === "HOST") {
        img = myRole === "HOST" ? myImg : partnerImg;
      } else if (slot.assignedUser === "GUEST") {
        img = myRole === "GUEST" ? myImg : partnerImg;
      } else {
        // "BOTH" or undefined — alternate between the two
        img = slot.slotIndex % 2 === 0 ? myImg : partnerImg;
      }

      // Cover-fit the image into the slot
      const imgRatio = img.naturalWidth / img.naturalHeight;
      const slotRatio = sw / sh;
      let drawW: number, drawH: number, drawX: number, drawY: number;

      if (imgRatio > slotRatio) {
        // Image is wider — crop sides
        drawH = sh;
        drawW = sh * imgRatio;
        drawX = sx - (drawW - sw) / 2;
        drawY = sy;
      } else {
        // Image is taller — crop top/bottom
        drawW = sw;
        drawH = sw / imgRatio;
        drawX = sx;
        drawY = sy - (drawH - sh) / 2;
      }

      ctx.drawImage(img, drawX, drawY, drawW, drawH);

      // Subtle inner border
      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(sx, sy, sw, sh, radius);
      ctx.stroke();

      ctx.restore();
    }

    // ── 3. Decorations ──
    for (const deco of frameConfig.decorations) {
      const dx = (deco.x / 100) * canvasWidth;
      const dy = (deco.y / 100) * canvasHeight;

      ctx.save();

      if (deco.rotation) {
        ctx.translate(dx, dy);
        ctx.rotate((deco.rotation * Math.PI) / 180);
        ctx.translate(-dx, -dy);
      }

      if (deco.type === "text") {
        const fontSize = Math.max(14, canvasWidth * 0.025);
        ctx.font = `600 ${fontSize}px ${deco.fontFamily ?? "sans-serif"}`;
        ctx.fillStyle = deco.color ?? "#ffffff";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(deco.content ?? "", dx, dy);
      } else if (deco.type === "heart" || deco.type === "sticker") {
        const fontSize = Math.max(16, canvasWidth * 0.03);
        ctx.font = `${fontSize}px serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(deco.content ?? "❤️", dx, dy);
      } else if (deco.type === "timestamp") {
        const fontSize = Math.max(12, canvasWidth * 0.018);
        ctx.font = `400 ${fontSize}px monospace`;
        ctx.fillStyle = deco.color ?? "#999";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const dateStr = new Date().toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
        ctx.fillText(dateStr, dx, dy);
      }

      ctx.restore();
    }

    // ── 4. Add room code + date watermark at bottom ──
    const wmFontSize = Math.max(11, canvasWidth * 0.016);
    ctx.font = `300 ${wmFontSize}px sans-serif`;
    ctx.fillStyle = frameConfig.backgroundColor === "#18181b"
      ? "rgba(255,255,255,0.3)"
      : "rgba(0,0,0,0.2)";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    const dateLabel = new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    ctx.fillText(
      `${roomCode}  ·  ${dateLabel}`,
      canvasWidth / 2,
      canvasHeight - 8
    );

    // ── 5. Generate download URL ──
    canvas.toBlob(
      (blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          setDownloadUrl(url);
        }
        setComposing(false);
      },
      "image/png",
      1.0
    );
  }, [frameConfig, myPhoto, partnerPhoto, myRole, roomCode]);

  useEffect(() => {
    compose();
  }, [compose]);

  const handleDownload = () => {
    if (!downloadUrl) return;
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = `memento-booth-${roomCode}-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    onComplete();
  };

  return (
    <div className="composer-container">
      <div className="composer-header">
        <Sparkles size={18} />
        <h2>Your Memento</h2>
        <p className="composer-frame-name">{frameName}</p>
      </div>

      <div className="composer-canvas-wrap">
        {composing && (
          <div className="composer-loading">
            <Loader2 size={28} className="spin" />
            <span>Composing your moment...</span>
          </div>
        )}
        <canvas
          ref={canvasRef}
          className="composer-canvas"
          style={{ opacity: composing ? 0.3 : 1 }}
        />
      </div>

      {!composing && (
        <div className="composer-actions">
          <button className="button composer-download" onClick={handleDownload}>
            <Download size={18} /> Save to Device
          </button>
          <button
            className="button button-quiet"
            onClick={onRetake}
          >
            <RotateCcw size={16} /> Retake
          </button>
        </div>
      )}

      <p className="composer-privacy">
        <Heart size={12} fill="currentColor" /> Composed entirely in
        your browser. Nothing stored on our servers.
      </p>
    </div>
  );
}
