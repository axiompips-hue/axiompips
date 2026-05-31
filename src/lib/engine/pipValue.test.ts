// File: tests/engine/pipValue.test.ts
import { describe, it, expect } from "vitest";
import { calculatePipValue } from "@/lib/engine";

describe("Pip Value Calculator", () => {
  it("should calculate pip value for EURUSD with USD account", () => {
    // For EURUSD with USD account, 1 pip = 10 USD per standard lot
    const result = calculatePipValue({
      currencyPair: "EURUSD",
      lotSize: 1,
      accountCurrency: "USD",
      exchangeRate: 1.1,
    });

    expect(result.pipValuePerLot).toBe("10.0000");
    expect(result.totalPipValue).toBe("10.0000");
  });

  it("should calculate pip value for mini lot", () => {
    const result = calculatePipValue({
      currencyPair: "EURUSD",
      lotSize: 0.1,
      accountCurrency: "USD",
      exchangeRate: 1.1,
    });

    expect(result.totalPipValue).toBe("1.0000");
  });

  it("should calculate pip value for USDJPY", () => {
    // For USDJPY at 150, pip value = (100000 * 0.01) / 150 = 6.6667 USD
    const result = calculatePipValue({
      currencyPair: "USDJPY",
      lotSize: 1,
      accountCurrency: "USD",
      exchangeRate: 150,
    });

    expect(parseFloat(result.pipValuePerLot)).toBeCloseTo(6.67, 1);
  });

  it("should calculate pip value for cross pair with conversion", () => {
    // EURGBP with USD account
    // Need GBPUSD rate to convert
    const result = calculatePipValue({
      currencyPair: "EURGBP",
      lotSize: 1,
      accountCurrency: "USD",
      exchangeRate: 0.85, // EURGBP rate
      quoteToAccountRate: 1.25, // GBPUSD rate
    });

    // Pip value = 100000 * 0.0001 * 1.25 = 12.50 USD
    expect(result.pipValuePerLot).toBe("12.5000");
  });
});