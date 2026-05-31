// File: tests/engine/margin.test.ts
import { describe, it, expect } from "vitest";
import { calculateMargin } from "@/lib/engine";

describe("Margin Calculator", () => {
  it("should calculate margin for EURUSD with USD account", () => {
    // 1 lot EURUSD at 1.10 with 1:100 leverage
    // Position value = 100000 * 1.10 = 110,000 USD
    // Margin = 110,000 / 100 = 1,100 USD

    const result = calculateMargin({
      currencyPair: "EURUSD",
      lotSize: 1,
      leverage: 100,
      exchangeRate: 1.1,
      accountCurrency: "USD",
    });

    expect(result.requiredMargin).toBe("1100.00");
    expect(result.positionValue).toBe("110000.00");
    expect(result.effectiveLeverage).toBe("100.00");
  });

  it("should calculate margin for USDJPY", () => {
    // 1 lot USDJPY with USD account at 1:100
    // Base is USD, so position value = 100000 * 1 = 100,000 USD
    // Margin = 100,000 / 100 = 1,000 USD

    const result = calculateMargin({
      currencyPair: "USDJPY",
      lotSize: 1,
      leverage: 100,
      exchangeRate: 150,
      accountCurrency: "USD",
    });

    expect(result.requiredMargin).toBe("1000.00");
    expect(result.positionValue).toBe("100000.00");
  });

  it("should calculate margin for mini lot", () => {
    const result = calculateMargin({
      currencyPair: "EURUSD",
      lotSize: 0.1,
      leverage: 100,
      exchangeRate: 1.1,
      accountCurrency: "USD",
    });

    expect(result.requiredMargin).toBe("110.00");
  });

  it("should handle different leverage levels", () => {
    const result500 = calculateMargin({
      currencyPair: "EURUSD",
      lotSize: 1,
      leverage: 500,
      exchangeRate: 1.1,
      accountCurrency: "USD",
    });

    expect(result500.requiredMargin).toBe("220.00");

    const result30 = calculateMargin({
      currencyPair: "EURUSD",
      lotSize: 1,
      leverage: 30,
      exchangeRate: 1.1,
      accountCurrency: "USD",
    });

    expect(parseFloat(result30.requiredMargin)).toBeCloseTo(3666.67, 0);
  });
});