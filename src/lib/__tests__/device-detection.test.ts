import { detectDeviceInfo, HeaderProvider } from "../device-detection";

describe("detectDeviceInfo", () => {
  function createMockHeaders(map: Record<string, string>): HeaderProvider {
    return {
      get: (key: string) => map[key.toLowerCase()] ?? null,
    };
  }

  it("detects iPhone with iOS and Safari", () => {
    const headers = createMockHeaders({
      "user-agent":
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
    });

    const info = detectDeviceInfo(headers);
    expect(info.deviceType).toBe("MOBILE");
    expect(info.deviceModel).toBe("iPhone");
    expect(info.os).toBe("iOS 17.4");
    expect(info.browser).toBe("Mobile Safari");
  });

  it("detects iPad with iPadOS", () => {
    const headers = createMockHeaders({
      "user-agent":
        "Mozilla/5.0 (iPad; CPU OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1",
    });

    const info = detectDeviceInfo(headers);
    expect(info.deviceType).toBe("TABLET");
    expect(info.deviceModel).toBe("iPad");
    expect(info.os).toBe("iPadOS 16.5");
  });

  it("detects Android device model from User-Agent", () => {
    const headers = createMockHeaders({
      "user-agent":
        "Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36",
    });

    const info = detectDeviceInfo(headers);
    expect(info.deviceType).toBe("MOBILE");
    expect(info.deviceModel).toBe("Pixel 8 Pro");
    expect(info.os).toBe("Android 14");
    expect(info.browser).toBe("Google Chrome");
  });

  it("detects Samsung Galaxy device and Samsung Internet", () => {
    const headers = createMockHeaders({
      "user-agent":
        "Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/23.0 Chrome/115.0.0.0 Mobile Safari/537.36",
    });

    const info = detectDeviceInfo(headers);
    expect(info.deviceType).toBe("MOBILE");
    expect(info.deviceModel).toBe("Samsung Galaxy (SM-S918B)");
    expect(info.os).toBe("Android 13");
    expect(info.browser).toBe("Samsung Internet");
  });

  it("prefers Client Hints sec-ch-ua-model when provided", () => {
    const headers = createMockHeaders({
      "user-agent":
        "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36",
      "sec-ch-ua-model": '"Galaxy S24 Ultra"',
      "sec-ch-ua-platform": '"Android"',
      "sec-ch-ua-mobile": "?1",
    });

    const info = detectDeviceInfo(headers);
    expect(info.deviceType).toBe("MOBILE");
    expect(info.deviceModel).toBe("Galaxy S24 Ultra");
  });

  it("detects macOS desktop with Chrome", () => {
    const headers = createMockHeaders({
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    });

    const info = detectDeviceInfo(headers);
    expect(info.deviceType).toBe("DESKTOP");
    expect(info.deviceModel).toBe("Mac");
    expect(info.os).toBe("macOS");
    expect(info.browser).toBe("Google Chrome");
  });

  it("detects Windows desktop with Edge", () => {
    const headers = createMockHeaders({
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36 Edg/123.0.0.0",
    });

    const info = detectDeviceInfo(headers);
    expect(info.deviceType).toBe("DESKTOP");
    expect(info.deviceModel).toBe("Windows PC");
    expect(info.os).toBe("Windows");
    expect(info.browser).toBe("Microsoft Edge");
  });

  it("handles missing headers gracefully with safe fallbacks", () => {
    const headers = createMockHeaders({});

    const info = detectDeviceInfo(headers);
    expect(info.deviceType).toBe("DESKTOP");
    expect(info.deviceModel).toBe("Desktop Device");
    expect(info.os).toBe("Unknown OS");
    expect(info.browser).toBe("Web Browser");
  });
});

