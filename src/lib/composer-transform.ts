import type { FrameSlot } from "@/types/frame";

export interface SlotCropTransform {
  zoom: number; // 1.0 to 3.0
  panX: number; // offset in slot coordinate pixels
  panY: number; // offset in slot coordinate pixels
}

export interface DrawDimensions {
  drawX: number;
  drawY: number;
  drawW: number;
  drawH: number;
  maxPanX: number;
  maxPanY: number;
}

/**
 * Calculates cover-fit dimensions with zoom and clamped pan offsets.
 * Guarantees the image completely covers the slot without empty gaps.
 */
export function calculateDrawDimensions(
  slotX: number,
  slotY: number,
  slotW: number,
  slotH: number,
  imgW: number,
  imgH: number,
  transform?: SlotCropTransform
): DrawDimensions {
  const zoom = Math.max(1.0, Math.min(3.0, transform?.zoom ?? 1.0));
  const baseScale = Math.max(slotW / imgW, slotH / imgH);
  const finalScale = baseScale * zoom;

  const drawW = imgW * finalScale;
  const drawH = imgH * finalScale;

  // Maximum allowable pan offset from center before exposing slot edges
  const maxPanX = Math.max(0, (drawW - slotW) / 2);
  const maxPanY = Math.max(0, (drawH - slotH) / 2);

  // Clamp user pan offsets
  const rawPanX = transform?.panX ?? 0;
  const rawPanY = transform?.panY ?? 0;
  const clampedPanX = Math.max(-maxPanX, Math.min(maxPanX, rawPanX));
  const clampedPanY = Math.max(-maxPanY, Math.min(maxPanY, rawPanY));

  // Centered position + clamped pan
  const drawX = slotX + (slotW - drawW) / 2 + clampedPanX;
  const drawY = slotY + (slotH - drawH) / 2 + clampedPanY;

  return {
    drawX,
    drawY,
    drawW,
    drawH,
    maxPanX,
    maxPanY,
  };
}

/**
 * Hit-tests canvas coordinates to identify which slot was clicked/touched.
 * Coordinates are normalized to canvas pixel space.
 */
export function hitTestSlot(
  canvasX: number,
  canvasY: number,
  canvasW: number,
  canvasH: number,
  slots: FrameSlot[]
): FrameSlot | null {
  for (const slot of slots) {
    const sx = (slot.x / 100) * canvasW;
    const sy = (slot.y / 100) * canvasH;
    const sw = (slot.width / 100) * canvasW;
    const sh = (slot.height / 100) * canvasH;

    if (
      canvasX >= sx &&
      canvasX <= sx + sw &&
      canvasY >= sy &&
      canvasY <= sy + sh
    ) {
      return slot;
    }
  }
  return null;
}

/**
 * Standard 300 DPI print scale factor multiplier.
 * A 1200x1800 4x6" canvas at 2x becomes 2400x3600 (300 DPI print fidelity).
 */
export const PRINT_DPI_SCALE = 2;

