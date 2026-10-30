import { DEFAULT_ROMANTIC_FRAMES } from "../frame";

describe("Frame Catalog & Canvas Layout Schema Invariants", () => {
  it("contains all three official romantic presets", () => {
    const slugs = DEFAULT_ROMANTIC_FRAMES.map((f) => f.slug);
    expect(slugs).toContain("classic-4cut");
    expect(slugs).toContain("polaroid-duo");
    expect(slugs).toContain("vintage-noir");
  });

  it("enforces valid canvas aspect ratios and dimensions", () => {
    for (const frame of DEFAULT_ROMANTIC_FRAMES) {
      expect(frame.config.canvasWidth).toBeGreaterThan(0);
      expect(frame.config.canvasHeight).toBeGreaterThan(0);
      expect(["2:3", "4:6", "1:1", "16:9"]).toContain(frame.config.aspectRatio);
    }
  });

  it("ensures all photo slots stay within 0-100% canvas bounds", () => {
    for (const frame of DEFAULT_ROMANTIC_FRAMES) {
      expect(frame.config.slots.length).toBe(frame.slotCount);

      for (const slot of frame.config.slots) {
        // x + width <= 100%
        expect(slot.x).toBeGreaterThanOrEqual(0);
        expect(slot.width).toBeGreaterThan(0);
        expect(slot.x + slot.width).toBeLessThanOrEqual(100);

        // y + height <= 100%
        expect(slot.y).toBeGreaterThanOrEqual(0);
        expect(slot.height).toBeGreaterThan(0);
        expect(slot.y + slot.height).toBeLessThanOrEqual(100);
      }
    }
  });

  it("guarantees slot indices are sequential and non-negative", () => {
    for (const frame of DEFAULT_ROMANTIC_FRAMES) {
      const indices = frame.config.slots.map((s) => s.slotIndex);
      const expected = Array.from({ length: frame.slotCount }, (_, i) => i);
      expect(indices).toEqual(expected);
    }
  });
});

