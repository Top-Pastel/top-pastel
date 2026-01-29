import { describe, expect, it } from "vitest";
import {
  calculateShipping,
  calculateShippingByCEP,
  getDestinationFromCEP,
} from "./shippingRates";

describe("Shipping Rates", () => {
  describe("getDestinationFromCEP", () => {
    it("should identify Portugal Continental", () => {
      expect(getDestinationFromCEP("4810-433")).toBe("pt_continente");
      expect(getDestinationFromCEP("1000-001")).toBe("pt_continente");
      expect(getDestinationFromCEP("9000-000")).toBe("pt_continente");
    });

    it("should identify Açores", () => {
      expect(getDestinationFromCEP("9500-000")).toBe("acores");
      expect(getDestinationFromCEP("9700-000")).toBe("acores");
    });

    it("should identify Madeira", () => {
      expect(getDestinationFromCEP("9000-000")).toBe("pt_continente");
      expect(getDestinationFromCEP("9100-000")).toBe("madeira");
      expect(getDestinationFromCEP("9400-000")).toBe("madeira");
    });
  });

  describe("calculateShipping", () => {
    it("should calculate shipping for Portugal Continental - Ponto CTT", () => {
      const cost = calculateShipping("pt_continente", "ponto_ctt", 1.5);
      expect(cost).toBe(4.93); // Até 5kg
    });

    it("should calculate shipping for Portugal Continental - Domicilio", () => {
      const cost = calculateShipping("pt_continente", "domicilio", 1.5);
      expect(cost).toBe(5.58); // Até 5kg
    });

    it("should calculate shipping for Açores - Domicilio", () => {
      const cost = calculateShipping("acores", "domicilio", 1.5);
      expect(cost).toBe(9.51); // Até 5kg
    });

    it("should calculate shipping for Madeira - Ponto CTT", () => {
      const cost = calculateShipping("madeira", "ponto_ctt", 1.5);
      expect(cost).toBe(4.93); // Até 5kg
    });

    it("should handle weight ranges correctly", () => {
      // 1kg should use "Até 1kg" rate
      const cost1kg = calculateShipping("pt_continente", "domicilio", 1);
      expect(cost1kg).toBe(5.24);

      // 5kg should use "Até 5kg" rate
      const cost5kg = calculateShipping("pt_continente", "domicilio", 5);
      expect(cost5kg).toBe(5.58);

      // 10kg should use "Até 10kg" rate
      const cost10kg = calculateShipping("pt_continente", "domicilio", 10);
      expect(cost10kg).toBe(6.14);
    });
  });

  describe("calculateShippingByCEP", () => {
    it("should calculate shipping by CEP", () => {
      const cost = calculateShippingByCEP("4810-433", "domicilio", 1.5);
      expect(cost).toBe(5.58); // Portugal Continental, Até 5kg
    });

    it("should handle CEP with or without hyphen", () => {
      const costWithHyphen = calculateShippingByCEP("4810-433", "domicilio", 1.5);
      const costWithoutHyphen = calculateShippingByCEP("4810433", "domicilio", 1.5);
      expect(costWithHyphen).toBe(costWithoutHyphen);
    });

    it("should calculate shipping for Espanha Península", () => {
      const cost = calculateShippingByCEP("28000", "domicilio", 1.5);
      expect(cost).toBe(7.49); // Até 5kg
    });
  });
});
