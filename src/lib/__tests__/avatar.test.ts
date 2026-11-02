import { getAvatarUrl, AVATAR_STYLES, PASTEL_BG_PALETTES } from "../avatar";

describe("Avatar Utility", () => {
  it("generates valid DiceBear SVG URLs with clean seeds", () => {
    const url = getAvatarUrl("Gorav");
    expect(url).toContain("https://api.dicebear.com/9.x/avataaars/svg");
    expect(url).toContain("seed=Gorav");
  });

  it("falls back gracefully when seed is empty or null", () => {
    const urlFromNull = getAvatarUrl(null);
    expect(urlFromNull).toContain("seed=memento-booth");

    const urlFromEmpty = getAvatarUrl("   ");
    expect(urlFromEmpty).toContain("seed=memento-booth");
  });

  it("supports custom styles and sizes", () => {
    const url = getAvatarUrl("Sarah", { style: "lorelei", size: 128 });
    expect(url).toContain("https://api.dicebear.com/9.x/lorelei/svg");
    expect(url).toContain("size=128");

    const botttsUrl = getAvatarUrl("Robot", { style: "bottts" });
    expect(botttsUrl).toContain("https://api.dicebear.com/9.x/bottts/svg");
  });

  it("exports supported avatar style configurations and pastel palettes", () => {
    expect(AVATAR_STYLES.length).toBeGreaterThanOrEqual(4);
    expect(AVATAR_STYLES.map((s) => s.id)).toContain("avataaars");
    expect(AVATAR_STYLES.map((s) => s.id)).toContain("lorelei");
    expect(AVATAR_STYLES.map((s) => s.id)).toContain("micah");
    expect(AVATAR_STYLES.map((s) => s.id)).toContain("bottts");

    expect(PASTEL_BG_PALETTES.length).toBeGreaterThanOrEqual(4);
  });
});
