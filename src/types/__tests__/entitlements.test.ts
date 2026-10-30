import { FREE_TIER_ENTITLEMENTS, PRO_TIER_ENTITLEMENTS } from "../entitlements";

describe("Entitlements & Plan Tier Invariants", () => {
  it("enforces free-tier limits", () => {
    expect(FREE_TIER_ENTITLEMENTS.maxRoomsPerMonth).toBe(5);
    expect(FREE_TIER_ENTITLEMENTS.canUsePremiumFrames).toBe(false);
    expect(FREE_TIER_ENTITLEMENTS.canUseCustomFrameEditor).toBe(false);
    expect(FREE_TIER_ENTITLEMENTS.canExportHd).toBe(false);
    expect(FREE_TIER_ENTITLEMENTS.canExportVideo).toBe(false);
    expect(FREE_TIER_ENTITLEMENTS.watermark).toBe("standard");
  });

  it("enforces pro-tier features and unlimited rooms", () => {
    expect(PRO_TIER_ENTITLEMENTS.maxRoomsPerMonth).toBeGreaterThanOrEqual(1000);
    expect(PRO_TIER_ENTITLEMENTS.canUsePremiumFrames).toBe(true);
    expect(PRO_TIER_ENTITLEMENTS.canUseCustomFrameEditor).toBe(true);
    expect(PRO_TIER_ENTITLEMENTS.canExportHd).toBe(true);
    expect(PRO_TIER_ENTITLEMENTS.watermark).toBe("none");
  });
});

