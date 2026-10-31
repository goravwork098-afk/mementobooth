import {
  buildCustomFrameConfig,
  CUSTOM_COLOR_PALETTES,
} from "../custom-frame";

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

  it("includes valid curated color palettes", () => {
    expect(CUSTOM_COLOR_PALETTES.length).toBeGreaterThanOrEqual(5);
    for (const palette of CUSTOM_COLOR_PALETTES) {
      expect(palette.name).toBeDefined();
      expect(palette.bg.startsWith("#")).toBe(true);
    }
  });

  it("accepts community isPublic toggle flag", () => {
    const input = {
      name: "Public Community Frame",
      layout: "4-cut-strip" as const,
      backgroundColor: "#ffffff",
      isPublic: true,
    };
    const result = buildCustomFrameConfig(input);
    expect(result.slotCount).toBe(4);
    expect(input.isPublic).toBe(true);
  });
});

