import {
  calculateDrawDimensions,
  hitTestSlot,
  PRINT_DPI_SCALE,
} from "../composer-transform";
import type { FrameSlot } from "@/types/frame";

describe("composer-transform", () => {
  describe("calculateDrawDimensions", () => {
    it("calculates exact centered cover-fit when zoom is 1 and pan is 0", () => {
      // Slot 400x400, image 800x400 (wider)
      const dims = calculateDrawDimensions(50, 50, 400, 400, 800, 400, {
        zoom: 1.0,
        panX: 0,
        panY: 0,
      });

      expect(dims.drawW).toBe(800);
      expect(dims.drawH).toBe(400);
      expect(dims.drawX).toBe(50 - 200); // Centered horizontally
      expect(dims.drawY).toBe(50);
      expect(dims.maxPanX).toBe(200);
      expect(dims.maxPanY).toBe(0);
    });

    it("clamps pan offsets within allowable boundaries to prevent gaps", () => {
      const dims = calculateDrawDimensions(0, 0, 400, 400, 800, 400, {
        zoom: 1.0,
        panX: 500, // Excessive right pan
        panY: 100, // Excessive Y pan
      });

      // Max pan is 200, so panX must be clamped to 200
      expect(dims.drawX).toBe((400 - 800) / 2 + 200); // 0
      expect(dims.drawY).toBe(0);
    });

    it("scales dimensions proportionally with zoom factor", () => {
      const dims = calculateDrawDimensions(0, 0, 200, 200, 200, 200, {
        zoom: 2.0,
        panX: 0,
        panY: 0,
      });

      expect(dims.drawW).toBe(400);
      expect(dims.drawH).toBe(400);
      expect(dims.maxPanX).toBe(100);
      expect(dims.maxPanY).toBe(100);
    });

    it("enforces minimum zoom of 1.0 and maximum of 3.0", () => {
      const dimsMin = calculateDrawDimensions(0, 0, 200, 200, 200, 200, {
        zoom: 0.5,
        panX: 0,
        panY: 0,
      });
      expect(dimsMin.drawW).toBe(200);

      const dimsMax = calculateDrawDimensions(0, 0, 200, 200, 200, 200, {
        zoom: 5.0,
        panX: 0,
        panY: 0,
      });
      expect(dimsMax.drawW).toBe(600); // 200 * 3.0
    });
  });

  describe("hitTestSlot", () => {
    const mockSlots: FrameSlot[] = [
      {
        id: "slot-1",
        slotIndex: 0,
        x: 10,
        y: 10,
        width: 35,
        height: 80,
        assignedUser: "HOST",
      },
      {
        id: "slot-2",
        slotIndex: 1,
        x: 55,
        y: 10,
        width: 35,
        height: 80,
        assignedUser: "GUEST",
      },
    ];

    it("returns matching slot when coordinate is inside slot bounds", () => {
      // Canvas 1000x1000
      // Slot 1 is x: 100 to 450, y: 100 to 900
      const hit = hitTestSlot(200, 300, 1000, 1000, mockSlots);
      expect(hit).toBeDefined();
      expect(hit?.id).toBe("slot-1");
    });

    it("returns null when coordinate is outside all slots", () => {
      // Inside gap between slot 1 and slot 2 (x: 480)
      const hit = hitTestSlot(480, 500, 1000, 1000, mockSlots);
      expect(hit).toBeNull();
    });
  });

  describe("PRINT_DPI_SCALE", () => {
    it("is at least 2 for high density print generation", () => {
      expect(PRINT_DPI_SCALE).toBeGreaterThanOrEqual(2);
    });
  });
});

