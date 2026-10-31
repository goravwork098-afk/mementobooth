import {
  FACE_STICKER_PRESETS,
  getFaceStickerById,
  getDefaultFaceBox,
  renderFaceSticker,
  type FaceBoundingBox,
} from "../face-stickers";

describe("face-stickers", () => {
  it("defines curated AR face sticker presets", () => {
    expect(FACE_STICKER_PRESETS.length).toBeGreaterThanOrEqual(5);
    const ids = new Set<string>();
    for (const p of FACE_STICKER_PRESETS) {
      expect(ids.has(p.id)).toBe(false);
      ids.add(p.id);
      expect(p.name.length).toBeGreaterThan(0);
      expect(p.description.length).toBeGreaterThan(0);
    }
  });

  it("returns fallback for unknown sticker ID", () => {
    const fallback = getFaceStickerById("non-existent-sticker");
    expect(fallback.id).toBe("none");
  });

  it("calculates proportional default portrait face box from video dimensions", () => {
    const box = getDefaultFaceBox(1000, 1000);
    expect(box.width).toBe(450); // 45%
    expect(box.height).toBe(450 * 1.25);
    expect(box.x).toBe((1000 - 450) / 2);
    expect(box.y).toBe(220); // 22% of 1000
  });

  it("renders vector stickers onto canvas context without throwing", () => {
    const mockCtx = {
      save: jest.fn(),
      restore: jest.fn(),
      beginPath: jest.fn(),
      closePath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      bezierCurveTo: jest.fn(),
      quadraticCurveTo: jest.fn(),
      ellipse: jest.fn(),
      arc: jest.fn(),
      fill: jest.fn(),
      stroke: jest.fn(),
      createRadialGradient: jest.fn().mockReturnValue({
        addColorStop: jest.fn(),
      }),
      globalAlpha: 1,
      fillStyle: "",
      strokeStyle: "",
      lineWidth: 1,
      shadowColor: "",
      shadowBlur: 0,
    } as unknown as CanvasRenderingContext2D;

    const box: FaceBoundingBox = { x: 100, y: 100, width: 200, height: 250 };

    for (const preset of FACE_STICKER_PRESETS) {
      expect(() => {
        renderFaceSticker(mockCtx, preset.id, box, 1000);
      }).not.toThrow();
    }
  });
});

