export interface CameraFilterPreset {
  id: string;
  name: string;
  description: string;
  css: string;
  canvasFilter: string;
}

export const CAMERA_FILTERS: CameraFilterPreset[] = [
  {
    id: "natural",
    name: "Natural",
    description: "Raw balanced camera feed without color grading",
    css: "none",
    canvasFilter: "none",
  },
  {
    id: "soft-beauty",
    name: "Soft Beauty",
    description: "Soft contrast with skin tone radiance and warm highlights",
    css: "contrast(1.06) brightness(1.08) saturate(1.10)",
    canvasFilter: "contrast(1.06) brightness(1.08) saturate(1.10)",
  },
  {
    id: "seoul-4cut",
    name: "Seoul 4-Cut",
    description: "Classic Korean photobooth paper warmth with rich contrast",
    css: "sepia(0.20) contrast(1.16) brightness(0.97) saturate(1.12)",
    canvasFilter: "sepia(0.20) contrast(1.16) brightness(0.97) saturate(1.12)",
  },
  {
    id: "romantic-rose",
    name: "Romantic Rose",
    description: "Delicate blush tint for warm romantic nostalgia",
    css: "hue-rotate(-10deg) saturate(1.22) brightness(1.04)",
    canvasFilter: "hue-rotate(-10deg) saturate(1.22) brightness(1.04)",
  },
  {
    id: "midnight-noir",
    name: "Midnight Noir",
    description: "High-contrast monochrome film strip look",
    css: "grayscale(1.0) contrast(1.28) brightness(1.05)",
    canvasFilter: "grayscale(1.0) contrast(1.28) brightness(1.05)",
  },
  {
    id: "golden-sunset",
    name: "Golden Sunset",
    description: "Sun-drenched golden hour warmth and vibrant glow",
    css: "sepia(0.15) brightness(1.06) saturate(1.25) contrast(1.08)",
    canvasFilter: "sepia(0.15) brightness(1.06) saturate(1.25) contrast(1.08)",
  },
];

export function getFilterById(id: string): CameraFilterPreset {
  const match = CAMERA_FILTERS.find((f) => f.id === id);
  return match ?? CAMERA_FILTERS[0];
}

