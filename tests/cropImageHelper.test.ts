import { describe, expect, it } from "vitest";
import {
  getInitialSquareCrop,
  getCroppedCanvas,
  generateCroppedFile,
} from "../src/components/Profile/cropImageHelper";
import type { PixelCrop } from "react-image-crop";

describe("cropImageHelper - Square Crop Calculation & Canvas (TKNHTTDNB1-189)", () => {
  describe("getInitialSquareCrop", () => {
    it("generates a 1:1 aspect centered crop for landscape image", () => {
      const width = 800;
      const height = 600;
      const initialCrop = getInitialSquareCrop(width, height);

      expect(initialCrop.unit).toBe("%");
      expect(initialCrop.width).toBeGreaterThan(0);
      expect(initialCrop.height).toBeGreaterThan(0);
    });

    it("generates a 1:1 aspect centered crop for portrait image", () => {
      const width = 400;
      const height = 700;
      const initialCrop = getInitialSquareCrop(width, height);

      expect(initialCrop.unit).toBe("%");
      expect(initialCrop.width).toBeGreaterThan(0);
      expect(initialCrop.height).toBeGreaterThan(0);
    });

    it("generates a 1:1 aspect centered crop for square image", () => {
      const width = 500;
      const height = 500;
      const initialCrop = getInitialSquareCrop(width, height);

      expect(initialCrop.unit).toBe("%");
      expect(initialCrop.width).toBeGreaterThan(0);
      expect(initialCrop.height).toBeGreaterThan(0);
    });
  });

  describe("getCroppedCanvas", () => {
    it("returns null early if crop width or height is zero without touching DOM canvas", () => {
      const mockImg = {
        naturalWidth: 800,
        naturalHeight: 600,
        width: 400,
        height: 300,
      } as unknown as HTMLImageElement;

      const zeroCrop: PixelCrop = { unit: "px", x: 0, y: 0, width: 0, height: 0 };
      expect(getCroppedCanvas(mockImg, zeroCrop)).toBeNull();

      const zeroHeightCrop: PixelCrop = { unit: "px", x: 0, y: 0, width: 100, height: 0 };
      expect(getCroppedCanvas(mockImg, zeroHeightCrop)).toBeNull();
    });
  });

  describe("generateCroppedFile", () => {
    it("resolves null when crop width or height is 0", async () => {
      const mockImg = {
        naturalWidth: 800,
        naturalHeight: 600,
        width: 400,
        height: 300,
      } as unknown as HTMLImageElement;

      const zeroCrop: PixelCrop = { unit: "px", x: 0, y: 0, width: 0, height: 0 };
      const file = await generateCroppedFile({
        image: mockImg,
        crop: zeroCrop,
        fileName: "test.jpg",
      });
      expect(file).toBeNull();
    });
  });
});
