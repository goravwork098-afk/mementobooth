export interface FaceStickerPreset {
  id: string;
  name: string;
  description: string;
}

export interface FaceBoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const FACE_STICKER_PRESETS: FaceStickerPreset[] = [
  {
    id: "none",
    name: "None",
    description: "No AR stickers",
  },
  {
    id: "floating-hearts",
    name: "Floating Hearts",
    description: "Fluttering pastel hearts above head",
  },
  {
    id: "rosy-blush",
    name: "Rosy Blush",
    description: "Soft romantic pink cheek blush and freckles",
  },
  {
    id: "heart-glasses",
    name: "Heart Glasses",
    description: "Translucent tinted Y2K heart sunglasses",
  },
  {
    id: "angel-halo",
    name: "Angel Halo",
    description: "Glowing celestial halo and stardust",
  },
  {
    id: "cat-ears",
    name: "Cat Ears",
    description: "Cute kitten ears and playful whiskers",
  },
];

export function getFaceStickerById(id: string): FaceStickerPreset {
  return (
    FACE_STICKER_PRESETS.find((preset) => preset.id === id) ??
    FACE_STICKER_PRESETS[0]
  );
}

/**
 * Returns calibrated default portrait face bounding box (relative to video dimensions)
 * used for universal fallback across all mobile and desktop browsers.
 */
export function getDefaultFaceBox(
  width: number,
  height: number
): FaceBoundingBox {
  // Typical portrait selfie positioning: centered, 45% of width, slightly above middle
  const boxW = width * 0.45;
  const boxH = boxW * 1.25;
  const boxX = (width - boxW) / 2;
  const boxY = height * 0.22;

  return { x: boxX, y: boxY, width: boxW, height: boxH };
}

/**
 * Helper to draw a procedural vector heart with bezier curves.
 */
export function drawVectorHeart(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  fillColor: string,
  alpha = 1.0
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = fillColor;
  ctx.beginPath();
  const topCurveHeight = size * 0.3;
  ctx.moveTo(cx, cy + topCurveHeight);
  // top left curve
  ctx.bezierCurveTo(
    cx,
    cy,
    cx - size / 2,
    cy,
    cx - size / 2,
    cy + topCurveHeight
  );
  // bottom left curve
  ctx.bezierCurveTo(
    cx - size / 2,
    cy + (size + topCurveHeight) / 2,
    cx,
    cy + (size + topCurveHeight) / 1.4,
    cx,
    cy + size
  );
  // bottom right curve
  ctx.bezierCurveTo(
    cx,
    cy + (size + topCurveHeight) / 1.4,
    cx + size / 2,
    cy + (size + topCurveHeight) / 2,
    cx + size / 2,
    cy + topCurveHeight
  );
  // top right curve
  ctx.bezierCurveTo(
    cx + size / 2,
    cy,
    cx,
    cy,
    cx,
    cy + topCurveHeight
  );
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/**
 * 1. Floating Hearts Effect (Animated hover above forehead)
 */
function drawFloatingHearts(
  ctx: CanvasRenderingContext2D,
  box: FaceBoundingBox,
  timeMs: number
) {
  const headCenterX = box.x + box.width / 2;
  const headTopY = box.y;
  const baseSize = box.width * 0.16;

  // 3 floating hearts at slightly different heights and swaying phases
  const hearts = [
    {
      x: headCenterX - box.width * 0.24,
      y: headTopY - baseSize * 0.8 + Math.sin(timeMs / 400) * 10,
      size: baseSize * 0.9,
      color: "#ff6b8b",
      alpha: 0.88,
    },
    {
      x: headCenterX + Math.sin(timeMs / 600) * 8,
      y: headTopY - baseSize * 1.5 + Math.cos(timeMs / 450) * 12,
      size: baseSize * 1.25,
      color: "#ff3366",
      alpha: 0.95,
    },
    {
      x: headCenterX + box.width * 0.26,
      y: headTopY - baseSize * 0.9 + Math.sin((timeMs + 300) / 400) * 10,
      size: baseSize * 0.85,
      color: "#ff8fa3",
      alpha: 0.85,
    },
  ];

  for (const h of hearts) {
    drawVectorHeart(ctx, h.x, h.y, h.size, h.color, h.alpha);
  }
}

/**
 * 2. Rosy Cheek Blush Effect
 */
function drawRosyBlush(ctx: CanvasRenderingContext2D, box: FaceBoundingBox) {
  const cheekRadius = box.width * 0.18;
  const cheekY = box.y + box.height * 0.58;
  const leftCheekX = box.x + box.width * 0.22;
  const rightCheekX = box.x + box.width * 0.78;

  ctx.save();
  for (const cx of [leftCheekX, rightCheekX]) {
    const grad = ctx.createRadialGradient(
      cx,
      cheekY,
      0,
      cx,
      cheekY,
      cheekRadius
    );
    grad.addColorStop(0, "rgba(255, 105, 135, 0.45)");
    grad.addColorStop(0.5, "rgba(255, 120, 150, 0.22)");
    grad.addColorStop(1, "rgba(255, 150, 180, 0)");

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cheekY, cheekRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  // Freckles (3 subtle soft dots per cheek)
  ctx.fillStyle = "rgba(180, 83, 9, 0.35)";
  const dotRadius = Math.max(1.5, box.width * 0.009);
  for (const cx of [leftCheekX, rightCheekX]) {
    for (const offset of [
      { dx: -dotRadius * 3, dy: -dotRadius * 2 },
      { dx: 0, dy: dotRadius },
      { dx: dotRadius * 3, dy: -dotRadius },
    ]) {
      ctx.beginPath();
      ctx.arc(cx + offset.dx, cheekY + offset.dy, dotRadius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

/**
 * 3. Heart Glasses Effect
 */
function drawHeartGlasses(ctx: CanvasRenderingContext2D, box: FaceBoundingBox) {
  const eyesY = box.y + box.height * 0.38;
  const lensWidth = box.width * 0.32;
  const leftEyeX = box.x + box.width * 0.27;
  const rightEyeX = box.x + box.width * 0.73;

  ctx.save();
  // Glass tint fill
  drawVectorHeart(ctx, leftEyeX, eyesY, lensWidth, "rgba(244, 63, 94, 0.45)");
  drawVectorHeart(ctx, rightEyeX, eyesY, lensWidth, "rgba(244, 63, 94, 0.45)");

  // Gold bridge connecting lenses
  ctx.strokeStyle = "#e11d48";
  ctx.lineWidth = Math.max(3, box.width * 0.02);
  ctx.beginPath();
  ctx.moveTo(leftEyeX + lensWidth * 0.3, eyesY + lensWidth * 0.4);
  ctx.quadraticCurveTo(
    box.x + box.width / 2,
    eyesY + lensWidth * 0.3,
    rightEyeX - lensWidth * 0.3,
    eyesY + lensWidth * 0.4
  );
  ctx.stroke();

  // Glass shine reflection
  ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
  ctx.beginPath();
  ctx.ellipse(
    leftEyeX - lensWidth * 0.2,
    eyesY + lensWidth * 0.35,
    lensWidth * 0.12,
    lensWidth * 0.05,
    -Math.PI / 4,
    0,
    Math.PI * 2
  );
  ctx.ellipse(
    rightEyeX - lensWidth * 0.2,
    eyesY + lensWidth * 0.35,
    lensWidth * 0.12,
    lensWidth * 0.05,
    -Math.PI / 4,
    0,
    Math.PI * 2
  );
  ctx.fill();

  ctx.restore();
}

/**
 * 4. Angel Halo Effect
 */
function drawAngelHalo(
  ctx: CanvasRenderingContext2D,
  box: FaceBoundingBox,
  timeMs: number
) {
  const haloCenterX = box.x + box.width / 2;
  const haloCenterY =
    box.y - box.height * 0.18 + Math.sin(timeMs / 450) * 8;
  const radiusX = box.width * 0.38;
  const radiusY = box.width * 0.12;

  ctx.save();
  // Glowing halo ring
  ctx.shadowColor = "#fde047";
  ctx.shadowBlur = 18;
  ctx.strokeStyle = "#facc15";
  ctx.lineWidth = Math.max(4, box.width * 0.035);
  ctx.beginPath();
  ctx.ellipse(
    haloCenterX,
    haloCenterY,
    radiusX,
    radiusY,
    -0.08,
    0,
    Math.PI * 2
  );
  ctx.stroke();

  // Forehead stardust sparkle
  ctx.fillStyle = "#ffffff";
  ctx.shadowBlur = 12;
  const sparkleSize = Math.max(3, box.width * 0.015);
  for (const s of [
    { dx: -radiusX * 0.6, dy: -radiusY * 0.5 },
    { dx: radiusX * 0.7, dy: radiusY * 0.4 },
  ]) {
    ctx.beginPath();
    ctx.arc(
      haloCenterX + s.dx,
      haloCenterY + s.dy,
      sparkleSize,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }
  ctx.restore();
}

/**
 * 5. Cat Ears & Whiskers Effect
 */
function drawCatEars(ctx: CanvasRenderingContext2D, box: FaceBoundingBox) {
  const headTopY = box.y;
  const earW = box.width * 0.28;
  const earH = box.height * 0.32;
  const leftEarX = box.x + box.width * 0.15;
  const rightEarX = box.x + box.width * 0.85;

  ctx.save();

  // Left Outer Ear
  ctx.fillStyle = "#f43f5e";
  ctx.beginPath();
  ctx.moveTo(leftEarX - earW / 2, headTopY + earH * 0.2);
  ctx.lineTo(leftEarX, headTopY - earH);
  ctx.lineTo(leftEarX + earW / 2, headTopY);
  ctx.closePath();
  ctx.fill();

  // Left Inner Ear
  ctx.fillStyle = "#ffe4e6";
  ctx.beginPath();
  ctx.moveTo(leftEarX - earW * 0.3, headTopY + earH * 0.1);
  ctx.lineTo(leftEarX, headTopY - earH * 0.75);
  ctx.lineTo(leftEarX + earW * 0.3, headTopY - earH * 0.05);
  ctx.closePath();
  ctx.fill();

  // Right Outer Ear
  ctx.fillStyle = "#f43f5e";
  ctx.beginPath();
  ctx.moveTo(rightEarX - earW / 2, headTopY);
  ctx.lineTo(rightEarX, headTopY - earH);
  ctx.lineTo(rightEarX + earW / 2, headTopY + earH * 0.2);
  ctx.closePath();
  ctx.fill();

  // Right Inner Ear
  ctx.fillStyle = "#ffe4e6";
  ctx.beginPath();
  ctx.moveTo(rightEarX - earW * 0.3, headTopY - earH * 0.05);
  ctx.lineTo(rightEarX, headTopY - earH * 0.75);
  ctx.lineTo(rightEarX + earW * 0.3, headTopY + earH * 0.1);
  ctx.closePath();
  ctx.fill();

  // Cute Nose & Whiskers
  const noseX = box.x + box.width / 2;
  const noseY = box.y + box.height * 0.62;
  const noseSize = box.width * 0.06;

  // Pink cute nose
  drawVectorHeart(ctx, noseX, noseY, noseSize, "#fb7185");

  // Whiskers
  ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
  ctx.lineWidth = Math.max(2, box.width * 0.012);
  const whiskerLen = box.width * 0.25;

  // Left Whiskers
  ctx.beginPath();
  ctx.moveTo(noseX - box.width * 0.12, noseY + noseSize * 0.4);
  ctx.lineTo(noseX - box.width * 0.12 - whiskerLen, noseY);
  ctx.moveTo(noseX - box.width * 0.12, noseY + noseSize * 0.8);
  ctx.lineTo(noseX - box.width * 0.12 - whiskerLen, noseY + noseSize * 1.2);
  ctx.stroke();

  // Right Whiskers
  ctx.beginPath();
  ctx.moveTo(noseX + box.width * 0.12, noseY + noseSize * 0.4);
  ctx.lineTo(noseX + box.width * 0.12 + whiskerLen, noseY);
  ctx.moveTo(noseX + box.width * 0.12, noseY + noseSize * 0.8);
  ctx.lineTo(noseX + box.width * 0.12 + whiskerLen, noseY + noseSize * 1.2);
  ctx.stroke();

  ctx.restore();
}

/**
 * Main dispatcher: renders the active sticker preset onto any 2D canvas context.
 */
export function renderFaceSticker(
  ctx: CanvasRenderingContext2D,
  presetId: string,
  faceBox: FaceBoundingBox,
  timeMs = 0
) {
  switch (presetId) {
    case "floating-hearts":
      drawFloatingHearts(ctx, faceBox, timeMs);
      break;
    case "rosy-blush":
      drawRosyBlush(ctx, faceBox);
      break;
    case "heart-glasses":
      drawHeartGlasses(ctx, faceBox);
      break;
    case "angel-halo":
      drawAngelHalo(ctx, faceBox, timeMs);
      break;
    case "cat-ears":
      drawCatEars(ctx, faceBox);
      break;
    case "none":
    default:
      break;
  }
}

