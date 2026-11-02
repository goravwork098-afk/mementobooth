/**
 * Avatar Generator Utility
 * Produces deterministic, vector-illustrated avatar URLs via DiceBear's free public SVG API.
 */

export type AvatarStyleType = "avataaars" | "lorelei" | "micah" | "bottts";

export interface AvatarStyleOption {
  id: AvatarStyleType;
  label: string;
  description: string;
}

export const AVATAR_STYLES: AvatarStyleOption[] = [
  { id: "avataaars", label: "Illustrated", description: "Cute expressive characters with hair & glasses" },
  { id: "lorelei", label: "Artistic", description: "Hand-drawn delicate romantic portraits" },
  { id: "micah", label: "Minimal", description: "Clean modern geometric aesthetic" },
  { id: "bottts", label: "Playful", description: "Charming retro robot companions" },
];

export const PASTEL_BG_PALETTES = [
  { id: "blush", label: "Blush", hex: "ffe8ec" },
  { id: "lavender", label: "Lavender", hex: "f1eeff" },
  { id: "cream", label: "Cream", hex: "fff4df" },
  { id: "mint", label: "Mint", hex: "eefbf4" },
  { id: "peach", label: "Peach", hex: "fff0eb" },
] as const;

export interface AvatarOptions {
  style?: AvatarStyleType;
  backgroundColor?: string[];
  size?: number;
}

const DEFAULT_BACKGROUND_COLORS = ["f1eeff", "fff4df", "ffe8ec", "e8e2ff", "fdf2f4"];

/**
 * Returns a high-resolution, deterministic SVG avatar URL for a given seed (e.g. user name or email).
 */
export function getAvatarUrl(
  seed?: string | null,
  options?: AvatarOptions
): string {
  const cleanSeed = (seed && seed.trim().length > 0) ? seed.trim() : "memento-booth";
  const style = options?.style ?? "avataaars";
  const bgColors = (options?.backgroundColor ?? DEFAULT_BACKGROUND_COLORS).join(",");

  const params = new URLSearchParams({
    seed: cleanSeed,
    backgroundColor: bgColors,
  });

  if (options?.size) {
    params.set("size", String(options.size));
  }

  return `https://api.dicebear.com/9.x/${style}/svg?${params.toString()}`;
}
