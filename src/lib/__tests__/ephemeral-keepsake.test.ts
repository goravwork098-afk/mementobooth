import {
  createEphemeralKeepsake,
  getEphemeralKeepsake,
  purgeExpiredKeepsakes,
  clearAllKeepsakesForTesting,
  KEEPSAKE_TTL_MS,
  sendKeepsakeEmail,
} from "../ephemeral-keepsake";

describe("ephemeral-keepsake", () => {
  beforeEach(() => {
    clearAllKeepsakesForTesting();
  });

  it("creates and retrieves an ephemeral keepsake with valid token", () => {
    const token = createEphemeralKeepsake(
      "LOVE-4X9K",
      "Korean Mall 4-Cut",
      "data:image/png;base64,sample"
    );

    expect(token).toBeDefined();
    expect(token.length).toBeGreaterThanOrEqual(16);

    const record = getEphemeralKeepsake(token);
    expect(record).not.toBeNull();
    expect(record?.roomCode).toBe("LOVE-4X9K");
    expect(record?.frameName).toBe("Korean Mall 4-Cut");
    expect(record?.dataUrl).toBe("data:image/png;base64,sample");
    expect(record?.expiresAt).toBeGreaterThan(Date.now());
  });

  it("returns null for non-existent token", () => {
    const record = getEphemeralKeepsake("invalid-token-12345");
    expect(record).toBeNull();
  });

  it("purges keepsakes past their 24-hour expiration", () => {
    const token = createEphemeralKeepsake(
      "LOVE-1234",
      "Sweethearts",
      "data:image/png;base64,test"
    );

    const record = getEphemeralKeepsake(token);
    expect(record).not.toBeNull();

    // Manually simulate expiration
    if (record) {
      record.expiresAt = Date.now() - 1000;
    }

    const expiredRecord = getEphemeralKeepsake(token);
    expect(expiredRecord).toBeNull();
  });

  it("purgeExpiredKeepsakes removes stale records and returns purged count", () => {
    const token = createEphemeralKeepsake(
      "LOVE-PURGE",
      "Purge Test",
      "data:image/png;base64,purge"
    );

    const record = getEphemeralKeepsake(token);
    expect(record).not.toBeNull();

    if (record) {
      record.expiresAt = Date.now() - 5000;
    }

    const purged = purgeExpiredKeepsakes();
    expect(purged).toBeGreaterThanOrEqual(1);
    expect(getEphemeralKeepsake(token)).toBeNull();
  });

  it("has exact 24 hour TTL constant", () => {
    expect(KEEPSAKE_TTL_MS).toBe(24 * 60 * 60 * 1000);
  });

  it("handles missing email server gracefully with error response", async () => {
    const originalEnv = process.env.AUTH_EMAIL_SERVER;
    delete process.env.AUTH_EMAIL_SERVER;

    const res = await sendKeepsakeEmail({
      recipients: ["couple@example.com"],
      imageBuffer: Buffer.from("image-bytes"),
      roomCode: "LOVE-1234",
      frameName: "Classic 4-Cut",
    });

    expect(res.success).toBe(false);
    expect(res.error).toContain("Email server is not configured");

    process.env.AUTH_EMAIL_SERVER = originalEnv;
  });
});

