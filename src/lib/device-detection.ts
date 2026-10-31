/**
 * Server-side Device & Hardware Model Detection.
 * Parses HTTP User-Agent and modern Client Hints (Sec-CH-UA-*)
 * without external library overhead or client bundle bloat.
 */

export interface DeviceInfo {
  deviceType: "MOBILE" | "TABLET" | "DESKTOP";
  deviceModel: string;
  os: string;
  browser: string;
}

export interface HeaderProvider {
  get(name: string): string | null;
}

/**
 * Extracts and sanitizes hardware device, operating system, and browser information.
 * @param headers - Next.js or standard Headers interface
 */
export function detectDeviceInfo(headers: HeaderProvider): DeviceInfo {
  const ua = headers.get("user-agent") ?? "";
  const chModel = headers.get("sec-ch-ua-model")?.replace(/"/g, "").trim();
  const chPlatform = headers.get("sec-ch-ua-platform")?.replace(/"/g, "").trim();
  const chMobile = headers.get("sec-ch-ua-mobile");

  // 1. Operating System
  let os = "Unknown OS";
  if (/iPhone|iPad|iPod/i.test(ua)) {
    const match = ua.match(/OS (\d+[_\.]\d+)/i);
    const version = match ? match[1].replace("_", ".") : "";
    os = /iPad/i.test(ua) ? `iPadOS ${version}`.trim() : `iOS ${version}`.trim();
  } else if (/Android/i.test(ua)) {
    const match = ua.match(/Android (\d+(\.\d+)?)/i);
    os = match ? `Android ${match[1]}` : "Android";
  } else if (/Macintosh|Mac OS X/i.test(ua)) {
    os = "macOS";
  } else if (/Windows/i.test(ua)) {
    os = "Windows";
  } else if (/Linux/i.test(ua)) {
    os = "Linux";
  } else if (chPlatform) {
    os = chPlatform;
  }

  // 2. Device Type
  let deviceType: "MOBILE" | "TABLET" | "DESKTOP" = "DESKTOP";
  if (/iPad|Tablet/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua))) {
    deviceType = "TABLET";
  } else if (chMobile === "?1" || /Mobile/i.test(ua) || /iPhone|iPod/i.test(ua)) {
    deviceType = "MOBILE";
  }

  // 3. Device Model
  let deviceModel = "Desktop Device";
  if (chModel && chModel.length > 0) {
    deviceModel = chModel;
  } else if (/iPhone/i.test(ua)) {
    deviceModel = "iPhone";
  } else if (/iPad/i.test(ua)) {
    deviceModel = "iPad";
  } else if (/Android/i.test(ua)) {
    // Extract Android device model from User-Agent e.g. "Linux; Android 14; Pixel 8 Pro" or "SM-S918B"
    const modelMatch = ua.match(/Android[^;]+;\s*([^;)]+)\)/i);
    if (modelMatch && modelMatch[1]) {
      const rawModel = modelMatch[1].trim();
      if (/^SM-/i.test(rawModel)) {
        deviceModel = `Samsung Galaxy (${rawModel})`;
      } else {
        deviceModel = rawModel;
      }
    } else {
      deviceModel = "Android Device";
    }
  } else if (/Macintosh/i.test(ua)) {
    deviceModel = "Mac";
  } else if (/Windows/i.test(ua)) {
    deviceModel = "Windows PC";
  } else if (/Linux/i.test(ua)) {
    deviceModel = "Linux PC";
  }

  // 4. Browser
  let browser = "Web Browser";
  if (/Edg\//i.test(ua)) {
    browser = "Microsoft Edge";
  } else if (/SamsungBrowser\//i.test(ua)) {
    browser = "Samsung Internet";
  } else if (/Chrome\//i.test(ua) && !/Chromium\//i.test(ua)) {
    browser = "Google Chrome";
  } else if (/Firefox\//i.test(ua)) {
    browser = "Mozilla Firefox";
  } else if (/Version\/.*Safari\//i.test(ua)) {
    browser = deviceType === "MOBILE" ? "Mobile Safari" : "Safari";
  }

  return {
    deviceType,
    deviceModel,
    os,
    browser,
  };
}

