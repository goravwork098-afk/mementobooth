import type { FrameConfig, PhotoSlot, FrameDecoration } from "@/types/frame";

export type CustomLayoutType = "2-cut-duo" | "3-cut-strip" | "4-cut-strip" | "1-cut-polaroid";

export interface CustomFrameInput {
  name: string;
  layout: CustomLayoutType;
  backgroundColor: string;
  backgroundGradient?: string;
  customText?: string;
  customDate?: string;
  borderRadius?: number;
  isPublic?: boolean;
}

export const CUSTOM_COLOR_PALETTES = [
  { name: "Pure White", bg: "#ffffff", gradient: undefined },
  { name: "Soft Linen", bg: "#fbf8f5", gradient: "#f4ede4" },
  { name: "Blush Rose", bg: "#fff1f2", gradient: "#fce7f3" },
  { name: "Lavender Mist", bg: "#faf5ff", gradient: "#f3e8ff" },
  { name: "Matcha Latte", bg: "#f0fdf4", gradient: "#dcfce7" },
  { name: "Retro Sepia", bg: "#fffbeb", gradient: "#fef3c7" },
  { name: "Midnight Film", bg: "#18181b", gradient: "#09090b" },
];

/**
 * Builds a deterministic FrameConfig object from visual builder inputs.
 */
export function buildCustomFrameConfig(input: CustomFrameInput): {
  config: FrameConfig;
  slotCount: number;
  aspectRatio: "2:3" | "4:6" | "1:1";
} {
  const radius = Math.max(0, Math.min(24, input.borderRadius ?? 6));
  const textColor = input.backgroundColor === "#18181b" ? "#ffffff" : "#18181b";
  const subtextColor = input.backgroundColor === "#18181b" ? "#e4e4e7" : "#e11d48";

  let canvasWidth = 1200;
  let canvasHeight = 1800;
  let aspectRatio: "2:3" | "4:6" | "1:1" = "2:3";
  let slots: PhotoSlot[] = [];
  let slotCount = 2;

  switch (input.layout) {
    case "1-cut-polaroid": {
      canvasWidth = 1000;
      canvasHeight = 1200;
      aspectRatio = "4:6";
      slotCount = 1;
      slots = [
        {
          id: "cs-1",
          slotIndex: 0,
          x: 8,
          y: 8,
          width: 84,
          height: 72,
          borderRadius: radius,
          assignedUser: "BOTH",
        },
      ];
      break;
    }

    case "2-cut-duo": {
      canvasWidth = 1200;
      canvasHeight = 800;
      aspectRatio = "4:6";
      slotCount = 2;
      slots = [
        {
          id: "cs-1",
          slotIndex: 0,
          x: 6,
          y: 8,
          width: 42,
          height: 75,
          borderRadius: radius,
          assignedUser: "HOST",
        },
        {
          id: "cs-2",
          slotIndex: 1,
          x: 52,
          y: 8,
          width: 42,
          height: 75,
          borderRadius: radius,
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
        {
          id: "cs-1",
          slotIndex: 0,
          x: 6,
          y: 4,
          width: 88,
          height: 27,
          borderRadius: radius,
          assignedUser: "HOST",
        },
        {
          id: "cs-2",
          slotIndex: 1,
          x: 6,
          y: 34,
          width: 88,
          height: 27,
          borderRadius: radius,
          assignedUser: "GUEST",
        },
        {
          id: "cs-3",
          slotIndex: 2,
          x: 6,
          y: 64,
          width: 88,
          height: 27,
          borderRadius: radius,
          assignedUser: "BOTH",
        },
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
        {
          id: "cs-1",
          slotIndex: 0,
          x: 5,
          y: 3,
          width: 90,
          height: 21,
          borderRadius: radius,
          assignedUser: "HOST",
        },
        {
          id: "cs-2",
          slotIndex: 1,
          x: 5,
          y: 26,
          width: 90,
          height: 21,
          borderRadius: radius,
          assignedUser: "GUEST",
        },
        {
          id: "cs-3",
          slotIndex: 2,
          x: 5,
          y: 49,
          width: 90,
          height: 21,
          borderRadius: radius,
          assignedUser: "HOST",
        },
        {
          id: "cs-4",
          slotIndex: 3,
          x: 5,
          y: 72,
          width: 90,
          height: 21,
          borderRadius: radius,
          assignedUser: "GUEST",
        },
      ];
      break;
    }
  }

  const decorations: FrameDecoration[] = [];

  const sanitizedTitle = (input.customText ?? "").trim().slice(0, 50);
  if (sanitizedTitle.length > 0) {
    const textY = input.layout === "2-cut-duo" ? 90 : 96;
    decorations.push({
      id: "cd-title",
      type: "text",
      content: sanitizedTitle,
      x: 50,
      y: textY,
      color: textColor,
      fontFamily: "Georgia, serif",
    });
  }

  const sanitizedDate = (input.customDate ?? "").trim().slice(0, 30);
  if (sanitizedDate.length > 0) {
    const dateY = input.layout === "2-cut-duo" ? 95 : 98;
    decorations.push({
      id: "cd-date",
      type: "text",
      content: sanitizedDate,
      x: 50,
      y: dateY,
      color: subtextColor,
      fontFamily: "sans-serif",
    });
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

