import {
  buildCustomFrameConfig,
  CUSTOM_COLOR_PALETTES,
  CUSTOM_LAYOUTS,
  CUSTOM_FRAME_STYLES,
  STARTER_PRESETS,
  SLOT_SHAPES,
  traceSlotPath,
} from "../custom-frame";
import { generateAiFrameTheme } from "../ai-frame-theme";

describe("custom-frame", () => {
  it("builds 4-cut vertical strip layout with correct slot count and aspect ratio", () => {
    const result = buildCustomFrameConfig({
      name: "Our Seoul Trip",
      layout: "4-cut-strip",
      backgroundColor: "#ffffff",
      customText: "Seoul With You",
    });

    expect(result.slotCount).toBe(4);
    expect(result.aspectRatio).toBe("2:3");
    expect(result.config.slots).toHaveLength(4);
    expect(result.config.decorations.some((d) => d.content === "Seoul With You")).toBe(true);
  });

  it("builds 2-cut duo polaroid layout with 2 slots", () => {
    const result = buildCustomFrameConfig({
      name: "Sweethearts",
      layout: "2-cut-duo",
      backgroundColor: "#fff1f2",
      borderRadius: 12,
    });

    expect(result.slotCount).toBe(2);
    expect(result.aspectRatio).toBe("4:6");
    expect(result.config.slots).toHaveLength(2);
    expect(result.config.slots[0].borderRadius).toBe(12);
  });

  it("builds 1-cut polaroid layout with 1 slot", () => {
    const result = buildCustomFrameConfig({
      name: "Solo Memory",
      layout: "1-cut-polaroid",
      backgroundColor: "#faf5ff",
    });

    expect(result.slotCount).toBe(1);
    expect(result.config.slots).toHaveLength(1);
  });

  it("builds heart-duo layout with 2 slots and heart decorations", () => {
    const result = buildCustomFrameConfig({
      name: "Heart Romantic Duo",
      layout: "heart-duo",
      frameStyle: "heart",
      backgroundColor: "#fff1f2",
      customText: "Forever In Love",
    });

    expect(result.slotCount).toBe(2);
    expect(result.config.slots).toHaveLength(2);
    expect(result.config.decorations.some((d) => d.type === "heart")).toBe(true);
  });

  it("builds 2x2-quad grid layout with 4 slots and 1:1 aspect ratio", () => {
    const result = buildCustomFrameConfig({
      name: "Instagram Grid",
      layout: "2x2-quad",
      backgroundColor: "#0f172a",
    });

    expect(result.slotCount).toBe(4);
    expect(result.aspectRatio).toBe("1:1");
    expect(result.config.slots).toHaveLength(4);
  });

  it("builds vintage-film layout with 3 slots and 2:3 aspect ratio", () => {
    const result = buildCustomFrameConfig({
      name: "Vintage Film 35mm",
      layout: "vintage-film",
      frameStyle: "film",
      backgroundColor: "#18181b",
    });

    expect(result.slotCount).toBe(3);
    expect(result.aspectRatio).toBe("2:3");
    expect(result.config.slots).toHaveLength(3);
  });

  it("builds 6-cut-matrix layout with 6 slots", () => {
    const result = buildCustomFrameConfig({
      name: "Party Matrix",
      layout: "6-cut-matrix",
      backgroundColor: "#ffffff",
    });

    expect(result.slotCount).toBe(6);
    expect(result.config.slots).toHaveLength(6);
  });

  it("sanitizes text lengths to prevent layout breaking", () => {
    const longText = "A".repeat(120);
    const result = buildCustomFrameConfig({
      name: "Long Title",
      layout: "3-cut-strip",
      backgroundColor: "#ffffff",
      customText: longText,
    });

    const deco = result.config.decorations.find((d) => d.id === "cd-title");
    expect(deco?.content?.length).toBeLessThanOrEqual(50);
  });

  it("includes valid curated color palettes, layouts, and frame styles", () => {
    expect(CUSTOM_COLOR_PALETTES.length).toBeGreaterThanOrEqual(5);
    expect(CUSTOM_LAYOUTS.length).toBe(8);
    expect(CUSTOM_FRAME_STYLES.length).toBe(5);
  });

  it("generates contextual AI frame themes gracefully without external key", async () => {
    const theme = await generateAiFrameTheme("Parisian romance with red roses and heart cutouts");
    expect(theme.name).toBeDefined();
    expect(theme.layout).toBe("heart-duo");
    expect(theme.frameStyle).toBe("heart");
    expect(theme.decorativeIcon).toBe("heart");
    expect(theme.backgroundColor.startsWith("#")).toBe(true);

    const cyberTheme = await generateAiFrameTheme("Cyberpunk neon night in Tokyo");
    expect(cyberTheme.layout).toBe("2x2-quad");
    expect(cyberTheme.decorativeIcon).toBe("sparkles");
  });

  it("provides starter presets including Blank Canvas, Romantic Heart, Parisian Arch, and Classic Normal", () => {
    expect(STARTER_PRESETS).toHaveLength(4);
    const presetIds = STARTER_PRESETS.map((p) => p.id);
    expect(presetIds).toContain("blank-canvas");
    expect(presetIds).toContain("classic-strip");
    expect(presetIds).toContain("romantic-heart");
    expect(presetIds).toContain("parisian-arch");

    const blankPreset = STARTER_PRESETS.find((p) => p.id === "blank-canvas");
    expect(blankPreset).toBeDefined();
    expect(blankPreset?.label).toContain("Blank Canvas");

    const heartPreset = STARTER_PRESETS.find((p) => p.id === "romantic-heart");
    expect(heartPreset?.shape).toBe("heart");
    expect(heartPreset?.slots.every((s) => s.shape === "heart")).toBe(true);

    const archPreset = STARTER_PRESETS.find((p) => p.id === "parisian-arch");
    expect(archPreset?.shape).toBe("arch");
    expect(archPreset?.slots.every((s) => s.shape === "arch")).toBe(true);
  });

  it("assigns heart shape to photo slots in heart-duo layout", () => {
    const result = buildCustomFrameConfig({
      name: "Heart Duo Test",
      layout: "heart-duo",
      frameStyle: "heart",
      backgroundColor: "#fff1f2",
    });

    expect(result.config.slots.every((s) => s.shape === "heart")).toBe(true);
  });

  it("preserves custom user-defined drag-and-drop slots and per-slot shapes", () => {
    const customSlots = [
      { id: "custom-1", slotIndex: 0, x: 15, y: 12, width: 35, height: 45, shape: "heart" as const },
      { id: "custom-2", slotIndex: 1, x: 55, y: 20, width: 38, height: 50, shape: "arch" as const },
      { id: "custom-3", slotIndex: 2, x: 25, y: 65, width: 50, height: 30, shape: "circle" as const },
    ];

    const result = buildCustomFrameConfig({
      name: "Freeform Collage",
      layout: "heart-duo",
      backgroundColor: "#ffffff",
      customSlots,
    });

    expect(result.slotCount).toBe(3);
    expect(result.config.slots).toHaveLength(3);
    expect(result.config.slots[0].x).toBe(15);
    expect(result.config.slots[0].shape).toBe("heart");
    expect(result.config.slots[1].shape).toBe("arch");
    expect(result.config.slots[2].shape).toBe("circle");
  });

  it("traces valid clipping paths for all supported slot shapes without errors", () => {
    const mockContext = {
      beginPath: jest.fn(),
      moveTo: jest.fn(),
      bezierCurveTo: jest.fn(),
      arc: jest.fn(),
      ellipse: jest.fn(),
      lineTo: jest.fn(),
      closePath: jest.fn(),
      roundRect: jest.fn(),
    } as unknown as CanvasRenderingContext2D;

    for (const shape of SLOT_SHAPES) {
      expect(() => {
        traceSlotPath(mockContext, shape.id, 10, 10, 100, 100, 8);
      }).not.toThrow();
    }
  });
});
