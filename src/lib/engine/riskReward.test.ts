// File: tests/engine/riskReward.test.ts
import { describe, it, expect } from "vitest";
import { calculateRiskReward, validateRiskRewardInput } from "@/lib/engine";

describe("Risk-Reward Calculator", () => {
  describe("validation", () => {
    it("should validate correct buy setup", () => {
      const result = validateRiskRewardInput({
        entryPrice: 1.1,
        stopLossPrice: 1.095,
        takeProfitPrice: 1.12,
        direction: "buy",
        currencyPair: "EURUSD",
      });

      expect(result.isValid).toBe(true);
    });

    it("should reject invalid buy setup (SL above entry)", () => {
      const result = validateRiskRewardInput({
        entryPrice: 1.1,
        stopLossPrice: 1.105, // Above entry - invalid for buy
        takeProfitPrice: 1.12,
        direction: "buy",
        currencyPair: "EURUSD",
      });

      expect(result.isValid).toBe(false);
    });

    it("should reject invalid sell setup (SL below entry)", () => {
      const result = validateRiskRewardInput({
        entryPrice: 1.1,
        stopLossPrice: 1.095, // Below entry - invalid for sell
        takeProfitPrice: 1.08,
        direction: "sell",
        currencyPair: "EURUSD",
      });

      expect(result.isValid).toBe(false);
    });
  });

  describe("calculations", () => {
    it("should calculate correct R:R for buy trade", () => {
      // Entry: 1.1000
      // SL: 1.0950 (50 pips risk)
      // TP: 1.1150 (150 pips reward)
      // R:R = 150/50 = 3.0 (1:3)

      const result = calculateRiskReward({
        entryPrice: 1.1,
        stopLossPrice: 1.095,
        takeProfitPrice: 1.115,
        direction: "buy",
        currencyPair: "EURUSD",
      });

      expect(result.riskPips).toBe("50.0");
      expect(result.rewardPips).toBe("150.0");
      expect(result.riskRewardRatio).toBe("3.00");
      expect(result.ratioDisplay).toBe("1:3.00");
      expect(result.isValid).toBe(true);
    });

    it("should calculate correct R:R for sell trade", () => {
      // Entry: 1.1000
      // SL: 1.1030 (30 pips risk)
      // TP: 1.0940 (60 pips reward)
      // R:R = 60/30 = 2.0 (1:2)

      const result = calculateRiskReward({
        entryPrice: 1.1,
        stopLossPrice: 1.103,
        takeProfitPrice: 1.094,
        direction: "sell",
        currencyPair: "EURUSD",
      });

      expect(result.riskPips).toBe("30.0");
      expect(result.rewardPips).toBe("60.0");
      expect(result.riskRewardRatio).toBe("2.00");
    });

    it("should calculate monetary values when lot size provided", () => {
      const result = calculateRiskReward({
        entryPrice: 1.1,
        stopLossPrice: 1.095,
        takeProfitPrice: 1.11,
        direction: "buy",
        currencyPair: "EURUSD",
        lotSize: 1,
        accountCurrency: "USD",
        exchangeRate: 1.1,
      });

      // Risk: 50 pips * 10 USD/pip * 1 lot = 500 USD
      // Reward: 100 pips * 10 USD/pip * 1 lot = 1000 USD
      expect(result.riskAmount).toBe("500.00");
      expect(result.rewardAmount).toBe("1000.00");
    });
  });
});