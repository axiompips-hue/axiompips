// File: tests/engine/profitLoss.test.ts
import { describe, it, expect } from "vitest";
import { calculateProfitLoss } from "@/lib/engine";

describe("Profit/Loss Calculator", () => {
  it("should calculate profit for winning buy trade", () => {
    // Buy EURUSD at 1.1000, exit at 1.1050 (50 pips profit)
    // 1 lot, pip value = 10 USD
    // Profit = 50 * 10 * 1 = 500 USD

    const result = calculateProfitLoss({
      entryPrice: 1.1,
      exitPrice: 1.105,
      direction: "buy",
      currencyPair: "EURUSD",
      lotSize: 1,
      accountCurrency: "USD",
      exchangeRate: 1.105,
    });

    expect(result.pips).toBe("50.0");
    expect(result.profitLoss).toBe("500.00");
    expect(result.isProfit).toBe(true);
  });

  it("should calculate loss for losing buy trade", () => {
    // Buy EURUSD at 1.1000, exit at 1.0950 (50 pips loss)
    // 1 lot, pip value = 10 USD
    // Loss = -50 * 10 * 1 = -500 USD

    const result = calculateProfitLoss({
      entryPrice: 1.1,
      exitPrice: 1.095,
      direction: "buy",
      currencyPair: "EURUSD",
      lotSize: 1,
      accountCurrency: "USD",
      exchangeRate: 1.095,
    });

    expect(result.pips).toBe("-50.0");
    expect(result.profitLoss).toBe("-500.00");
    expect(result.isProfit).toBe(false);
  });

  it("should calculate profit for winning sell trade", () => {
    // Sell EURUSD at 1.1000, exit at 1.0950 (50 pips profit for sell)
    // 1 lot, pip value = 10 USD
    // Profit = 50 * 10 * 1 = 500 USD

    const result = calculateProfitLoss({
      entryPrice: 1.1,
      exitPrice: 1.095,
      direction: "sell",
      currencyPair: "EURUSD",
      lotSize: 1,
      accountCurrency: "USD",
      exchangeRate: 1.095,
    });

    expect(result.pips).toBe("50.0");
    expect(result.profitLoss).toBe("500.00");
    expect(result.isProfit).toBe(true);
  });

  it("should calculate loss for losing sell trade", () => {
    // Sell EURUSD at 1.1000, exit at 1.1050 (50 pips loss for sell)

    const result = calculateProfitLoss({
      entryPrice: 1.1,
      exitPrice: 1.105,
      direction: "sell",
      currencyPair: "EURUSD",
      lotSize: 1,
      accountCurrency: "USD",
      exchangeRate: 1.105,
    });

    expect(result.pips).toBe("-50.0");
    expect(result.profitLoss).toBe("-500.00");
    expect(result.isProfit).toBe(false);
  });

  it("should handle mini lots correctly", () => {
    // 0.1 lot = 1/10 of standard lot
    const result = calculateProfitLoss({
      entryPrice: 1.1,
      exitPrice: 1.11,
      direction: "buy",
      currencyPair: "EURUSD",
      lotSize: 0.1,
      accountCurrency: "USD",
      exchangeRate: 1.11,
    });

    // 100 pips * 10 USD/pip * 0.1 lot = 100 USD
    expect(result.pips).toBe("100.0");
    expect(result.profitLoss).toBe("100.00");
  });

  it("should handle USDJPY correctly", () => {
    // Buy USDJPY at 150.00, exit at 150.50 (50 pips)
    const result = calculateProfitLoss({
      entryPrice: 150,
      exitPrice: 150.5,
      direction: "buy",
      currencyPair: "USDJPY",
      lotSize: 1,
      accountCurrency: "USD",
      exchangeRate: 150.5,
    });

    expect(result.pips).toBe("50.0");
    // Pip value at 150.5 = (100000 * 0.01) / 150.5 = 6.64 USD
    // Profit = 50 * 6.64 = 332 USD (approximately)
    expect(parseFloat(result.profitLoss)).toBeCloseTo(332, 0);
  });
});