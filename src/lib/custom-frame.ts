import type { FrameConfig, PhotoSlot, FrameDecoration, SlotShape } from "@/types/frame";

export type CustomLayoutType =
  | "4-cut-strip"
  | "3-cut-strip"
  | "2-cut-duo"
  | "1-cut-polaroid"
  | "2x2-quad"
  | "heart-duo"
  | "vintage-film"
  | "6-cut-matrix";

export type CustomFrameStyle =
  | "clean"
  | "heart"
  | "film"
  | "polaroid"
  | "scrapbook";

export type CustomFontFamily = "serif" | "sans" | "mono" | "cursive";

export type DecorativeIcon =
  | "heart"
  | "sparkles"
  | "star"
  | "camera"
  | "mail"
  | "none";

export interface CustomFrameInput {
  name: string;
  layout: CustomLayoutType;
  frameStyle?: CustomFrameStyle;
  backgroundColor: string;
  backgroundGradient?: string;
  customText?: string;
  subtitle?: string;
  customDate?: string;
  borderRadius?: number;
  decorativeIcon?: DecorativeIcon;
  fontFamily?: CustomFontFamily;
  isPublic?: boolean;
  customSlots?: PhotoSlot[];
}

export interface StarterPreset {
  id: "classic-strip" | "romantic-heart" | "parisian-arch" | "blank-canvas";
  label: string;
  desc: string;
  shape: SlotShape;
  layout: CustomLayoutType;
  style: CustomFrameStyle;
  slots: PhotoSlot[];
}

export const STARTER_PRESETS: StarterPreset[] = [
  {
    id: "blank-canvas",
    label: "Blank Canvas (Empty Box)",
    desc: "Start from a clean slate to build your own custom frame with any shapes",
    shape: "heart",
    layout: "2-cut-duo",
    style: "clean",
    slots: [
      { id: "s-1", slotIndex: 0, x: 28, y: 16, width: 44, height: 50, borderRadius: 12, shape: "heart", assignedUser: "BOTH" },
    ],
  },
  {
    id: "romantic-heart",
    label: "Heart Silhouette",
    desc: "Romantic couple duo with authentic heart cutout shape masks",
    shape: "heart",
    layout: "heart-duo",
    style: "heart",
    slots: [
      { id: "s-1", slotIndex: 0, x: 7, y: 9, width: 41, height: 68, borderRadius: 0, shape: "heart", assignedUser: "HOST" },
      { id: "s-2", slotIndex: 1, x: 52, y: 9, width: 41, height: 68, borderRadius: 0, shape: "heart", assignedUser: "GUEST" },
    ],
  },
  {
    id: "parisian-arch",
    label: "Parisian Arch",
    desc: "Architectural arched window portraits with semicircular crests",
    shape: "arch",
    layout: "2-cut-duo",
    style: "clean",
    slots: [
      { id: "s-1", slotIndex: 0, x: 8, y: 8, width: 40, height: 72, borderRadius: 0, shape: "arch", assignedUser: "HOST" },
      { id: "s-2", slotIndex: 1, x: 52, y: 8, width: 40, height: 72, borderRadius: 0, shape: "arch", assignedUser: "GUEST" },
    ],
  },
  {
    id: "classic-strip",
    label: "Classic Normal",
    desc: "Vertical 4-cut photobooth strip with clean rectangular slots",
    shape: "rectangle",
    layout: "4-cut-strip",
    style: "clean",
    slots: [
      { id: "s-1", slotIndex: 0, x: 6, y: 3, width: 88, height: 21, borderRadius: 8, shape: "rectangle", assignedUser: "HOST" },
      { id: "s-2", slotIndex: 1, x: 6, y: 26, width: 88, height: 21, borderRadius: 8, shape: "rectangle", assignedUser: "GUEST" },
      { id: "s-3", slotIndex: 2, x: 6, y: 49, width: 88, height: 21, borderRadius: 8, shape: "rectangle", assignedUser: "HOST" },
      { id: "s-4", slotIndex: 3, x: 6, y: 72, width: 88, height: 21, borderRadius: 8, shape: "rectangle", assignedUser: "GUEST" },
    ],
  },
];

export const SLOT_SHAPES: { id: SlotShape; label: string; desc: string }[] = [
  { id: "rectangle", label: "Classic Normal", desc: "Rectangular photo slot" },
  { id: "heart", label: "Heart Cutout", desc: "Romantic heart silhouette mask" },
  { id: "arch", label: "Parisian Arch", desc: "Arched window silhouette" },
  { id: "circle", label: "Circle / Oval", desc: "Smooth rounded medallion" },
  { id: "star", label: "Celestial Star", desc: "5-point star cutout mask" },
];

/**
 * Trace geometric clipping path on 2D canvas according to slot shape.
 * Used identically across studio canvas, live composer, and final export.
 */
export function traceSlotPath(
  ctx: CanvasRenderingContext2D,
  shape: SlotShape | undefined,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number = 0
): void {
  ctx.beginPath();
  switch (shape) {
    case "heart": {
      // Inscribed cubic Bezier parametric heart curve
      const topCuspY = y + h * 0.28;
      const bottomTipY = y + h * 0.94;
      const midX = x + w / 2;
      ctx.moveTo(midX, topCuspY);
      ctx.bezierCurveTo(midX, y, x, y, x, topCuspY);
      ctx.bezierCurveTo(x, y + h * 0.58, midX - w * 0.18, bottomTipY - h * 0.12, midX, bottomTipY);
      ctx.bezierCurveTo(midX + w * 0.18, bottomTipY - h * 0.12, x + w, y + h * 0.58, x + w, topCuspY);
      ctx.bezierCurveTo(x + w, y, midX, y, midX, topCuspY);
      ctx.closePath();
      break;
    }
    case "arch": {
      // Parisian arch: arched semicircular crest with vertical legs and flat bottom
      const r = w / 2;
      ctx.moveTo(x, y + r);
      ctx.arc(x + r, y + r, r, Math.PI, 0, false);
      ctx.lineTo(x + w, y + h);
      ctx.lineTo(x, y + h);
      ctx.closePath();
      break;
    }
    case "circle": {
      // Ellipse fitting slot boundaries
      ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
      ctx.closePath();
      break;
    }
    case "star": {
      // 5-point star
      const cx = x + w / 2;
      const cy = y + h / 2;
      const outerR = Math.min(w, h) / 2;
      const innerR = outerR * 0.44;
      const spikes = 5;
      let rot = (Math.PI / 2) * 3;
      const step = Math.PI / spikes;
      ctx.moveTo(cx, cy - outerR);
      for (let i = 0; i < spikes; i++) {
        let px = cx + Math.cos(rot) * outerR;
        let py = cy + Math.sin(rot) * outerR;
        ctx.lineTo(px, py);
        rot += step;
        px = cx + Math.cos(rot) * innerR;
        py = cy + Math.sin(rot) * innerR;
        ctx.lineTo(px, py);
        rot += step;
      }
      ctx.lineTo(cx, cy - outerR);
      ctx.closePath();
      break;
    }
    case "rectangle":
    default: {
      ctx.roundRect(x, y, w, h, Math.max(0, radius));
      break;
    }
  }
}

export interface LayoutMetadata {
  id: CustomLayoutType;
  label: string;
  slots: number;
  aspectRatio: "2:3" | "4:6" | "1:1";
  desc: string;
}

export const CUSTOM_LAYOUTS: LayoutMetadata[] = [
  { id: "4-cut-strip", label: "4-Cut Strip", slots: 4, aspectRatio: "2:3", desc: "Classic mall photobooth strip" },
  { id: "3-cut-strip", label: "3-Cut Strip", slots: 3, aspectRatio: "2:3", desc: "Vertical trio portrait strip" },
  { id: "2-cut-duo", label: "2-Cut Duo", slots: 2, aspectRatio: "4:6", desc: "Side-by-side couple portraits" },
  { id: "1-cut-polaroid", label: "1-Cut Polaroid", slots: 1, aspectRatio: "4:6", desc: "Retro Polaroid single pose" },
  { id: "2x2-quad", label: "2x2 Quad Grid", slots: 4, aspectRatio: "1:1", desc: "Square Instagram-ready collage" },
  { id: "heart-duo", label: "Heart Duo", slots: 2, aspectRatio: "4:6", desc: "Romantic couple heart styling" },
  { id: "vintage-film", label: "Vintage Film", slots: 3, aspectRatio: "2:3", desc: "Cinema strip with sprockets" },
  { id: "6-cut-matrix", label: "6-Cut Matrix", slots: 6, aspectRatio: "2:3", desc: "2x3 party memory matrix" },
];

export const CUSTOM_FRAME_STYLES: { id: CustomFrameStyle; label: string; desc: string }[] = [
  { id: "heart", label: "Heart Style", desc: "Romantic heart cutout accents & corner motifs" },
  { id: "film", label: "Vintage Film", desc: "Analog cinema sprockets & timestamps" },
  { id: "polaroid", label: "Polaroid", desc: "Authentic retro paper margin" },
  { id: "clean", label: "Minimalist Clean", desc: "Modern gallery-grade hairline framing" },
  { id: "scrapbook", label: "Scrapbook", desc: "Creative washi-tape & keepsake stamps" },
];

export const CUSTOM_COLOR_PALETTES = [
  { name: "Pure White", bg: "#ffffff", gradient: undefined },
  { name: "Soft Linen", bg: "#fbf8f5", gradient: "#f4ede4" },
  { name: "Blush Rose", bg: "#fff1f2", gradient: "#fce7f3" },
  { name: "Lavender Mist", bg: "#faf5ff", gradient: "#f3e8ff" },
  { name: "Matcha Latte", bg: "#f0fdf4", gradient: "#dcfce7" },
  { name: "Retro Sepia", bg: "#fffbeb", gradient: "#fef3c7" },
  { name: "Midnight Film", bg: "#18181b", gradient: "#09090b" },
  { name: "Sunset Glow", bg: "#fff7ed", gradient: "#fed7aa" },
  { name: "Cyber Neon", bg: "#0f172a", gradient: "#1e1b4b" },
];

/**
 * Builds a deterministic FrameConfig object from visual builder inputs.
 */
export function buildCustomFrameConfig(input: CustomFrameInput): {
  config: FrameConfig;
  slotCount: number;
  aspectRatio: "2:3" | "4:6" | "1:1";
} {
  const radius = Math.max(0, Math.min(32, input.borderRadius ?? 8));
  const isDarkBg = input.backgroundColor === "#18181b" || input.backgroundColor === "#0f172a" || input.backgroundColor === "#09090b";
  const textColor = isDarkBg ? "#ffffff" : "#18181b";
  const subtextColor = isDarkBg ? "#e2e8f0" : "#db4f70";

  let canvasWidth = 1200;
  let canvasHeight = 1800;
  let aspectRatio: "2:3" | "4:6" | "1:1" = "2:3";
  let slots: PhotoSlot[] = [];
  let slotCount = 4;

  const fontMap: Record<CustomFontFamily, string> = {
    serif: "Georgia, serif",
    sans: "system-ui, sans-serif",
    mono: "monospace",
    cursive: "cursive, serif",
  };
  const chosenFont = fontMap[input.fontFamily ?? "serif"];

  if (input.customSlots && input.customSlots.length > 0) {
    if (input.layout === "2-cut-duo" || input.layout === "heart-duo" || input.layout === "1-cut-polaroid") {
      canvasWidth = 1200;
      canvasHeight = 850;
      aspectRatio = "4:6";
    } else if (input.layout === "2x2-quad") {
      canvasWidth = 1200;
      canvasHeight = 1200;
      aspectRatio = "1:1";
    } else {
      canvasWidth = 600;
      canvasHeight = 1800;
      aspectRatio = "2:3";
    }
    slots = input.customSlots.map((s, idx) => ({
      ...s,
      slotIndex: idx,
      shape: s.shape ?? (input.frameStyle === "heart" ? "heart" : "rectangle"),
    }));
    slotCount = slots.length;
  } else {
    switch (input.layout) {
      case "1-cut-polaroid": {
        canvasWidth = 1000;
        canvasHeight = 1250;
        aspectRatio = "4:6";
        slotCount = 1;
        slots = [
          {
            id: "cs-1",
            slotIndex: 0,
            x: 8,
            y: 7,
            width: 84,
            height: 73,
            borderRadius: radius,
            shape: input.frameStyle === "heart" ? "heart" : "rectangle",
            assignedUser: "BOTH",
          },
        ];
        break;
      }

      case "2-cut-duo": {
        canvasWidth = 1200;
        canvasHeight = 850;
        aspectRatio = "4:6";
        slotCount = 2;
        slots = [
          {
            id: "cs-1",
            slotIndex: 0,
            x: 6,
            y: 8,
            width: 42,
            height: 74,
            borderRadius: radius,
            shape: input.frameStyle === "heart" ? "heart" : "rectangle",
            assignedUser: "HOST",
          },
          {
            id: "cs-2",
            slotIndex: 1,
            x: 52,
            y: 8,
            width: 42,
            height: 74,
            borderRadius: radius,
            shape: input.frameStyle === "heart" ? "heart" : "rectangle",
            assignedUser: "GUEST",
          },
        ];
        break;
      }

      case "heart-duo": {
        canvasWidth = 1200;
        canvasHeight = 900;
        aspectRatio = "4:6";
        slotCount = 2;
        slots = [
          {
            id: "cs-1",
            slotIndex: 0,
            x: 7,
            y: 9,
            width: 41,
            height: 70,
            borderRadius: radius > 0 ? radius : 14,
            shape: "heart",
            assignedUser: "HOST",
          },
          {
            id: "cs-2",
            slotIndex: 1,
            x: 52,
            y: 9,
            width: 41,
            height: 70,
            borderRadius: radius > 0 ? radius : 14,
            shape: "heart",
            assignedUser: "GUEST",
          },
        ];
        break;
      }

    case "3-cut-strip": {
      canvasWidth = 600;
      canvasHeight = 1500;
      aspectRatio = "2:3";
      slotCount = 3;
      slots = [
        { id: "cs-1", slotIndex: 0, x: 6, y: 4, width: 88, height: 27, borderRadius: radius, assignedUser: "HOST" },
        { id: "cs-2", slotIndex: 1, x: 6, y: 34, width: 88, height: 27, borderRadius: radius, assignedUser: "GUEST" },
        { id: "cs-3", slotIndex: 2, x: 6, y: 64, width: 88, height: 27, borderRadius: radius, assignedUser: "BOTH" },
      ];
      break;
    }

    case "vintage-film": {
      canvasWidth = 600;
      canvasHeight = 1600;
      aspectRatio = "2:3";
      slotCount = 3;
      slots = [
        { id: "cs-1", slotIndex: 0, x: 13, y: 4, width: 74, height: 27, borderRadius: radius, assignedUser: "HOST" },
        { id: "cs-2", slotIndex: 1, x: 13, y: 34, width: 74, height: 27, borderRadius: radius, assignedUser: "GUEST" },
        { id: "cs-3", slotIndex: 2, x: 13, y: 64, width: 74, height: 27, borderRadius: radius, assignedUser: "BOTH" },
      ];
      break;
    }

    case "2x2-quad": {
      canvasWidth = 1200;
      canvasHeight = 1200;
      aspectRatio = "1:1";
      slotCount = 4;
      slots = [
        { id: "cs-1", slotIndex: 0, x: 6, y: 6, width: 42, height: 40, borderRadius: radius, assignedUser: "HOST" },
        { id: "cs-2", slotIndex: 1, x: 52, y: 6, width: 42, height: 40, borderRadius: radius, assignedUser: "GUEST" },
        { id: "cs-3", slotIndex: 2, x: 6, y: 50, width: 42, height: 40, borderRadius: radius, assignedUser: "HOST" },
        { id: "cs-4", slotIndex: 3, x: 52, y: 50, width: 42, height: 40, borderRadius: radius, assignedUser: "GUEST" },
      ];
      break;
    }

    case "6-cut-matrix": {
      canvasWidth = 1000;
      canvasHeight = 1500;
      aspectRatio = "2:3";
      slotCount = 6;
      slots = [
        { id: "cs-1", slotIndex: 0, x: 6, y: 4, width: 42, height: 26, borderRadius: radius, assignedUser: "HOST" },
        { id: "cs-2", slotIndex: 1, x: 52, y: 4, width: 42, height: 26, borderRadius: radius, assignedUser: "GUEST" },
        { id: "cs-3", slotIndex: 2, x: 6, y: 33, width: 42, height: 26, borderRadius: radius, assignedUser: "HOST" },
        { id: "cs-4", slotIndex: 3, x: 52, y: 33, width: 42, height: 26, borderRadius: radius, assignedUser: "GUEST" },
        { id: "cs-5", slotIndex: 4, x: 6, y: 62, width: 42, height: 26, borderRadius: radius, assignedUser: "HOST" },
        { id: "cs-6", slotIndex: 5, x: 52, y: 62, width: 42, height: 26, borderRadius: radius, assignedUser: "GUEST" },
      ];
      break;
    }

    case "4-cut-strip":
    default: {
      canvasWidth = 600;
      canvasHeight = 1800;
      aspectRatio = "2:3";
      slotCount = 4;
      slots = [
        { id: "cs-1", slotIndex: 0, x: 5, y: 3, width: 90, height: 21, borderRadius: radius, assignedUser: "HOST" },
        { id: "cs-2", slotIndex: 1, x: 5, y: 26, width: 90, height: 21, borderRadius: radius, assignedUser: "GUEST" },
        { id: "cs-3", slotIndex: 2, x: 5, y: 49, width: 90, height: 21, borderRadius: radius, assignedUser: "HOST" },
        { id: "cs-4", slotIndex: 3, x: 5, y: 72, width: 90, height: 21, borderRadius: radius, assignedUser: "GUEST" },
      ];
      break;
    }
  }
  }

  const decorations: FrameDecoration[] = [];

  // Title Decoration
  const sanitizedTitle = (input.customText ?? "").trim().slice(0, 50);
  if (sanitizedTitle.length > 0) {
    let textY = 96;
    if (input.layout === "2-cut-duo" || input.layout === "heart-duo") textY = 88;
    else if (input.layout === "2x2-quad") textY = 95;
    else if (input.layout === "1-cut-polaroid") textY = 87;

    decorations.push({
      id: "cd-title",
      type: "text",
      content: sanitizedTitle,
      x: 50,
      y: textY,
      color: textColor,
      fontFamily: chosenFont,
    });
  }

  // Subtitle / Romantic Message Decoration
  const sanitizedSubtitle = (input.subtitle ?? "").trim().slice(0, 60);
  if (sanitizedSubtitle.length > 0) {
    let subY = 97.5;
    if (input.layout === "2-cut-duo" || input.layout === "heart-duo") subY = 93;
    else if (input.layout === "2x2-quad") subY = 98;
    else if (input.layout === "1-cut-polaroid") subY = 92;

    decorations.push({
      id: "cd-subtitle",
      type: "text",
      content: sanitizedSubtitle,
      x: 50,
      y: subY,
      color: subtextColor,
      fontFamily: chosenFont,
    });
  }

  // Date Stamp Decoration
  const sanitizedDate = (input.customDate ?? "").trim().slice(0, 30);
  if (sanitizedDate.length > 0) {
    let dateY = 98.5;
    if (input.layout === "2-cut-duo" || input.layout === "heart-duo") dateY = 96.5;
    else if (input.layout === "1-cut-polaroid") dateY = 96;

    decorations.push({
      id: "cd-date",
      type: "timestamp",
      content: sanitizedDate,
      x: 50,
      y: dateY,
      color: isDarkBg ? "#94a3b8" : "#948893",
      fontFamily: "monospace",
    });
  }

  // Decorative vector icon badge (zero emojis!)
  if (input.decorativeIcon && input.decorativeIcon !== "none") {
    decorations.push({
      id: "cd-icon",
      type: input.decorativeIcon === "heart" ? "heart" : "sticker",
      content: input.decorativeIcon,
      x: 50,
      y: input.layout === "heart-duo" ? 83 : 93.5,
      color: subtextColor,
    });
  }

  // Heart Style Motifs (Corner accents)
  if (input.frameStyle === "heart" || input.layout === "heart-duo") {
    decorations.push(
      { id: "heart-badge-1", type: "heart", content: "heart", x: 12, y: 92, color: subtextColor, scale: 0.9 },
      { id: "heart-badge-2", type: "heart", content: "heart", x: 88, y: 92, color: subtextColor, scale: 0.9 }
    );
  }

  const config: FrameConfig = {
    canvasWidth,
    canvasHeight,
    aspectRatio,
    backgroundColor: input.backgroundColor,
    backgroundGradient: input.backgroundGradient,
    slots,
    decorations,
    watermarkEnabled: true,
  };

  return { config, slotCount, aspectRatio };
}
