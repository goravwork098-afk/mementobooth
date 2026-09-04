export interface Entitlements {
  maxRoomsPerMonth: number;
  canUsePremiumFrames: boolean;
  canUseCustomFrameEditor: boolean;
  canExportHd: boolean;
  canExportVideo: boolean;
  canUploadToDrive: boolean;
  watermark: "none" | "standard";
}

export const FREE_TIER_ENTITLEMENTS: Entitlements = {
  maxRoomsPerMonth: 5,
  canUsePremiumFrames: false,
  canUseCustomFrameEditor: false,
  canExportHd: false,
  canExportVideo: false,
  canUploadToDrive: false,
  watermark: "standard",
};

export const PRO_TIER_ENTITLEMENTS: Entitlements = {
  maxRoomsPerMonth: 9999,
  canUsePremiumFrames: true,
  canUseCustomFrameEditor: true,
  canExportHd: true,
  canExportVideo: true,
  canUploadToDrive: true,
  watermark: "none",
};
