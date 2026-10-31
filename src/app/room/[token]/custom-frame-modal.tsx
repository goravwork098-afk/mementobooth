"use client";

import { useState, useRef, useEffect } from "react";
import {
  X,
  Palette,
  Layout,
  Type,
  Sliders,
  Check,
  Loader2,
  Sparkles,
  Globe,
} from "lucide-react";
import {
  buildCustomFrameConfig,
  CUSTOM_COLOR_PALETTES,
  type CustomLayoutType,
  type CustomFrameInput,
} from "@/lib/custom-frame";
import { createCustomFrameAction } from "@/app/actions/frame";

interface CustomFrameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFrameCreated: (frameId: string) => void;
}

export default function CustomFrameModal({
  isOpen,
  onClose,
  onFrameCreated,
}: CustomFrameModalProps) {
  const [name, setName] = useState("My Romantic Keepsake");
  const [layout, setLayout] = useState<CustomLayoutType>("4-cut-strip");
  const [paletteIndex, setPaletteIndex] = useState(2); // Blush Rose default
  const [customText, setCustomText] = useState("Forever & Always");
  const [customDate, setCustomDate] = useState(() => {
    return new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  });
  const [borderRadius, setBorderRadius] = useState(8);
  const [isPublic, setIsPublic] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  const selectedPalette = CUSTOM_COLOR_PALETTES[paletteIndex] ?? CUSTOM_COLOR_PALETTES[0];

  // Render live preview on canvas whenever inputs change
  useEffect(() => {
    if (!isOpen) return;

    const canvas = previewCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const input: CustomFrameInput = {
      name,
      layout,
      backgroundColor: selectedPalette.bg,
      backgroundGradient: selectedPalette.gradient,
      customText,
      customDate,
      borderRadius,
    };

    const { config } = buildCustomFrameConfig(input);

    canvas.width = config.canvasWidth;
    canvas.height = config.canvasHeight;

    // 1. Background
    if (config.backgroundGradient) {
      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, config.backgroundColor);
      grad.addColorStop(1, config.backgroundGradient);
      ctx.fillStyle = grad;
    } else {
      ctx.fillStyle = config.backgroundColor;
    }
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Slots preview placeholder
    const placeholderColor =
      config.backgroundColor === "#18181b"
        ? "rgba(255, 255, 255, 0.12)"
        : "rgba(0, 0, 0, 0.06)";
    const slotBorderColor =
      config.backgroundColor === "#18181b"
        ? "rgba(255, 255, 255, 0.25)"
        : "rgba(0, 0, 0, 0.15)";

    for (const slot of config.slots) {
      const sx = (slot.x / 100) * canvas.width;
      const sy = (slot.y / 100) * canvas.height;
      const sw = (slot.width / 100) * canvas.width;
      const sh = (slot.height / 100) * canvas.height;
      const r = slot.borderRadius ?? 0;

      ctx.fillStyle = placeholderColor;
      ctx.beginPath();
      ctx.roundRect(sx, sy, sw, sh, r);
      ctx.fill();

      ctx.strokeStyle = slotBorderColor;
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Slot index text
      ctx.fillStyle = slotBorderColor;
      ctx.font = `600 ${Math.max(14, canvas.width * 0.03)}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`Pose ${slot.slotIndex + 1}`, sx + sw / 2, sy + sh / 2);
    }

    // 3. Decorations preview
    for (const deco of config.decorations) {
      const dx = (deco.x / 100) * canvas.width;
      const dy = (deco.y / 100) * canvas.height;

      if (deco.type === "text") {
        const fontSize = Math.max(14, canvas.width * 0.026);
        ctx.font = `600 ${fontSize}px ${deco.fontFamily ?? "sans-serif"}`;
        ctx.fillStyle = deco.color ?? "#18181b";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(deco.content ?? "", dx, dy);
      }
    }
  }, [isOpen, name, layout, selectedPalette, customText, customDate, borderRadius]);

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Please enter a name for your custom frame.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const created = await createCustomFrameAction({
        name: name.trim(),
        layout,
        backgroundColor: selectedPalette.bg,
        backgroundGradient: selectedPalette.gradient,
        customText,
        customDate,
        borderRadius,
        isPublic,
      });

      onFrameCreated(created.id);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create custom frame.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="custom-frame-modal-backdrop" onClick={onClose}>
      <div
        className="custom-frame-modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-header">
          <div className="modal-title-group">
            <Sparkles size={18} className="text-rose" />
            <h3>Design Custom Keepsake Frame</h3>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        <div className="modal-split-body">
          {/* Controls Form */}
          <div className="modal-controls-col">
            {error && <div className="modal-error-banner">{error}</div>}

            <div className="form-group">
              <label htmlFor="frame-name">Frame Name</label>
              <input
                id="frame-name"
                type="text"
                maxLength={40}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Our Anniversary Strip"
                className="modal-text-input"
              />
            </div>

            <div className="form-group">
              <label className="label-with-icon">
                <Layout size={14} /> Layout Structure
              </label>
              <div className="layout-picker-grid">
                {(
                  [
                    { id: "4-cut-strip", label: "4-Cut Strip", desc: "4 poses" },
                    { id: "3-cut-strip", label: "3-Cut Strip", desc: "3 poses" },
                    { id: "2-cut-duo", label: "2-Cut Duo", desc: "2 poses" },
                    { id: "1-cut-polaroid", label: "1-Cut Polaroid", desc: "1 pose" },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`layout-option-btn ${layout === item.id ? "active" : ""}`}
                    onClick={() => setLayout(item.id)}
                  >
                    <strong>{item.label}</strong>
                    <small>{item.desc}</small>
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="label-with-icon">
                <Palette size={14} /> Color Mood
              </label>
              <div className="palette-swatch-row">
                {CUSTOM_COLOR_PALETTES.map((p, idx) => (
                  <button
                    key={p.name}
                    type="button"
                    className={`palette-swatch ${paletteIndex === idx ? "active" : ""}`}
                    style={{ background: p.gradient ? `linear-gradient(135deg, ${p.bg}, ${p.gradient})` : p.bg }}
                    onClick={() => setPaletteIndex(idx)}
                    title={p.name}
                  >
                    {paletteIndex === idx && <Check size={12} />}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="custom-title" className="label-with-icon">
                <Type size={14} /> Romantic Title
              </label>
              <input
                id="custom-title"
                type="text"
                maxLength={50}
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="e.g. Forever & Always"
                className="modal-text-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="custom-date">Date Stamp</label>
              <input
                id="custom-date"
                type="text"
                maxLength={30}
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                placeholder="e.g. Oct 31, 2026"
                className="modal-text-input"
              />
            </div>

            <div className="form-group">
              <label className="label-with-icon">
                <Sliders size={14} /> Corner Radius ({borderRadius}px)
              </label>
              <input
                type="range"
                min="0"
                max="20"
                value={borderRadius}
                onChange={(e) => setBorderRadius(parseInt(e.target.value, 10))}
                className="modal-range-slider"
              />
            </div>

            <div className="form-group modal-toggle-group">
              <label className="modal-toggle-row">
                <div className="modal-toggle-text">
                  <div className="modal-toggle-title">
                    <Globe size={14} /> Share with Community
                  </div>
                  <p className="modal-toggle-desc">
                    Display as an inspiring example for all couples. Zero photos are shared.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="modal-checkbox-input"
                />
              </label>
            </div>
          </div>

          {/* Live Preview Column */}
          <div className="modal-preview-col">
            <div className="preview-container">
              <canvas ref={previewCanvasRef} className="custom-preview-canvas" />
            </div>
            <span className="preview-label">Live Frame Preview</span>
          </div>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="button button-quiet"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="button button-primary"
            onClick={handleSave}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="spin" /> Creating Frame…
              </>
            ) : (
              <>
                <Check size={16} /> Save & Select Frame
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

