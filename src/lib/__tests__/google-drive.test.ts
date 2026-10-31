import {
  buildMultipartBody,
  uploadKeepsakeToGoogleDrive,
} from "../google-drive";

describe("google-drive", () => {
  describe("buildMultipartBody", () => {
    it("constructs valid multipart/related payload with boundary", async () => {
      const metadata = { name: "test-keepsake.png", mimeType: "image/png" };
      const blob = new Blob(["fake-image-bytes"], { type: "image/png" });
      const boundary = "test_boundary_123";

      const multipart = buildMultipartBody(metadata, blob, boundary);
      expect(multipart.type).toBe("multipart/related; boundary=test_boundary_123");

      const text = await multipart.text();
      expect(text).toContain("--test_boundary_123");
      expect(text).toContain('Content-Type: application/json; charset=UTF-8');
      expect(text).toContain('"name":"test-keepsake.png"');
      expect(text).toContain('Content-Type: image/png');
      expect(text).toContain("--test_boundary_123--");
    });
  });

  describe("uploadKeepsakeToGoogleDrive", () => {
    const originalFetch = global.fetch;

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it("returns success with fileId and webViewLink when Google API responds 200", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          id: "google-drive-file-id-456",
          webViewLink: "https://drive.google.com/file/d/google-drive-file-id-456/view",
        }),
      });

      const blob = new Blob(["data"], { type: "image/png" });
      const res = await uploadKeepsakeToGoogleDrive(
        "test-access-token",
        blob,
        "keepsake.png"
      );

      expect(res.success).toBe(true);
      expect(res.fileId).toBe("google-drive-file-id-456");
      expect(res.webViewLink).toBe(
        "https://drive.google.com/file/d/google-drive-file-id-456/view"
      );
    });

    it("handles Google API errors gracefully without throwing", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => "Invalid Credentials",
      });

      const blob = new Blob(["data"], { type: "image/png" });
      const res = await uploadKeepsakeToGoogleDrive(
        "expired-token",
        blob,
        "keepsake.png"
      );

      expect(res.success).toBe(false);
      expect(res.error).toContain("401");
      expect(res.error).toContain("Invalid Credentials");
    });
  });
});

