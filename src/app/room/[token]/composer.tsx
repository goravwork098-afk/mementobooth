"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import {
  Download,
  RotateCcw,
  Heart,
  Sparkles,
  Loader2,
  ZoomIn,
  ZoomOut,
  Move,
  Check,
  Printer,
  Cloud,
  ExternalLink,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import type { FrameConfig, FrameSlot } from "@/types/frame";
import {
  calculateDrawDimensions,
  hitTestSlot,
  PRINT_DPI_SCALE,
  type SlotCropTransform,
} from "@/lib/composer-transform";
import {
  loadGoogleIdentityScript,
  requestGoogleDriveToken,
  uploadKeepsakeToGoogleDrive,
} from "@/lib/google-drive";

interface ComposerProps {
  frameConfig: FrameConfig;
  frameName: string;
  myPhotos: string[] | string;      // data URLs for each slot
  partnerPhotos: string[] | string; // partner data URLs for each slot
  myRole: "HOST" | "GUEST";
  roomCode: string;
  onRetake: () => void;
  onComplete: () => void;
}

export default function Composer({
  frameConfig,
  frameName,
  myPhotos,
  partnerPhotos,
  myRole,
  roomCode,
  onRetake,
  onComplete,
}: ComposerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [composing, setComposing] = useState(true);
  const [exportingHd, setExportingHd] = useState(false);
  const [gdriveStatus, setGdriveStatus] = useState<
    "idle" | "authorizing" | "uploading" | "success" | "error"
  >("idle");
  const [gdriveError, setGdriveError] = useState<string | null>(null);
  const [gdriveLink, setGdriveLink] = useState<string | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [transforms, setTransforms] = useState<Record<string, SlotCropTransform>>({});

  // Loaded images cache
  const loadedImagesRef = useRef<{
    my: HTMLImageElement[];
    partner: HTMLImageElement[];
  }>({ my: [], partner: [] });

  // Drag state
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{
    clientX: number;
    clientY: number;
    initialPanX: number;
    initialPanY: number;
  }>({ clientX: 0, clientY: 0, initialPanX: 0, initialPanY: 0 });

  // Pre-load all photo assets once
  useEffect(() => {
    let isMounted = true;

    const loadImage = (src: string): Promise<HTMLImageElement> =>
      new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      });

    const myPhotosArr = Array.isArray(myPhotos) ? myPhotos : [myPhotos];
    const partnerPhotosArr = Array.isArray(partnerPhotos)
      ? partnerPhotos
      : [partnerPhotos];

    Promise.all([
      Promise.all(myPhotosArr.map((src) => loadImage(src))),
      Promise.all(partnerPhotosArr.map((src) => loadImage(src))),
    ])
      .then(([myImgs, partnerImgs]) => {
        if (isMounted) {
          loadedImagesRef.current = { my: myImgs, partner: partnerImgs };
          setComposing(false);
        }
      })
      .catch((err: unknown) => {
        console.error("Failed to load participant photos for composer", err);
      });

    return () => {
      isMounted = false;
    };
  }, [myPhotos, partnerPhotos]);

  /**
   * Renders the frame onto an arbitrary canvas context with an optional scale factor.
   */
  const renderFrame = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      scaleFactor: number,
      highlightSlotId: string | null = null
    ) => {
      const { canvasWidth, canvasHeight } = frameConfig;
      const targetW = canvasWidth * scaleFactor;
      const targetH = canvasHeight * scaleFactor;

      // ── 1. Background ──
      if (frameConfig.backgroundGradient) {
        const gradient = ctx.createLinearGradient(0, 0, 0, targetH);
        gradient.addColorStop(0, frameConfig.backgroundColor);
        gradient.addColorStop(1, frameConfig.backgroundGradient);
        ctx.fillStyle = gradient;
      } else {
        ctx.fillStyle = frameConfig.backgroundColor;
      }
      ctx.fillRect(0, 0, targetW, targetH);

      // ── 2. Photo Slots ──
      const { my: loadedMyImgs, partner: loadedPartnerImgs } =
        loadedImagesRef.current;

      for (const slot of frameConfig.slots) {
        const sx = ((slot.x / 100) * canvasWidth) * scaleFactor;
        const sy = ((slot.y / 100) * canvasHeight) * scaleFactor;
        const sw = ((slot.width / 100) * canvasWidth) * scaleFactor;
        const sh = ((slot.height / 100) * canvasHeight) * scaleFactor;
        const radius = (slot.borderRadius ?? 0) * scaleFactor;

        ctx.save();

        // Apply rotation if configured
        if (slot.rotation) {
          const cx = sx + sw / 2;
          const cy = sy + sh / 2;
          ctx.translate(cx, cy);
          ctx.rotate((slot.rotation * Math.PI) / 180);
          ctx.translate(-cx, -cy);
        }

        // Rounded clipping path
        ctx.beginPath();
        ctx.roundRect(sx, sy, sw, sh, radius);
        ctx.clip();

        // Determine image for slot
        const myImg = loadedMyImgs[slot.slotIndex] ?? loadedMyImgs[0];
        const partnerImg =
          loadedPartnerImgs[slot.slotIndex] ?? loadedPartnerImgs[0];

        let img: HTMLImageElement | undefined;
        if (slot.assignedUser === "HOST") {
          img = myRole === "HOST" ? myImg : partnerImg;
        } else if (slot.assignedUser === "GUEST") {
          img = myRole === "GUEST" ? myImg : partnerImg;
        } else {
          img = slot.slotIndex % 2 === 0 ? myImg : partnerImg;
        }

        if (img) {
          const transform = transforms[slot.id];
          // Scale pan offset with scaleFactor
          const scaledTransform: SlotCropTransform | undefined = transform
            ? {
                zoom: transform.zoom,
                panX: transform.panX * scaleFactor,
                panY: transform.panY * scaleFactor,
              }
            : undefined;

          const dims = calculateDrawDimensions(
            sx,
            sy,
            sw,
            sh,
            img.naturalWidth,
            img.naturalHeight,
            scaledTransform
          );

          ctx.drawImage(img, dims.drawX, dims.drawY, dims.drawW, dims.drawH);
        }

        // Subtle inner border
        ctx.strokeStyle = "rgba(255,255,255,0.15)";
        ctx.lineWidth = 2 * scaleFactor;
        ctx.beginPath();
        ctx.roundRect(sx, sy, sw, sh, radius);
        ctx.stroke();

        ctx.restore();

        // Active slot selection ring on interactive canvas
        if (highlightSlotId === slot.id) {
          ctx.save();
          ctx.strokeStyle = "#e11d48";
          ctx.lineWidth = 3 * scaleFactor;
          ctx.setLineDash([8 * scaleFactor, 6 * scaleFactor]);
          ctx.beginPath();
          ctx.roundRect(sx - 3, sy - 3, sw + 6, sh + 6, radius + 2);
          ctx.stroke();
          ctx.restore();
        }
      }

      // ── 3. Frame Decorations ──
      for (const deco of frameConfig.decorations) {
        const dx = ((deco.x / 100) * canvasWidth) * scaleFactor;
        const dy = ((deco.y / 100) * canvasHeight) * scaleFactor;

        ctx.save();

        if (deco.rotation) {
          ctx.translate(dx, dy);
          ctx.rotate((deco.rotation * Math.PI) / 180);
          ctx.translate(-dx, -dy);
        }

        if (deco.type === "text") {
          const fontSize = Math.max(14, canvasWidth * 0.025) * scaleFactor;
          ctx.font = `600 ${fontSize}px ${deco.fontFamily ?? "sans-serif"}`;
          ctx.fillStyle = deco.color ?? "#ffffff";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(deco.content ?? "", dx, dy);
        } else if (deco.type === "heart" || deco.type === "sticker") {
          const fontSize = Math.max(16, canvasWidth * 0.03) * scaleFactor;
          ctx.font = `${fontSize}px serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(deco.content ?? "", dx, dy);
        } else if (deco.type === "timestamp") {
          const fontSize = Math.max(12, canvasWidth * 0.018) * scaleFactor;
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

      // ── 4. Room Code + Date Watermark ──
      const wmFontSize = Math.max(11, canvasWidth * 0.016) * scaleFactor;
      ctx.font = `300 ${wmFontSize}px sans-serif`;
      ctx.fillStyle =
        frameConfig.backgroundColor === "#18181b"
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
        targetW / 2,
        targetH - 8 * scaleFactor
      );
    },
    [frameConfig, myRole, roomCode, transforms]
  );

  // Redraw interactive preview canvas whenever transforms or selection changes
  useEffect(() => {
    if (composing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = frameConfig.canvasWidth;
    canvas.height = frameConfig.canvasHeight;

    renderFrame(ctx, 1.0, selectedSlotId);
  }, [composing, frameConfig, renderFrame, selectedSlotId]);

  // Pointer event handlers for slot selection and dragging
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const canvasX = (e.clientX - rect.left) * scaleX;
    const canvasY = (e.clientY - rect.top) * scaleY;

    const hit = hitTestSlot(
      canvasX,
      canvasY,
      canvas.width,
      canvas.height,
      frameConfig.slots
    );

    if (hit) {
      setSelectedSlotId(hit.id);
      isDraggingRef.current = true;
      const currentT = transforms[hit.id] ?? { zoom: 1.0, panX: 0, panY: 0 };
      dragStartRef.current = {
        clientX: e.clientX,
        clientY: e.clientY,
        initialPanX: currentT.panX,
        initialPanY: currentT.panY,
      };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } else {
      setSelectedSlotId(null);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current || !selectedSlotId) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleRatio = canvas.width / rect.width;

    const deltaX = (e.clientX - dragStartRef.current.clientX) * scaleRatio;
    const deltaY = (e.clientY - dragStartRef.current.clientY) * scaleRatio;

    setTransforms((prev) => {
      const current = prev[selectedSlotId] ?? { zoom: 1.0, panX: 0, panY: 0 };
      return {
        ...prev,
        [selectedSlotId]: {
          ...current,
          panX: dragStartRef.current.initialPanX + deltaX,
          panY: dragStartRef.current.initialPanY + deltaY,
        },
      };
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignore capture release error if already released
    }
  };

  // Zoom controls for the selected slot
  const currentSlotTransform = selectedSlotId
    ? transforms[selectedSlotId] ?? { zoom: 1.0, panX: 0, panY: 0 }
    : null;

  const handleZoomChange = (newZoom: number) => {
    if (!selectedSlotId) return;
    const clamped = Math.max(1.0, Math.min(3.0, newZoom));
    setTransforms((prev) => {
      const current = prev[selectedSlotId] ?? { zoom: 1.0, panX: 0, panY: 0 };
      return {
        ...prev,
        [selectedSlotId]: {
          ...current,
          zoom: clamped,
        },
      };
    });
  };

  const handleResetSlot = () => {
    if (!selectedSlotId) return;
    setTransforms((prev) => ({
      ...prev,
      [selectedSlotId]: { zoom: 1.0, panX: 0, panY: 0 },
    }));
  };

  // Download generator
  const triggerDownload = async (scale: number, filenameSuffix: string) => {
    if (exportingHd) return;
    if (scale > 1) setExportingHd(true);

    try {
      const offscreen = document.createElement("canvas");
      offscreen.width = frameConfig.canvasWidth * scale;
      offscreen.height = frameConfig.canvasHeight * scale;

      const offCtx = offscreen.getContext("2d");
      if (!offCtx) return;

      // Render clean without slot selection rings
      renderFrame(offCtx, scale, null);

      offscreen.toBlob(
        (blob) => {
          if (!blob) {
            setExportingHd(false);
            return;
          }
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `memento-booth-${roomCode}-${filenameSuffix}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          setExportingHd(false);
          onComplete();
        },
        "image/png",
        1.0
      );
    } catch (err: unknown) {
      console.error("Export generation failed", err);
      setExportingHd(false);
    }
  };

  const handleSaveToGoogleDrive = async () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId || clientId === "your-google-client-id") {
      setGdriveStatus("error");
      setGdriveError(
        "Google Drive export requires a Google Client ID in your configuration. You can download directly via Standard or 300 DPI buttons below."
      );
      return;
    }

    setGdriveStatus("authorizing");
    setGdriveError(null);

    try {
      await loadGoogleIdentityScript();
      const token = await requestGoogleDriveToken(clientId);
      setGdriveStatus("uploading");

      const offscreen = document.createElement("canvas");
      offscreen.width = frameConfig.canvasWidth * PRINT_DPI_SCALE;
      offscreen.height = frameConfig.canvasHeight * PRINT_DPI_SCALE;

      const offCtx = offscreen.getContext("2d");
      if (!offCtx) throw new Error("Could not initialize canvas context");

      renderFrame(offCtx, PRINT_DPI_SCALE, null);

      const blob: Blob = await new Promise((resolve, reject) => {
        offscreen.toBlob(
          (b) => (b ? resolve(b) : reject(new Error("Image encoding failed"))),
          "image/png",
          1.0
        );
      });

      const filename = `memento-booth-${roomCode}-${Date.now()}.png`;
      const result = await uploadKeepsakeToGoogleDrive(token, blob, filename);

      if (result.success && result.webViewLink) {
        setGdriveStatus("success");
        setGdriveLink(result.webViewLink);
        onComplete();
      } else {
        setGdriveStatus("error");
        setGdriveError(result.error ?? "Failed to upload to Google Drive");
      }
    } catch (err: unknown) {
      setGdriveStatus("error");
      setGdriveError(
        err instanceof Error
          ? err.message
          : "Google Drive upload was cancelled or failed."
      );
    }
  };

  const selectedSlot: FrameSlot | undefined = frameConfig.slots.find(
    (s) => s.id === selectedSlotId
  );

  return (
    <div className="composer-container">
      <div className="composer-header">
        <Sparkles size={18} />
        <h2>Your Memento</h2>
        <p className="composer-frame-name">{frameName}</p>
        <p className="composer-hint">
          Click or tap any photo slot to adjust zoom and framing.
        </p>
      </div>

      <div className="composer-canvas-wrap">
        {composing && (
          <div className="composer-loading">
            <Loader2 size={28} className="spin" />
            <span>Composing your keepsake...</span>
          </div>
        )}
        <canvas
          ref={canvasRef}
          className="composer-canvas interactive-canvas"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          style={{ opacity: composing ? 0.3 : 1 }}
        />
      </div>

      {/* ── Slot Crop Toolbar (Appears when a slot is active) ── */}
      {selectedSlot && currentSlotTransform && (
        <div className="composer-crop-toolbar">
          <div className="crop-toolbar-info">
            <span className="crop-slot-label">
              Slot {selectedSlot.slotIndex + 1}
              {selectedSlot.assignedUser
                ? ` (${selectedSlot.assignedUser.toLowerCase()})`
                : ""}
            </span>
            <span className="crop-drag-hint">
              <Move size={13} /> Drag photo to reposition
            </span>
          </div>

          <div className="crop-zoom-group">
            <button
              type="button"
              className="crop-tool-btn"
              onClick={() => handleZoomChange(currentSlotTransform.zoom - 0.1)}
              disabled={currentSlotTransform.zoom <= 1.0}
              aria-label="Zoom out"
            >
              <ZoomOut size={16} />
            </button>

            <input
              type="range"
              min="1.0"
              max="3.0"
              step="0.05"
              value={currentSlotTransform.zoom}
              onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
              className="crop-zoom-slider"
            />

            <button
              type="button"
              className="crop-tool-btn"
              onClick={() => handleZoomChange(currentSlotTransform.zoom + 0.1)}
              disabled={currentSlotTransform.zoom >= 3.0}
              aria-label="Zoom in"
            >
              <ZoomIn size={16} />
            </button>
            <span className="crop-zoom-readout">
              {currentSlotTransform.zoom.toFixed(1)}x
            </span>
          </div>

          <div className="crop-toolbar-actions">
            <button
              type="button"
              className="button button-quiet button-sm"
              onClick={handleResetSlot}
            >
              <RotateCcw size={13} /> Reset
            </button>
            <button
              type="button"
              className="button button-primary button-sm"
              onClick={() => setSelectedSlotId(null)}
            >
              <Check size={13} /> Done
            </button>
          </div>
        </div>
      )}

      {/* ── Export & Retake Actions ── */}
      {!composing && (
        <div className="composer-actions">
          <button
            type="button"
            className="button composer-download"
            onClick={() => triggerDownload(1.0, "standard")}
            disabled={exportingHd}
          >
            <Download size={18} /> Standard PNG
          </button>

          <button
            type="button"
            className="button button-print-hd"
            onClick={() => triggerDownload(PRINT_DPI_SCALE, "300dpi")}
            disabled={exportingHd || gdriveStatus === "authorizing" || gdriveStatus === "uploading"}
          >
            {exportingHd ? (
              <>
                <Loader2 size={18} className="spin" /> Generating 300 DPI…
              </>
            ) : (
              <>
                <Printer size={18} /> Print HD (300 DPI)
              </>
            )}
          </button>

          <button
            type="button"
            className="button button-gdrive"
            onClick={handleSaveToGoogleDrive}
            disabled={exportingHd || gdriveStatus === "authorizing" || gdriveStatus === "uploading"}
          >
            {gdriveStatus === "authorizing" ? (
              <>
                <Loader2 size={18} className="spin" /> Authorizing…
              </>
            ) : gdriveStatus === "uploading" ? (
              <>
                <Loader2 size={18} className="spin" /> Saving to Drive…
              </>
            ) : (
              <>
                <Cloud size={18} /> Save to Google Drive
              </>
            )}
          </button>

          <button
            type="button"
            className="button button-quiet"
            onClick={onRetake}
            disabled={exportingHd || gdriveStatus === "authorizing" || gdriveStatus === "uploading"}
          >
            <RotateCcw size={16} /> Retake
          </button>
        </div>
      )}

      {/* ── Google Drive Feedback ── */}
      {gdriveStatus === "success" && (
        <div className="gdrive-feedback gdrive-success">
          <CheckCircle size={16} />
          <span>Saved directly to your personal Google Drive!</span>
          {gdriveLink && (
            <a
              href={gdriveLink}
              target="_blank"
              rel="noopener noreferrer"
              className="gdrive-link"
            >
              Open in Drive <ExternalLink size={13} />
            </a>
          )}
        </div>
      )}

      {gdriveStatus === "error" && gdriveError && (
        <div className="gdrive-feedback gdrive-error">
          <AlertCircle size={16} />
          <span>{gdriveError}</span>
        </div>
      )}

      <p className="composer-privacy">
        <Heart size={12} fill="currentColor" /> Composed entirely in your
        browser. Zero server storage.
      </p>
    </div>
  );
}
