import { describe, expect, it, beforeEach } from "vitest";
import { calculateShippingByCEP } from "./shippingRates";
import { getProductLineItems } from "./products";

describe("Shipping Calculation", () => {
  describe("calculateShippingByCEP", () => {
    it("should calculate shipping for Portugal Continental - Domicílio", () => {
      const cost = calculateShippingByCEP("4810-433", "home", 1);
      expect(cost).toBeGreaterThan(0);
      expect(cost).toBeLessThan(100);
      expect(typeof cost).toBe("number");
      expect(isNaN(cost)).toBe(false);
    });

    it("should calculate shipping for Portugal Continental - CTT Point", () => {
      const cost = calculateShippingByCEP("4810-433", "ctt_point", 1);
      expect(cost).toBeGreaterThan(0);
      expect(cost).toBeLessThan(100);
      expect(typeof cost).toBe("number");
      expect(isNaN(cost)).toBe(false);
    });

    it("should calculate shipping for Azores", () => {
      const cost = calculateShippingByCEP("9500-001", "home", 1);
      expect(cost).toBeGreaterThan(0);
      expect(typeof cost).toBe("number");
      expect(isNaN(cost)).toBe(false);
    });

    it("should calculate shipping for Madeira", () => {
      const cost = calculateShippingByCEP("9100-001", "home", 1);
      expect(cost).toBeGreaterThan(0);
      expect(typeof cost).toBe("number");
      expect(isNaN(cost)).toBe(false);
    });

    it("should calculate shipping for Spain Peninsula", () => {
      const cost = calculateShippingByCEP("28001", "home", 1);
      expect(cost).toBeGreaterThan(0);
      expect(typeof cost).toBe("number");
      expect(isNaN(cost)).toBe(false);
    });

    it("should return default value for invalid CEP", () => {
      const cost = calculateShippingByCEP("", "home", 1);
      expect(cost).toBe(5.58);
    });

    it("should handle multiple quantities", () => {
      const cost1 = calculateShippingByCEP("4810-433", "home", 1);
      const cost2 = calculateShippingByCEP("4810-433", "home", 2);
      // Shipping cost should increase with weight
      expect(cost2).toBeGreaterThanOrEqual(cost1);
    });

    it("should never return NaN", () => {
      const testCEPs = ["4810-433", "9500-001", "9100-001", "28001", ""];
      const testTypes = ["home", "ctt_point"] as const;

      for (const cep of testCEPs) {
        for (const type of testTypes) {
          const cost = calculateShippingByCEP(cep, type, 1);
          expect(isNaN(cost)).toBe(false);
          expect(isFinite(cost)).toBe(true);
          expect(cost).toBeGreaterThan(0);
        }
      }
    });
  });

  describe("getProductLineItems", () => {
    it("should create line items with valid shipping cost", () => {
      const items = getProductLineItems(1, 5.58);
      expect(items).toHaveLength(2);
      expect(items[0]?.quantity).toBe(1);
      expect(items[1]?.quantity).toBe(1);
    });

    it("should handle zero shipping cost", () => {
      const items = getProductLineItems(1, 0);
      expect(items).toHaveLength(1); // Only product, no shipping
    });

    it("should handle NaN shipping cost with fallback", () => {
      const items = getProductLineItems(1, NaN);
      expect(items).toHaveLength(2); // Should use default fallback
    });

    it("should create correct unit amounts in cents", () => {
      const items = getProductLineItems(1, 5.58);
      const shippingItem = items[1];
      expect(shippingItem?.price_data?.unit_amount).toBe(558); // 5.58 * 100
    });

    it("should handle multiple quantities", () => {
      const items = getProductLineItems(3, 5.58);
      expect(items[0]?.quantity).toBe(3);
      expect(items[1]?.quantity).toBe(1);
    });

    it("should never create NaN unit amounts", () => {
      const testCosts = [0, 5.58, 10.00, NaN, undefined];
      for (const cost of testCosts) {
        const items = getProductLineItems(1, cost as any);
        for (const item of items) {
          if (item.price_data?.unit_amount) {
            expect(isNaN(item.price_data.unit_amount)).toBe(false);
            expect(item.price_data.unit_amount).toBeGreaterThan(0);
          }
        }
      }
    });
  });
});
