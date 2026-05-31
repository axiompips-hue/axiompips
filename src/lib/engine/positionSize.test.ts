// File: tests/engine/positionSize.test.ts
import { describe, it, expect } from "vitest";
import { calculatePositionSize, validatePositionSizeInput } from "@/lib/engine";

describe("Position Size Calculator", () => {
  describe("validatePositionSizeInput", () => {
    it("should validate correct inputs", () => {
      const result = validatePositionSizeInput({
        accountBalance: 10000,
        riskPercent: 1,
        stopLossPips: 50,
        currencyPair: "EURUSD",
        accountCurrency: "USD",
        exchangeRate: 1.1,
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject zero account balance", () => {
      const result = validatePositionSizeInput({
        accountBalance: 0,
        riskPercent: 1,
        stopLossPips: 50,
        currencyPair: "EURUSD",
        accountCurrency: "USD",
        exchangeRate: 1.1,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Account balance must be greater than zero");
    });

    it("should reject risk over 100%", () => {
      const result = validatePositionSizeInput({
        accountBalance: 10000,
        riskPercent: 150,
        stopLossPips: 50,
        currencyPair: "EURUSD",
        accountCurrency: "USD",
        exchangeRate: 1.1,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Risk percentage cannot exceed 100%");
    });
  });

  describe("calculatePositionSize", () => {
    it("should calculate correct position size for EURUSD", () => {
      // Scenario:
      // Account: 10,000 USD
      // Risk: 1% = 100 USD
      // Stop Loss: 50 pips
      // Pair: EURUSD (pip value = 10 USD per lot)
      // Expected: 100 / (50 * 10) = 0.2 lots = 20,000 units

      const result = calculatePositionSize({
        accountBalance: 10000,
        riskPercent: 1,
        stopLossPips: 50,
        currencyPair: "EURUSD",
        accountCurrency: "USD",
        exchangeRate: 1.1,
      });

      expect(result.lots).toBe("0.20");
      expect(result.units).toBe("20000");
      expect(result.riskAmount).toBe("100.00");
    });

    it("should calculate correct position size for USDJPY", () => {
      // Scenario:
      // Account: 10,000 USD
      // Risk: 2% = 200 USD
      // Stop Loss: 40 pips
      // Pair: USDJPY at 150.00
      // Pip value per lot = (100000 * 0.01) / 150 = 6.6667 USD
      // Expected: 200 / (40 * 6.6667) = 0.75 lots

      const result = calculatePositionSize({
        accountBalance: 10000,
        riskPercent: 2,
        stopLossPips: 40,
        currencyPair: "USDJPY",
        accountCurrency: "USD",
        exchangeRate: 150,
      });

      expect(parseFloat(result.lots)).toBeCloseTo(0.75, 1);
      expect(result.riskAmount).toBe("200.00");
    });

    it("should handle small accounts correctly", () => {
      const result = calculatePositionSize({
        accountBalance: 500,
        riskPercent: 1,
        stopLossPips: 20,
        currencyPair: "EURUSD",
        accountCurrency: "USD",
        exchangeRate: 1.1,
      });

      // Risk = 5 USD
      // Position = 5 / (20 * 10) = 0.025 lots
      expect(result.lots).toBe("0.03"); // Rounded
      expect(result.riskAmount).toBe("5.00");
    });

    it("should calculate micro lots correctly", () => {
      const result = calculatePositionSize({
        accountBalance: 1000,
        riskPercent: 0.5,
        stopLossPips: 25,
        currencyPair: "EURUSD",
        accountCurrency: "USD",
        exchangeRate: 1.1,
      });

      // Risk = 5 USD
      // Position = 5 / (25 * 10) = 0.02 lots = 2 micro lots
      expect(result.lots).toBe("0.02");
      expect(result.microLots).toBe("2");
    });
  });
});