// File: tests/engine/breakEven.test.ts
import { describe, it, expect } from "vitest";
import { calculateBreakEven } from "@/lib/engine";

describe("Break-Even Calculator", () => {
  it("should calculate break-even with spread only for buy", () => {
    // Entry: 1.1000
    // Spread: 2 pips
    // For buy, break-even = 1.1000 + (2 * 0.0001) = 1.1002

    const result = calculateBreakEven({
      entryPrice: 1.1,
      direction: "buy",
      spreadPips: 2,
      currencyPair: "EURUSD",
    });

    expect(result.breakEvenPrice).toBe("1.10020");
    expect(result.breakEvenPips).toBe("2.0");
  });

  it("should calculate break-even with spread only for sell", () => {
    // Entry: 1.1000
    // Spread: 2 pips
    // For sell, break-even = 1.1000 - (2 * 0.0001) = 1.0998

    const result = calculateBreakEven({
      entryPrice: 1.1,
      direction: "sell",
      spreadPips: 2,
      currencyPair: "EURUSD",
    });

    expect(result.breakEvenPrice).toBe("1.09980");
    expect(result.breakEvenPips).toBe("2.0");
  });

  it("should calculate break-even with commission", () => {
    // Entry: 1.1000
    // Spread: 1 pip
    // Commission: 7 USD per lot, 1 lot
    // Pip value: 10 USD
    // Commission in pips: 7 / 10 = 0.7 pips
    // Total: 1.7 pips

    const result = calculateBreakEven({
      entryPrice: 1.1,
      direction: "buy",
      spreadPips: 1,
      commissionPerLot: 7,
      lotSize: 1,
      pipValue: 10,
      currencyPair: "EURUSD",
    });

    expect(result.breakEvenPips).toBe("1.7");
  });

  it("should handle JPY pairs correctly", () => {
    // USDJPY at 150.00
    // Spread: 2 pips = 0.02
    // Break-even for buy = 150.00 + 0.02 = 150.02

    const result = calculateBreakEven({
      entryPrice: 150,
      direction: "buy",
      spreadPips: 2,
      currencyPair: "USDJPY",
    });

    expect(result.breakEvenPrice).toBe("150.020");
  });
});