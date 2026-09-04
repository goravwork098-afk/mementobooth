export type FrameCategory = "CLASSIC" | "ROMANTIC" | "VINTAGE" | "SEASONAL" | "CUSTOM";

export interface PhotoSlot {
  id: string;
  slotIndex: number;
  x: number;          // normalized percentage 0 to 100
  y: number;          // normalized percentage 0 to 100
  width: number;      // normalized percentage
  height: number;     // normalized percentage
  rotation?: number;  // degrees
  borderRadius?: number; // px or %
  assignedUser?: "HOST" | "GUEST" | "BOTH"; // which partner takes this slot
}

export interface FrameDecoration {
  id: string;
  type: "text" | "sticker" | "border" | "timestamp" | "heart";
  content?: string;
  x: number;
  y: number;
  scale?: number;
  rotation?: number;
  color?: string;
  fontFamily?: string;
}

export interface FrameConfig {
  canvasWidth: number;
  canvasHeight: number;
  aspectRatio: "2:3" | "4:6" | "1:1" | "16:9";
  backgroundColor: string;
  backgroundGradient?: string;
  backgroundImageUrl?: string;
  slots: PhotoSlot[];
  decorations: FrameDecoration[];
  watermarkEnabled?: boolean;
}

export interface FrameTemplate {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: FrameCategory;
  isPremium: boolean;
  previewGradient: string;
  slotCount: number;
  config: FrameConfig;
}

export const DEFAULT_ROMANTIC_FRAMES: FrameTemplate[] = [
  {
    id: "frame-classic-4cut",
    slug: "classic-4cut",
    name: "Korean Mall 4-Cut",
    description: "The iconic vertical 4-cut mall photobooth strip with date stamp and film perforations.",
    category: "CLASSIC",
    isPremium: false,
    previewGradient: "from-rose-100 via-pink-50 to-rose-200",
    slotCount: 4,
    config: {
      canvasWidth: 600,
      canvasHeight: 1800,
      aspectRatio: "2:3",
      backgroundColor: "#ffffff",
      slots: [
        { id: "s1", slotIndex: 0, x: 5, y: 3, width: 90, height: 21, borderRadius: 4, assignedUser: "HOST" },
        { id: "s2", slotIndex: 1, x: 5, y: 26, width: 90, height: 21, borderRadius: 4, assignedUser: "GUEST" },
        { id: "s3", slotIndex: 2, x: 5, y: 49, width: 90, height: 21, borderRadius: 4, assignedUser: "HOST" },
        { id: "s4", slotIndex: 3, x: 5, y: 72, width: 90, height: 21, borderRadius: 4, assignedUser: "GUEST" },
      ],
      decorations: [
        { id: "d1", type: "text", content: "COUPLE PHOTOBOOTH", x: 50, y: 96, color: "#18181b", fontFamily: "sans-serif" },
        { id: "d2", type: "heart", content: "❤️", x: 50, y: 98, scale: 1 },
      ],
    },
  },
  {
    id: "frame-polaroid-duo",
    slug: "polaroid-duo",
    name: "Sweetheart Duo Polaroid",
    description: "Side-by-side couple polaroids on soft blush paper with handwritten romantic vibes.",
    category: "ROMANTIC",
    isPremium: false,
    previewGradient: "from-pink-100 to-rose-100",
    slotCount: 2,
    config: {
      canvasWidth: 1200,
      canvasHeight: 800,
      aspectRatio: "4:6",
      backgroundColor: "#fff5f5",
      slots: [
        { id: "s1", slotIndex: 0, x: 6, y: 8, width: 42, height: 75, borderRadius: 8, assignedUser: "HOST" },
        { id: "s2", slotIndex: 1, x: 52, y: 8, width: 42, height: 75, borderRadius: 8, assignedUser: "GUEST" },
      ],
      decorations: [
        { id: "d1", type: "text", content: "You & Me Together ✨", x: 50, y: 92, color: "#e11d48", fontFamily: "cursive" },
      ],
    },
  },
  {
    id: "frame-vintage-noir",
    slug: "vintage-noir",
    name: "Midnight Vintage Film",
    description: "A warm, moody dark frame with retro golden accents and film grain aesthetic.",
    category: "VINTAGE",
    isPremium: false,
    previewGradient: "from-zinc-900 via-rose-950 to-neutral-900",
    slotCount: 4,
    config: {
      canvasWidth: 600,
      canvasHeight: 1800,
      aspectRatio: "2:3",
      backgroundColor: "#18181b",
      slots: [
        { id: "s1", slotIndex: 0, x: 6, y: 4, width: 88, height: 20.5, borderRadius: 2 },
        { id: "s2", slotIndex: 1, x: 6, y: 27, width: 88, height: 20.5, borderRadius: 2 },
        { id: "s3", slotIndex: 2, x: 6, y: 50, width: 88, height: 20.5, borderRadius: 2 },
        { id: "s4", slotIndex: 3, x: 6, y: 73, width: 88, height: 20.5, borderRadius: 2 },
      ],
      decorations: [
        { id: "d1", type: "text", content: "35MM ROMANCE", x: 50, y: 96, color: "#fbbf24" },
      ],
    },
  },
];
