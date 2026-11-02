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
  Wand2,
  Heart,
  Film,
  Camera,
  Star,
  Mail,
  Paintbrush,
} from "lucide-react";
import {
  buildCustomFrameConfig,
  CUSTOM_COLOR_PALETTES,
  CUSTOM_LAYOUTS,
  CUSTOM_FRAME_STYLES,
  type CustomLayoutType,
  type CustomFrameStyle,
  type CustomFontFamily,
  type DecorativeIcon,
  type CustomFrameInput,
} from "@/lib/custom-frame";
import {
  createCustomFrameAction,
  generateAiFrameAction,
} from "@/app/actions/frame";

interface CustomFrameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFrameCreated: (frameId: string) => void;
}

const INSPIRATION_CHIPS = [
  { label: "Parisian Romance", icon: Heart, prompt: "Parisian sunset with red roses and warm romantic blush tones" },
  { label: "Cyberpunk Neon", icon: Sparkles, prompt: "Tokyo cyberpunk neon night with electric violet and midnight blues" },
  { label: "Vintage Cinema", icon: Film, prompt: "35mm retro indie cinema filmstrip with analog frame numbering" },
  { label: "Cozy Polaroid", icon: Camera, prompt: "Warm autumn coffee shop memories with vintage polaroid margins" },
  { label: "Golden Hour", icon: Star, prompt: "Golden hour sunset beach with warm honey tones" },
  { label: "Celestial Night", icon: Sparkles, prompt: "Starry midnight galaxy under celestial starlight" },
];

export default function CustomFrameModal({
  isOpen,
  onClose,
  onFrameCreated,
}: CustomFrameModalProps) {
  // AI Prompt State
  const [aiPrompt, setAiPrompt] = useState("");
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  // Frame Customization State
  const [name, setName] = useState("My Romantic Keepsake");
  const [layout, setLayout] = useState<CustomLayoutType>("heart-duo");
  const [frameStyle, setFrameStyle] = useState<CustomFrameStyle>("heart");
  const [paletteIndex, setPaletteIndex] = useState(2); // Blush Rose default
  const [customBgColor, setCustomBgColor] = useState("#fff1f2");
  const [useGradient, setUseGradient] = useState(true);
  const [customGradient, setCustomGradient] = useState("#fce7f3");

  const [customText, setCustomText] = useState("Forever & Always");
  const [subtitle, setSubtitle] = useState("A little date night, no matter the distance");
  const [customDate, setCustomDate] = useState(() => {
    return new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  });
  const [decorativeIcon, setDecorativeIcon] = useState<DecorativeIcon>("heart");
  const [fontFamily, setFontFamily] = useState<CustomFontFamily>("serif");
  const [borderRadius, setBorderRadius] = useState(12);
  const [isPublic, setIsPublic] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  // Palette swatch selector handler
  const handleSelectPalette = (idx: number) => {
    setPaletteIndex(idx);
    const p = CUSTOM_COLOR_PALETTES[idx];
    if (p) {
      setCustomBgColor(p.bg);
      if (p.gradient) {
        setUseGradient(true);
        setCustomGradient(p.gradient);
      } else {
        setUseGradient(false);
      }
    }
  };

  // AI Theme Generation
  const handleGenerateAi = async (promptText?: string) => {
    const textToUse = promptText || aiPrompt;
    if (!textToUse.trim()) return;

    setIsAiGenerating(true);
    setError(null);

    try {
      const generated = await generateAiFrameAction(textToUse);
      if (generated) {
        setName(generated.name);
        setLayout(generated.layout);
        setFrameStyle(generated.frameStyle);
        setCustomBgColor(generated.backgroundColor);
        if (generated.backgroundGradient) {
          setUseGradient(true);
          setCustomGradient(generated.backgroundGradient);
        } else {
          setUseGradient(false);
        }
        setCustomText(generated.customText);
        setSubtitle(generated.subtitle);
        setDecorativeIcon(generated.decorativeIcon);
        setFontFamily(generated.fontFamily);
        setBorderRadius(generated.borderRadius);
        setPaletteIndex(-1); // Custom AI generated palette
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "AI theme generation failed");
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Draw pure vector shapes on canvas (Zero emojis!)
  const drawVectorHeart = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) => {
    ctx.save();
    ctx.fillStyle = color;
    ctx.translate(x, y - size / 2);
    ctx.beginPath();
    const topCurve = size * 0.3;
    ctx.moveTo(0, topCurve);
    ctx.bezierCurveTo(0, 0, -size / 2, 0, -size / 2, topCurve);
    ctx.bezierCurveTo(-size / 2, (size + topCurve) / 2, 0, size, 0, size * 1.15);
    ctx.bezierCurveTo(0, size, size / 2, (size + topCurve) / 2, size / 2, topCurve);
    ctx.bezierCurveTo(size / 2, 0, 0, 0, 0, topCurve);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  const drawVectorSparkle = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) => {
    ctx.save();
    ctx.fillStyle = color;
    ctx.translate(x, y);
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.quadraticCurveTo(0, 0, size, 0);
    ctx.quadraticCurveTo(0, 0, 0, size);
    ctx.quadraticCurveTo(0, 0, -size, 0);
    ctx.quadraticCurveTo(0, 0, 0, -size);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  const drawVectorStar = (ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, color: string) => {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    const spikes = 5;
    const outer = size;
    const inner = size / 2;
    let rot = (Math.PI / 2) * 3;
    const step = Math.PI / spikes;
    ctx.moveTo(cx, cy - outer);
    for (let i = 0; i < spikes; i++) {
      let x = cx + Math.cos(rot) * outer;
      let y = cy + Math.sin(rot) * outer;
      ctx.lineTo(x, y);
      rot += step;
      x = cx + Math.cos(rot) * inner;
      y = cy + Math.sin(rot) * inner;
      ctx.lineTo(x, y);
      rot += step;
    }
    ctx.lineTo(cx, cy - outer);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  const drawVectorCamera = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) => {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(2, size * 0.1);
    const w = size * 1.6;
    const h = size * 1.1;
    ctx.strokeRect(x - w / 2, y - h / 2, w, h);
    ctx.beginPath();
    ctx.arc(x, y, size * 0.35, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  };

  const drawVectorMail = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) => {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(2, size * 0.1);
    const w = size * 1.6;
    const h = size * 1.1;
    ctx.strokeRect(x - w / 2, y - h / 2, w, h);
    ctx.beginPath();
    ctx.moveTo(x - w / 2, y - h / 2);
    ctx.lineTo(x, y);
    ctx.lineTo(x + w / 2, y - h / 2);
    ctx.stroke();
    ctx.restore();
  };

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
      frameStyle,
      backgroundColor: customBgColor,
      backgroundGradient: useGradient ? customGradient : undefined,
      customText,
      subtitle,
      customDate,
      borderRadius,
      decorativeIcon,
      fontFamily,
    };

    const { config } = buildCustomFrameConfig(input);

    canvas.width = config.canvasWidth;
    canvas.height = config.canvasHeight;

    // 1. Background Fill
    if (config.backgroundGradient) {
      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, config.backgroundColor);
      grad.addColorStop(1, config.backgroundGradient);
      ctx.fillStyle = grad;
    } else {
      ctx.fillStyle = config.backgroundColor;
    }
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const isDark =
      config.backgroundColor === "#18181b" ||
      config.backgroundColor === "#0f172a" ||
      config.backgroundColor === "#09090b";

    // 2. Film Sprockets if vintage film style
    if (frameStyle === "film" || layout === "vintage-film") {
      const spWidth = canvas.width * 0.04;
      const spHeight = canvas.height * 0.025;
      const spColor = isDark ? "rgba(255, 255, 255, 0.35)" : "rgba(0, 0, 0, 0.25)";
      ctx.fillStyle = spColor;

      const totalHoles = 14;
      for (let i = 0; i < totalHoles; i++) {
        const yPos = (canvas.height / totalHoles) * i + spHeight * 0.5;
        // Left sprocket
        ctx.beginPath();
        ctx.roundRect(canvas.width * 0.03, yPos, spWidth, spHeight, 3);
        ctx.fill();
        // Right sprocket
        ctx.beginPath();
        ctx.roundRect(canvas.width * 0.93, yPos, spWidth, spHeight, 3);
        ctx.fill();
      }
    }

    // 3. Photo Slots Preview
    const placeholderColor = isDark
      ? "rgba(255, 255, 255, 0.12)"
      : "rgba(0, 0, 0, 0.06)";
    const slotBorderColor = isDark
      ? "rgba(255, 255, 255, 0.3)"
      : "rgba(0, 0, 0, 0.18)";

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
      ctx.lineWidth = Math.max(2, canvas.width * 0.003);
      ctx.setLineDash([8, 6]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Pose Label
      ctx.fillStyle = slotBorderColor;
      ctx.font = `600 ${Math.max(14, canvas.width * 0.028)}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`Pose ${slot.slotIndex + 1}`, sx + sw / 2, sy + sh / 2);
    }

    // 4. Vector Decorations
    for (const deco of config.decorations) {
      const dx = (deco.x / 100) * canvas.width;
      const dy = (deco.y / 100) * canvas.height;

      if (deco.type === "text") {
        const isMainTitle = deco.id === "cd-title";
        const fontSize = isMainTitle
          ? Math.max(16, canvas.width * 0.034)
          : Math.max(12, canvas.width * 0.022);

        ctx.font = `${isMainTitle ? "700" : "500"} ${fontSize}px ${deco.fontFamily ?? "sans-serif"}`;
        ctx.fillStyle = deco.color ?? (isDark ? "#ffffff" : "#18181b");
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(deco.content ?? "", dx, dy);
      } else if (deco.type === "timestamp") {
        const fontSize = Math.max(11, canvas.width * 0.018);
        ctx.font = `500 ${fontSize}px monospace`;
        ctx.fillStyle = deco.color ?? (isDark ? "#94a3b8" : "#948893");
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(deco.content ?? "", dx, dy);
      } else if (deco.type === "heart" || deco.content === "heart") {
        drawVectorHeart(ctx, dx, dy, Math.max(16, canvas.width * 0.03), deco.color ?? "#db4f70");
      } else if (deco.content === "sparkles") {
        drawVectorSparkle(ctx, dx, dy, Math.max(14, canvas.width * 0.025), deco.color ?? "#db4f70");
      } else if (deco.content === "star") {
        drawVectorStar(ctx, dx, dy, Math.max(14, canvas.width * 0.025), deco.color ?? "#db4f70");
      } else if (deco.content === "camera") {
        drawVectorCamera(ctx, dx, dy, Math.max(14, canvas.width * 0.022), deco.color ?? "#db4f70");
      } else if (deco.content === "mail") {
        drawVectorMail(ctx, dx, dy, Math.max(14, canvas.width * 0.022), deco.color ?? "#db4f70");
      }
    }
  }, [
    isOpen,
    name,
    layout,
    frameStyle,
    customBgColor,
    useGradient,
    customGradient,
    customText,
    subtitle,
    customDate,
    decorativeIcon,
    fontFamily,
    borderRadius,
  ]);

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
        frameStyle,
        backgroundColor: customBgColor,
        backgroundGradient: useGradient ? customGradient : undefined,
        customText,
        subtitle,
        customDate,
        borderRadius,
        decorativeIcon,
        fontFamily,
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
        className="custom-frame-modal-card custom-frame-modal-expanded"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-header">
          <div className="modal-title-group">
            <Sparkles size={18} className="text-rose" />
            <h3>Custom Keepsake Frame Studio</h3>
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

        {/* ── AI Magic Theme Generator Bar ── */}
        <div className="modal-ai-bar">
          <div className="ai-bar-title-row">
            <div className="ai-bar-label">
              <Wand2 size={15} className="text-rose" />
              <strong>AI Magic Studio</strong>
            </div>
            <span className="ai-bar-hint">Generate custom date themes in seconds</span>
          </div>

          <div className="ai-input-wrapper">
            <input
              type="text"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGenerateAi()}
              placeholder="Describe your date theme (e.g. Parisian Sunset & Roses, Cyberpunk Tokyo, 90s Vintage Cinema…)"
              className="ai-prompt-input"
            />
            <button
              type="button"
              className="button button-small ai-generate-btn"
              onClick={() => handleGenerateAi()}
              disabled={isAiGenerating}
            >
              {isAiGenerating ? (
                <>
                  <Loader2 size={14} className="spin" /> Generating…
                </>
              ) : (
                <>
                  <Sparkles size={14} /> Inspire with AI
                </>
              )}
            </button>
          </div>

          {/* Quick Inspiration Chips (Pure Lucide vector icons, ZERO emojis!) */}
          <div className="ai-chips-scroll">
            {INSPIRATION_CHIPS.map((chip) => {
              const Icon = chip.icon;
              return (
                <button
                  key={chip.label}
                  type="button"
                  className="ai-chip-btn"
                  onClick={() => {
                    setAiPrompt(chip.prompt);
                    handleGenerateAi(chip.prompt);
                  }}
                  disabled={isAiGenerating}
                >
                  <Icon size={12} />
                  <span>{chip.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="modal-split-body">
          {/* Controls Form Column */}
          <div className="modal-controls-col">
            {error && <div className="modal-error-banner">{error}</div>}

            {/* Frame Name */}
            <div className="form-group">
              <label htmlFor="frame-name">Frame Name</label>
              <input
                id="frame-name"
                type="text"
                maxLength={40}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Our Anniversary Keepsake"
                className="modal-text-input"
              />
            </div>

            {/* Layout Structure Picker (8 layouts) */}
            <div className="form-group">
              <label className="label-with-icon">
                <Layout size={14} /> Layout Structure ({CUSTOM_LAYOUTS.length} styles)
              </label>
              <div className="layout-picker-grid-expanded">
                {CUSTOM_LAYOUTS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`layout-option-btn ${layout === item.id ? "active" : ""}`}
                    onClick={() => setLayout(item.id)}
                  >
                    <div className="layout-btn-header">
                      <strong>{item.label}</strong>
                      <span className="layout-slot-badge">{item.slots} Cuts</span>
                    </div>
                    <small>{item.desc}</small>
                  </button>
                ))}
              </div>
            </div>

            {/* Frame Style Aesthetic */}
            <div className="form-group">
              <label className="label-with-icon">
                <Paintbrush size={14} /> Frame Style & Aesthetic
              </label>
              <div className="style-pills-row">
                {CUSTOM_FRAME_STYLES.map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    className={`style-pill-btn ${frameStyle === st.id ? "active" : ""}`}
                    onClick={() => setFrameStyle(st.id)}
                  >
                    {st.id === "heart" && <Heart size={13} />}
                    {st.id === "film" && <Film size={13} />}
                    {st.id === "polaroid" && <Camera size={13} />}
                    {st.id === "clean" && <Layout size={13} />}
                    {st.id === "scrapbook" && <Sparkles size={13} />}
                    <span>{st.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Background Color & Gradient Controls */}
            <div className="form-group">
              <label className="label-with-icon">
                <Palette size={14} /> Color Mood & Custom Palette
              </label>
              <div className="palette-swatch-row">
                {CUSTOM_COLOR_PALETTES.map((p, idx) => (
                  <button
                    key={p.name}
                    type="button"
                    className={`palette-swatch ${paletteIndex === idx ? "active" : ""}`}
                    style={{
                      background: p.gradient
                        ? `linear-gradient(135deg, ${p.bg}, ${p.gradient})`
                        : p.bg,
                    }}
                    onClick={() => handleSelectPalette(idx)}
                    title={p.name}
                  >
                    {paletteIndex === idx && <Check size={12} />}
                  </button>
                ))}
              </div>

              {/* Manual Color Picker Controls */}
              <div className="manual-color-pickers-row">
                <div className="color-picker-box">
                  <label className="sub-label">Base Color</label>
                  <div className="color-input-combo">
                    <input
                      type="color"
                      value={customBgColor}
                      onChange={(e) => {
                        setCustomBgColor(e.target.value);
                        setPaletteIndex(-1);
                      }}
                      className="color-wheel-input"
                    />
                    <span className="color-hex-tag">{customBgColor}</span>
                  </div>
                </div>

                <div className="color-picker-box">
                  <div className="gradient-toggle-row">
                    <label className="sub-label">Gradient Fill</label>
                    <input
                      type="checkbox"
                      checked={useGradient}
                      onChange={(e) => setUseGradient(e.target.checked)}
                      className="modal-mini-checkbox"
                    />
                  </div>
                  {useGradient && (
                    <div className="color-input-combo">
                      <input
                        type="color"
                        value={customGradient}
                        onChange={(e) => {
                          setCustomGradient(e.target.value);
                          setPaletteIndex(-1);
                        }}
                        className="color-wheel-input"
                      />
                      <span className="color-hex-tag">{customGradient}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Text & Romantic Headline */}
            <div className="form-group">
              <label htmlFor="custom-title" className="label-with-icon">
                <Type size={14} /> Headline Title
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

            {/* Subtitle / Quote */}
            <div className="form-group">
              <label htmlFor="custom-subtitle">Subtitle or Quote</label>
              <input
                id="custom-subtitle"
                type="text"
                maxLength={60}
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="e.g. A little date night, no matter the distance"
                className="modal-text-input"
              />
            </div>

            {/* Date Stamp & Typography */}
            <div className="form-row-2col">
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
                <label>Typography Style</label>
                <div className="typography-pills">
                  {(
                    [
                      { id: "serif", label: "Romantic" },
                      { id: "sans", label: "Modern" },
                      { id: "mono", label: "Vintage" },
                      { id: "cursive", label: "Cursive" },
                    ] as const
                  ).map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      className={`typo-pill ${fontFamily === f.id ? "active" : ""}`}
                      onClick={() => setFontFamily(f.id)}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Decorative Vector Stamp (Zero Emojis!) */}
            <div className="form-group">
              <label className="label-with-icon">
                <Sparkles size={14} /> Decorative Vector Accent
              </label>
              <div className="vector-icon-selector">
                {(
                  [
                    { id: "heart", label: "Heart", icon: Heart },
                    { id: "sparkles", label: "Sparkles", icon: Sparkles },
                    { id: "star", label: "Star", icon: Star },
                    { id: "camera", label: "Camera", icon: Camera },
                    { id: "mail", label: "Letter", icon: Mail },
                    { id: "none", label: "None", icon: X },
                  ] as const
                ).map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={`vector-icon-btn ${decorativeIcon === item.id ? "active" : ""}`}
                      onClick={() => setDecorativeIcon(item.id)}
                      title={item.label}
                    >
                      <Icon size={16} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Corner Radius Slider */}
            <div className="form-group">
              <label className="label-with-icon">
                <Sliders size={14} /> Corner Radius ({borderRadius}px)
              </label>
              <input
                type="range"
                min="0"
                max="24"
                value={borderRadius}
                onChange={(e) => setBorderRadius(parseInt(e.target.value, 10))}
                className="modal-range-slider"
              />
            </div>

            {/* Community Sharing Toggle */}
            <div className="form-group modal-toggle-group">
              <label className="modal-toggle-row">
                <div className="modal-toggle-text">
                  <div className="modal-toggle-title">
                    <Globe size={14} /> Share Frame Preset
                  </div>
                  <p className="modal-toggle-desc">
                    Allow other couples to select this layout template. Zero photos are shared.
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
            <span className="preview-label">Live Photobooth Canvas Preview</span>
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="modal-footer">
          <button
            type="button"
            className="button button-quiet button-small"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="button button-small"
            onClick={handleSave}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 size={14} className="spin" /> Creating Frame…
              </>
            ) : (
              "Save & Create Frame"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
