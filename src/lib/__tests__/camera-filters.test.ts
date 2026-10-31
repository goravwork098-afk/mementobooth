import { CAMERA_FILTERS, getFilterById } from "../camera-filters";

describe("camera-filters", () => {
  it("defines exactly 6 curated camera aesthetic presets", () => {
    expect(CAMERA_FILTERS).toHaveLength(6);
  });

  it("ensures each filter has unique ID and non-empty metadata", () => {
    const ids = new Set<string>();
    for (const filter of CAMERA_FILTERS) {
      expect(ids.has(filter.id)).toBe(false);
      ids.add(filter.id);
      expect(filter.name.trim().length).toBeGreaterThan(0);
      expect(filter.description.trim().length).toBeGreaterThan(0);
      expect(filter.css).toBeDefined();
      expect(filter.canvasFilter).toBeDefined();
    }
  });

  it("provides natural filter with 'none' CSS filter by default", () => {
    const natural = getFilterById("natural");
    expect(natural.id).toBe("natural");
    expect(natural.css).toBe("none");
    expect(natural.canvasFilter).toBe("none");
  });

  it("returns default natural filter for invalid or unknown IDs", () => {
    const fallback = getFilterById("non-existent-filter-id");
    expect(fallback.id).toBe("natural");
  });

  it("returns correct preset for each specific filter id", () => {
    expect(getFilterById("seoul-4cut").name).toBe("Seoul 4-Cut");
    expect(getFilterById("midnight-noir").name).toBe("Midnight Noir");
    expect(getFilterById("romantic-rose").name).toBe("Romantic Rose");
    expect(getFilterById("soft-beauty").name).toBe("Soft Beauty");
    expect(getFilterById("golden-sunset").name).toBe("Golden Sunset");
  });
});

