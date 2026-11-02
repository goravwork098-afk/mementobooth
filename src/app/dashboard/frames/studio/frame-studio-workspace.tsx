"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
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
  ArrowLeft,
  X,
  Move,
  Plus,
  Trash2,
  Copy,
  Square,
  Circle,
  Users,
  RotateCcw,
  Maximize2,
  Minimize2,
  Compass,
  SquareDashed,
} from "lucide-react";
import type { PhotoSlot, SlotShape } from "@/types/frame";
import {
  buildCustomFrameConfig,
  CUSTOM_COLOR_PALETTES,
  CUSTOM_FRAME_STYLES,
  STARTER_PRESETS,
  SLOT_SHAPES,
  traceSlotPath,
  type CustomLayoutType,
  type CustomFrameStyle,
  type CustomFontFamily,
  type DecorativeIcon,
  type CustomFrameInput,
  type StarterPreset,
} from "@/lib/custom-frame";
import {
  createCustomFrameAction,
  generateAiFrameAction,
} from "@/app/actions/frame";

const INSPIRATION_CHIPS = [
  { label: "Parisian Romance", icon: Heart, prompt: "Parisian sunset with red roses and warm romantic blush tones" },
  { label: "Cyberpunk Neon", icon: Sparkles, prompt: "Tokyo cyberpunk neon night with electric violet and midnight blues" },
  { label: "Vintage Cinema", icon: Film, prompt: "35mm retro indie cinema filmstrip with analog frame numbering" },
  { label: "Cozy Polaroid", icon: Camera, prompt: "Warm autumn coffee shop memories with vintage polaroid margins" },
  { label: "Golden Hour", icon: Star, prompt: "Golden hour sunset beach with warm honey tones" },
  { label: "Celestial Night", icon: Sparkles, prompt: "Starry midnight galaxy under celestial starlight" },
];

type WorkshopTab = "layout" | "colors" | "text" | "ai";
type DragMode = "none" | "move" | "resize-nw" | "resize-ne" | "resize-sw" | "resize-se";

export default function FrameStudioWorkspace() {
  const router = useRouter();

  // Active Tool Dock Tab
  const [activeTab, setActiveTab] = useState<WorkshopTab>("layout");

  // Fullscreen Photoshop Mode State
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Interactive Tool Guide Modal State
  const [showToolGuide, setShowToolGuide] = useState(false);

  // AI Prompt State
  const [aiPrompt, setAiPrompt] = useState("");
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  // Active Starter Preset (Default: Romantic Heart)
  const [activePresetId, setActivePresetId] = useState<string>("romantic-heart");

  // Dynamic Freeform Slots (Drag & Drop Canvas State)
  const [slots, setSlots] = useState<PhotoSlot[]>(() =>
    STARTER_PRESETS[1].slots.map((s) => ({ ...s }))
  );
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(() =>
    STARTER_PRESETS[1].slots[0]?.id ?? null
  );

  // Frame Customization State
  const [name, setName] = useState("Romantic Heart Keepsake");
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

  // Pointer Drag & Resize Interaction Ref
  const dragInteractionRef = useRef<{
    mode: DragMode;
    startX: number;
    startY: number;
    startSlot: PhotoSlot;
    canvasRect: DOMRect;
  } | null>(null);

  // Switch Starter Preset (handles Blank Canvas, Romantic Heart, Parisian Arch, Classic Strip)
  const handleSelectStarter = (preset: StarterPreset) => {
    setActivePresetId(preset.id);
    setLayout(preset.layout);
    setFrameStyle(preset.style);
    const clonedSlots = preset.slots.map((s) => ({ ...s }));
    setSlots(clonedSlots);
    setSelectedSlotId(clonedSlots[0]?.id ?? null);
    if (preset.id === "blank-canvas") {
      setName("My Custom Frame");
      setDecorativeIcon("none");
      setFrameStyle("clean");
      setCustomBgColor("#ffffff");
      setUseGradient(false);
      setCustomText("");
      setSubtitle("");
    } else if (preset.id === "romantic-heart") {
      setName("Romantic Heart Keepsake");
      setDecorativeIcon("heart");
    } else if (preset.id === "parisian-arch") {
      setName("Parisian Arch Keepsake");
      setDecorativeIcon("sparkles");
    } else {
      setName("Classic 4-Cut Keepsake");
      setDecorativeIcon("camera");
    }
  };

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
        setPaletteIndex(-1);

        // Update default slots matching AI layout with chosen style
        const input: CustomFrameInput = {
          name: generated.name,
          layout: generated.layout,
          frameStyle: generated.frameStyle,
          backgroundColor: generated.backgroundColor,
          customText: generated.customText,
        };
        const { config } = buildCustomFrameConfig(input);
        setSlots(config.slots.map((s) => ({ ...s })));
        setSelectedSlotId(config.slots[0]?.id ?? null);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "AI theme generation failed");
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Draw pure vector icons on canvas (Zero emojis!)
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

  // Add new photo slot with smart offset positioning
  const handleAddSlot = (shape: SlotShape = "heart") => {
    const newIndex = slots.length;
    const newId = `slot-${Date.now()}`;

    // Smart positioning so new slots don't stack directly on top of each other
    let newX = 25;
    let newY = 25;
    if (newIndex === 2) {
      newX = 12;
      newY = 52;
    } else if (newIndex === 3) {
      newX = 52;
      newY = 52;
    } else {
      newX = Math.min(60, 10 + (newIndex % 3) * 22);
      newY = Math.min(60, 15 + Math.floor(newIndex / 3) * 22);
    }

    const newSlot: PhotoSlot = {
      id: newId,
      slotIndex: newIndex,
      x: newX,
      y: newY,
      width: 38,
      height: 36,
      borderRadius: borderRadius,
      shape: shape,
      assignedUser: "BOTH", // Default: Together (Couple pose!)
    };
    const updated = [...slots, newSlot];
    setSlots(updated);
    setSelectedSlotId(newId);
  };

  // Delete selected slot with validation and auto-selection of remaining slot
  const handleDeleteSlot = useCallback(
    (id: string) => {
      if (slots.length <= 1) {
        setError("A frame must contain at least 1 photo slot.");
        return;
      }
      setError(null);
      const updated = slots
        .filter((s) => s.id !== id)
        .map((s, idx) => ({ ...s, slotIndex: idx }));
      setSlots(updated);
      if (selectedSlotId === id) {
        setSelectedSlotId(updated[0]?.id ?? null);
      }
    },
    [slots, selectedSlotId]
  );

  // Global Keyboard Delete Listener (Delete or Backspace deletes the active slot)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === "Delete" || e.key === "Backspace") && selectedSlotId) {
        const target = e.target as HTMLElement | null;
        const tag = target?.tagName?.toLowerCase();
        if (tag === "input" || tag === "textarea" || target?.isContentEditable) {
          return;
        }
        e.preventDefault();
        handleDeleteSlot(selectedSlotId);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedSlotId, handleDeleteSlot]);

  // Duplicate slot
  const handleDuplicateSlot = (id: string) => {
    const target = slots.find((s) => s.id === id);
    if (!target) return;
    const newId = `slot-${Date.now()}`;
    const newSlot: PhotoSlot = {
      ...target,
      id: newId,
      slotIndex: slots.length,
      x: Math.min(60, target.x + 4),
      y: Math.min(60, target.y + 4),
    };
    setSlots([...slots, newSlot]);
    setSelectedSlotId(newId);
  };

  // Change slot shape
  const handleChangeSlotShape = (id: string, shape: SlotShape) => {
    setSlots((prev) =>
      prev.map((s) => (s.id === id ? { ...s, shape } : s))
    );
  };

  // Change slot partner assignment
  const handleChangeSlotUser = (id: string, assignedUser: "HOST" | "GUEST" | "BOTH") => {
    setSlots((prev) =>
      prev.map((s) => (s.id === id ? { ...s, assignedUser } : s))
    );
  };

  // Move slot forward in layer order
  const handleBringSlotForward = (id: string) => {
    const idx = slots.findIndex((s) => s.id === id);
    if (idx < 0 || idx === slots.length - 1) return;
    const updated = [...slots];
    const [moved] = updated.splice(idx, 1);
    updated.push(moved);
    setSlots(updated.map((s, i) => ({ ...s, slotIndex: i })));
  };

  // ── Canvas Interaction Handlers (Pointer Drag & Resize) ──
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const pxX = (e.clientX - rect.left) * scaleX;
    const pxY = (e.clientY - rect.top) * scaleY;

    // 1. Check if clicking on resize handles of current selected slot
    const selected = slots.find((s) => s.id === selectedSlotId);
    if (selected) {
      const sx = (selected.x / 100) * canvas.width;
      const sy = (selected.y / 100) * canvas.height;
      const sw = (selected.width / 100) * canvas.width;
      const sh = (selected.height / 100) * canvas.height;
      const handleHitRadius = Math.max(16, canvas.width * 0.025);

      const handles = [
        { mode: "resize-nw" as const, x: sx, y: sy },
        { mode: "resize-ne" as const, x: sx + sw, y: sy },
        { mode: "resize-sw" as const, x: sx, y: sy + sh },
        { mode: "resize-se" as const, x: sx + sw, y: sy + sh },
      ];

      for (const h of handles) {
        const dist = Math.hypot(pxX - h.x, pxY - h.y);
        if (dist <= handleHitRadius) {
          dragInteractionRef.current = {
            mode: h.mode,
            startX: e.clientX,
            startY: e.clientY,
            startSlot: { ...selected },
            canvasRect: rect,
          };
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
          return;
        }
      }
    }

    // 2. Check if clicking inside any slot (reverse order for top-most)
    for (let i = slots.length - 1; i >= 0; i--) {
      const slot = slots[i];
      const sx = (slot.x / 100) * canvas.width;
      const sy = (slot.y / 100) * canvas.height;
      const sw = (slot.width / 100) * canvas.width;
      const sh = (slot.height / 100) * canvas.height;

      if (pxX >= sx && pxX <= sx + sw && pxY >= sy && pxY <= sy + sh) {
        setSelectedSlotId(slot.id);
        dragInteractionRef.current = {
          mode: "move",
          startX: e.clientX,
          startY: e.clientY,
          startSlot: { ...slot },
          canvasRect: rect,
        };
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        return;
      }
    }

    // 3. Clicked empty canvas space
    setSelectedSlotId(null);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const interaction = dragInteractionRef.current;
    if (!interaction) return;

    const { mode, startX, startY, startSlot, canvasRect } = interaction;
    if (mode === "none") return;

    const deltaX = ((e.clientX - startX) / canvasRect.width) * 100;
    const deltaY = ((e.clientY - startY) / canvasRect.height) * 100;

    if (mode === "move") {
      const newX = Math.max(1, Math.min(99 - startSlot.width, startSlot.x + deltaX));
      const newY = Math.max(1, Math.min(99 - startSlot.height, startSlot.y + deltaY));

      setSlots((prev) =>
        prev.map((s) =>
          s.id === startSlot.id ? { ...s, x: Math.round(newX * 10) / 10, y: Math.round(newY * 10) / 10 } : s
        )
      );
    } else if (mode === "resize-se") {
      const newW = Math.max(10, Math.min(98 - startSlot.x, startSlot.width + deltaX));
      const newH = Math.max(10, Math.min(98 - startSlot.y, startSlot.height + deltaY));

      setSlots((prev) =>
        prev.map((s) =>
          s.id === startSlot.id ? { ...s, width: Math.round(newW * 10) / 10, height: Math.round(newH * 10) / 10 } : s
        )
      );
    } else if (mode === "resize-sw") {
      const newW = Math.max(10, startSlot.width - deltaX);
      const newX = Math.max(1, startSlot.x + deltaX);
      const newH = Math.max(10, Math.min(98 - startSlot.y, startSlot.height + deltaY));

      setSlots((prev) =>
        prev.map((s) =>
          s.id === startSlot.id
            ? { ...s, x: Math.round(newX * 10) / 10, width: Math.round(newW * 10) / 10, height: Math.round(newH * 10) / 10 }
            : s
        )
      );
    } else if (mode === "resize-ne") {
      const newW = Math.max(10, Math.min(98 - startSlot.x, startSlot.width + deltaX));
      const newH = Math.max(10, startSlot.height - deltaY);
      const newY = Math.max(1, startSlot.y + deltaY);

      setSlots((prev) =>
        prev.map((s) =>
          s.id === startSlot.id
            ? { ...s, y: Math.round(newY * 10) / 10, width: Math.round(newW * 10) / 10, height: Math.round(newH * 10) / 10 }
            : s
        )
      );
    } else if (mode === "resize-nw") {
      const newW = Math.max(10, startSlot.width - deltaX);
      const newH = Math.max(10, startSlot.height - deltaY);
      const newX = Math.max(1, startSlot.x + deltaX);
      const newY = Math.max(1, startSlot.y + deltaY);

      setSlots((prev) =>
        prev.map((s) =>
          s.id === startSlot.id
            ? {
                ...s,
                x: Math.round(newX * 10) / 10,
                y: Math.round(newY * 10) / 10,
                width: Math.round(newW * 10) / 10,
                height: Math.round(newH * 10) / 10,
              }
            : s
        )
      );
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (dragInteractionRef.current) {
      dragInteractionRef.current = null;
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Safe fallback
      }
    }
  };

  // Render live preview on canvas whenever inputs change
  const renderCanvas = useCallback(() => {
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
      customSlots: slots,
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

    // 3. Photo Slots Preview with True Shape Masks
    for (const slot of slots) {
      const sx = (slot.x / 100) * canvas.width;
      const sy = (slot.y / 100) * canvas.height;
      const sw = (slot.width / 100) * canvas.width;
      const sh = (slot.height / 100) * canvas.height;
      const r = slot.borderRadius ?? borderRadius;

      ctx.save();

      // Clip to authentic geometric shape (Heart, Arch, Circle, Star, Rectangle)
      traceSlotPath(ctx, slot.shape, sx, sy, sw, sh, r);
      ctx.clip();

      // Soft preview placeholder gradient
      const slotGrad = ctx.createLinearGradient(sx, sy, sx + sw, sy + sh);
      if (isDark) {
        slotGrad.addColorStop(0, "rgba(255, 255, 255, 0.12)");
        slotGrad.addColorStop(1, "rgba(255, 255, 255, 0.04)");
      } else {
        slotGrad.addColorStop(0, "rgba(240, 230, 240, 0.7)");
        slotGrad.addColorStop(1, "rgba(248, 238, 245, 0.45)");
      }
      ctx.fillStyle = slotGrad;
      ctx.fillRect(sx, sy, sw, sh);

      // Stylized silhouette preview inside the shape
      const midX = sx + sw / 2;
      const midY = sy + sh / 2;
      ctx.fillStyle = isDark ? "rgba(255, 255, 255, 0.22)" : "rgba(180, 150, 175, 0.35)";

      // Silhouette head
      ctx.beginPath();
      ctx.arc(midX, midY - sh * 0.1, Math.min(sw, sh) * 0.18, 0, Math.PI * 2);
      ctx.fill();

      // Silhouette shoulders
      ctx.beginPath();
      ctx.arc(midX, midY + sh * 0.38, Math.min(sw, sh) * 0.36, Math.PI, 0, false);
      ctx.fill();

      ctx.restore();

      // Outline border matching slot shape
      ctx.save();
      const isSelected = slot.id === selectedSlotId;
      ctx.strokeStyle = isSelected
        ? "#e11d48"
        : isDark
        ? "rgba(255, 255, 255, 0.35)"
        : "rgba(0, 0, 0, 0.18)";
      ctx.lineWidth = isSelected ? Math.max(3.5, canvas.width * 0.005) : Math.max(2, canvas.width * 0.003);

      if (isSelected) {
        ctx.setLineDash([8, 6]);
      }
      traceSlotPath(ctx, slot.shape, sx, sy, sw, sh, r);
      ctx.stroke();
      ctx.restore();

      // Pose number tag
      ctx.save();
      ctx.font = `700 ${Math.max(12, canvas.width * 0.024)}px sans-serif`;
      ctx.fillStyle = isDark ? "#ffffff" : "#4a3e47";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`Pose ${slot.slotIndex + 1}`, midX, midY + sh * 0.14);

      // Pose assignment badge (Together / Host Solo / Guest Solo)
      ctx.font = `600 ${Math.max(10, canvas.width * 0.018)}px sans-serif`;
      ctx.fillStyle = isDark ? "rgba(255, 255, 255, 0.75)" : "#7d6373";
      const poseMode =
        slot.assignedUser === "HOST"
          ? "Host Solo"
          : slot.assignedUser === "GUEST"
          ? "Guest Solo"
          : "Together";
      ctx.fillText(poseMode, midX, midY + sh * 0.25);
      ctx.restore();

      // 4 Corner Anchor Handles for Selected Slot
      if (isSelected) {
        const handleSize = Math.max(7, canvas.width * 0.012);
        const handles = [
          { x: sx, y: sy },
          { x: sx + sw, y: sy },
          { x: sx, y: sy + sh },
          { x: sx + sw, y: sy + sh },
        ];

        for (const h of handles) {
          ctx.save();
          ctx.fillStyle = "#ffffff";
          ctx.strokeStyle = "#e11d48";
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(h.x, h.y, handleSize, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        }
      }
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
    slots,
    selectedSlotId,
  ]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Please enter a name for your custom frame.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await createCustomFrameAction({
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
        customSlots: slots,
      });

      router.push("/dashboard/frames");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create custom frame.");
      setSubmitting(false);
    }
  };

  const selectedSlot = slots.find((s) => s.id === selectedSlotId);

  return (
    <div className={`studio-workshop-container ${isFullScreen ? "workshop-fullscreen-mode" : ""}`}>
      {/* ── Workshop Top Navigation Bar ── */}
      <div className="studio-top-nav">
        <Link href="/dashboard/frames" className="studio-back-link">
          <ArrowLeft size={16} />
          <span>Back to Collections</span>
        </Link>

        <div className="workshop-name-inline">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
            placeholder="Name your frame…"
            className="workshop-name-input"
          />
        </div>

        <div className="studio-actions-quick">
          <button
            type="button"
            className="workshop-guide-btn"
            onClick={() => setShowToolGuide(true)}
            title="Open Interactive Tool Guide"
          >
            <Compass size={15} />
            <span>Tool Guide</span>
          </button>

          <button
            type="button"
            className="workshop-mode-btn"
            onClick={() => setIsFullScreen((prev) => !prev)}
            title={isFullScreen ? "Exit Fullscreen" : "Photoshop Fullscreen Mode"}
          >
            {isFullScreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            <span>{isFullScreen ? "Exit Fullscreen" : "Photoshop Mode"}</span>
          </button>

          <button
            type="button"
            className="button button-small studio-primary-save"
            onClick={handleSave}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 size={14} className="spin" /> Saving…
              </>
            ) : (
              "Save & Add to Collections"
            )}
          </button>
        </div>
      </div>

      {error && <div className="modal-error-banner">{error}</div>}

      {/* ── Main Workshop Workspace ── */}
      <div className="studio-workshop-main">
        {/* 1. Left Tool Dock Navigation (Pure Vector Icons) */}
        <nav className="workshop-tool-dock">
          <button
            type="button"
            className={`tool-dock-btn ${activeTab === "layout" ? "active" : ""}`}
            onClick={() => setActiveTab("layout")}
          >
            <Layout size={18} />
            <span>Layout & Shapes</span>
          </button>

          <button
            type="button"
            className={`tool-dock-btn ${activeTab === "colors" ? "active" : ""}`}
            onClick={() => setActiveTab("colors")}
          >
            <Palette size={18} />
            <span>Colors & Theme</span>
          </button>

          <button
            type="button"
            className={`tool-dock-btn ${activeTab === "text" ? "active" : ""}`}
            onClick={() => setActiveTab("text")}
          >
            <Type size={18} />
            <span>Text & Accents</span>
          </button>

          <button
            type="button"
            className={`tool-dock-btn ${activeTab === "ai" ? "active" : ""}`}
            onClick={() => setActiveTab("ai")}
          >
            <Wand2 size={18} />
            <span>AI Assistant</span>
          </button>
        </nav>

        {/* 2. Focused Drawer Panel (Only displays controls for the active tab) */}
        <aside className="workshop-drawer-panel">
          {/* TAB 1: LAYOUT & SHAPES */}
          {activeTab === "layout" && (
            <>
              {/* Starter Presets */}
              <div className="studio-panel-card">
                <div className="panel-title-group">
                  <Layout size={16} className="text-rose" />
                  <h3>Starter Templates</h3>
                </div>
                <div className="workshop-starters-vertical">
                  {STARTER_PRESETS.map((preset) => {
                    const isActive = activePresetId === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        className={`starter-btn ${isActive ? "active" : ""}`}
                        onClick={() => handleSelectStarter(preset)}
                      >
                        <div className="starter-icon-wrap">
                          {preset.id === "blank-canvas" && <SquareDashed size={18} />}
                          {preset.id === "romantic-heart" && <Heart size={18} />}
                          {preset.id === "parisian-arch" && <Layout size={18} />}
                          {preset.id === "classic-strip" && <Square size={18} />}
                        </div>
                        <div className="starter-text-wrap">
                          <strong>{preset.label}</strong>
                          <small>{preset.desc}</small>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Active Slot Inspector */}
              {selectedSlot ? (
                <div className="slot-inspector-card">
                  <div className="inspector-header-row">
                    <div className="inspector-title-group">
                      <Sliders size={15} className="text-rose" />
                      <h4>Pose {selectedSlot.slotIndex + 1} Selected</h4>
                    </div>
                    <div className="inspector-actions-group">
                      <button
                        type="button"
                        className="inspector-mini-btn"
                        onClick={() => handleDuplicateSlot(selectedSlot.id)}
                        title="Duplicate Slot"
                      >
                        <Copy size={12} /> Duplicate
                      </button>
                      <button
                        type="button"
                        className="inspector-mini-btn"
                        onClick={() => handleBringSlotForward(selectedSlot.id)}
                        title="Bring to Front"
                      >
                        <RotateCcw size={12} /> Front
                      </button>
                      <button
                        type="button"
                        className="inspector-mini-btn danger"
                        onClick={() => handleDeleteSlot(selectedSlot.id)}
                        title="Delete Pose (or press Delete / Backspace key)"
                      >
                        <Trash2 size={12} /> Delete
                      </button>
                    </div>
                  </div>

                  {/* Per-Slot Cutout Shape Selector */}
                  <div>
                    <label className="sub-label">Authentic Cutout Shape</label>
                    <div className="shape-pills-grid">
                      {SLOT_SHAPES.map((sh) => {
                        const isShapeActive = (selectedSlot.shape ?? "rectangle") === sh.id;
                        return (
                          <button
                            key={sh.id}
                            type="button"
                            className={`shape-pill-option ${isShapeActive ? "active" : ""}`}
                            onClick={() => handleChangeSlotShape(selectedSlot.id, sh.id)}
                            title={sh.desc}
                          >
                            {sh.id === "heart" && <Heart size={15} />}
                            {sh.id === "arch" && <Layout size={15} />}
                            {sh.id === "circle" && <Circle size={15} />}
                            {sh.id === "rectangle" && <Square size={15} />}
                            {sh.id === "star" && <Star size={15} />}
                            <span>{sh.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Partner Pose Assignment */}
                  <div>
                    <label className="sub-label">Who poses in this photo slot?</label>
                    <div className="partner-assign-row">
                      {(["BOTH", "HOST", "GUEST"] as const).map((role) => (
                        <button
                          key={role}
                          type="button"
                          className={`partner-assign-btn ${selectedSlot.assignedUser === role ? "active" : ""}`}
                          onClick={() => handleChangeSlotUser(selectedSlot.id, role)}
                        >
                          <Users size={12} />
                          <span>{role === "BOTH" ? "Together (Couple)" : role === "HOST" ? "Host Solo" : "Guest Solo"}</span>
                        </button>
                      ))}
                    </div>
                    <small style={{ display: "block", marginTop: "8px", fontSize: "11px", color: "var(--muted)", lineHeight: 1.4 }}>
                      The photobooth takes photos round-by-round: Pose 1, Pose 2, etc. Press Delete or Backspace key anytime to remove this pose.
                    </small>
                  </div>
                </div>
              ) : (
                <div className="studio-panel-card">
                  <div className="canvas-drag-hint">
                    <Move size={14} className="text-rose" />
                    <span>Click on any pose on the canvas to customize its shape or remove it.</span>
                  </div>
                </div>
              )}
            </>
          )}

          {/* TAB 2: COLORS & THEME */}
          {activeTab === "colors" && (
            <>
              <div className="studio-panel-card">
                <div className="panel-title-group">
                  <Palette size={16} className="text-rose" />
                  <h3>Color Story & Palettes</h3>
                </div>

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

                {/* Manual Color Pickers */}
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

              {/* Aesthetic Motifs */}
              <div className="studio-panel-card">
                <div className="panel-title-group">
                  <Sparkles size={16} className="text-rose" />
                  <h3>Frame Aesthetic & Style</h3>
                </div>
                <div className="style-pills-row">
                  {CUSTOM_FRAME_STYLES.map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      className={`style-pill-btn ${frameStyle === st.id ? "active" : ""}`}
                      onClick={() => setFrameStyle(st.id)}
                    >
                      {st.id === "heart" && <Heart size={14} />}
                      {st.id === "film" && <Film size={14} />}
                      {st.id === "polaroid" && <Camera size={14} />}
                      {st.id === "clean" && <Layout size={14} />}
                      {st.id === "scrapbook" && <Sparkles size={14} />}
                      <span>{st.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Corner Radius */}
              <div className="studio-panel-card">
                <div className="panel-title-group">
                  <Sliders size={16} className="text-rose" />
                  <h3>Corner Geometry ({borderRadius}px)</h3>
                </div>
                <input
                  type="range"
                  min="0"
                  max="24"
                  value={borderRadius}
                  onChange={(e) => setBorderRadius(parseInt(e.target.value, 10))}
                  className="modal-range-slider"
                />
              </div>
            </>
          )}

          {/* TAB 3: TEXT & ACCENTS */}
          {activeTab === "text" && (
            <>
              <div className="studio-panel-card">
                <div className="panel-title-group">
                  <Type size={16} className="text-rose" />
                  <h3>Typography & Messages</h3>
                </div>

                <div className="form-group">
                  <label htmlFor="custom-title">Headline Title</label>
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
              </div>

              {/* Decorative Vector Accents */}
              <div className="studio-panel-card">
                <div className="panel-title-group">
                  <Sparkles size={16} className="text-rose" />
                  <h3>Decorative Vector Accent</h3>
                </div>
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

              {/* Community Sharing Toggle */}
              <div className="studio-panel-card">
                <label className="modal-toggle-row">
                  <div className="modal-toggle-text">
                    <div className="modal-toggle-title">
                      <Globe size={15} /> Share Frame with Community
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
            </>
          )}

          {/* TAB 4: AI ASSISTANT */}
          {activeTab === "ai" && (
            <div className="studio-ai-card">
              <div className="ai-bar-title-row">
                <div className="ai-bar-label">
                  <Wand2 size={16} className="text-rose" />
                  <strong>AI Theme Studio</strong>
                </div>
                <span className="ai-bar-hint">Prompt AI to style a personalized date theme</span>
              </div>

              <div className="ai-input-wrapper">
                <input
                  type="text"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleGenerateAi()}
                  placeholder="Describe your date theme (e.g. Parisian Sunset & Roses, Cyberpunk Tokyo…)"
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

              {/* Quick Inspiration Chips */}
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
          )}
        </aside>

        {/* 3. Center Workshop Stage: Spacious Canvas Viewport */}
        <main className="workshop-canvas-stage-col">
          <div className="workshop-canvas-card">
            <div className="workshop-canvas-header">
              <span className="live-preview-badge">
                <span className="live-preview-pulse" /> Workshop Stage
              </span>
              <div className="canvas-header-actions">
                <span className="canvas-dimensions-tag">
                  {selectedSlot
                    ? `Pose ${selectedSlot.slotIndex + 1} (${selectedSlot.shape ?? "heart"})`
                    : `${slots.length} Photo Poses`}
                </span>
                {selectedSlot && (
                  <button
                    type="button"
                    className="canvas-mini-delete-btn"
                    onClick={() => handleDeleteSlot(selectedSlot.id)}
                    title="Delete Selected Pose (or press Delete / Backspace key)"
                  >
                    <Trash2 size={12} /> Remove Pose {selectedSlot.slotIndex + 1}
                  </button>
                )}
              </div>
            </div>

            {/* Interactive Canvas */}
            <div className="studio-canvas-stage">
              <canvas
                ref={previewCanvasRef}
                className="studio-preview-canvas"
                style={{ cursor: selectedSlotId ? "move" : "pointer" }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
              />
            </div>

            {/* Canvas Quick-Action Toolbar */}
            <div className="studio-canvas-toolbar">
              <button
                type="button"
                className="canvas-toolbar-btn primary"
                onClick={() => handleAddSlot("heart")}
              >
                <Plus size={13} /> Add Heart Slot
              </button>

              <button
                type="button"
                className="canvas-toolbar-btn"
                onClick={() => handleAddSlot("arch")}
              >
                <Plus size={13} /> Add Arch Slot
              </button>

              <button
                type="button"
                className="canvas-toolbar-btn"
                onClick={() => handleAddSlot("rectangle")}
              >
                <Plus size={13} /> Add Rect Slot
              </button>

              {selectedSlot && (
                <button
                  type="button"
                  className="canvas-toolbar-btn danger"
                  onClick={() => handleDeleteSlot(selectedSlot.id)}
                  title="Delete Selected Pose (or press Delete / Backspace key)"
                >
                  <Trash2 size={13} /> Delete Pose {selectedSlot.slotIndex + 1}
                </button>
              )}

              <button
                type="button"
                className="canvas-toolbar-btn"
                onClick={() => handleSelectStarter(STARTER_PRESETS[1])}
                title="Reset to clean 2-cut couple duo"
              >
                <RotateCcw size={13} /> Reset Duo
              </button>
            </div>
          </div>
        </main>
      </div>

      {/* ── Interactive Workshop Tool Guide Dialog ── */}
      {showToolGuide && (
        <div
          className="tool-guide-modal-backdrop"
          onClick={() => setShowToolGuide(false)}
        >
          <div
            className="tool-guide-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="tool-guide-header">
              <div className="tool-guide-title">
                <Compass size={18} className="text-rose" />
                <h3>Workshop Tool Guide & Shortcuts</h3>
              </div>
              <button
                type="button"
                className="tool-guide-close-btn"
                onClick={() => setShowToolGuide(false)}
                aria-label="Close guide"
              >
                <X size={16} />
              </button>
            </div>

            <div className="tool-guide-grid">
              <div className="tool-guide-card">
                <div className="guide-card-icon">
                  <SquareDashed size={20} />
                </div>
                <strong>1. Start from Scratch</strong>
                <p>Pick &ldquo;Blank Canvas (Empty Box)&rdquo; to build freely from zero, or choose Heart or Arch starters.</p>
              </div>

              <div className="tool-guide-card">
                <div className="guide-card-icon">
                  <Move size={20} />
                </div>
                <strong>2. Free Drag & Placement</strong>
                <p>Click or tap anywhere inside a photo slot and drag to reposition it freely on the canvas.</p>
              </div>

              <div className="tool-guide-card">
                <div className="guide-card-icon">
                  <Maximize2 size={20} />
                </div>
                <strong>3. Scale with Corner Anchors</strong>
                <p>Select any slot and drag any of the 4 white corner anchor dots to scale width &amp; height.</p>
              </div>

              <div className="tool-guide-card">
                <div className="guide-card-icon">
                  <Heart size={20} />
                </div>
                <strong>4. Authentic Cutout Shapes</strong>
                <p>Convert any slot into a Heart, Parisian Arch, Circle, Rectangle, or Star mask instantly.</p>
              </div>

              <div className="tool-guide-card">
                <div className="guide-card-icon">
                  <Users size={20} />
                </div>
                <strong>5. Sequential Couple Poses</strong>
                <p>The booth shoots round-by-round (Pose 1, Pose 2...). Choose Together, Host Solo, or Guest Solo.</p>
              </div>

              <div className="tool-guide-card">
                <div className="guide-card-icon">
                  <Trash2 size={20} />
                </div>
                <strong>6. Instant Deletion & Keys</strong>
                <p>Press the Delete or Backspace key on your keyboard, or click the red Delete button to remove any pose.</p>
              </div>
            </div>

            <div className="tool-guide-footer">
              <button
                type="button"
                className="button button-small studio-primary-save"
                onClick={() => setShowToolGuide(false)}
              >
                Got It &bull; Back to Workshop
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
