// File: src/lib/engine/index.ts
/**
 * AxiomPips Core Calculation Engine
 *
 * This module exports all forex calculation functions.
 * All functions are pure (no side effects) and use decimal arithmetic
 * for precision.
 */

// Types
export * from "./types";

// Core Calculators
export {
  calculatePositionSize,
  validatePositionSizeInput,
} from "./positionSize";

export {
  calculatePipValue,
  getPipValuePerLot,
} from "./pipValue";

export {
  calculateMargin,
  validateMarginInput,
} from "./margin";

export {
  calculateRiskReward,
  validateRiskRewardInput,
} from "./riskReward";

export {
  calculateBreakEven,
  validateBreakEvenInput,
} from "./breakEven";

export {
  calculateProfitLoss,
  validateProfitLossInput,
} from "./profitLoss";

// Advanced Tools
export {
  calculatePortfolioRisk,
  type PortfolioTrade,
  type PortfolioRiskInput,
  type TradeRiskDetail,
  type PortfolioRiskResult,
} from "./portfolio";

export {
  analyzeCorrelation,
  getCorrelation,
  CORRELATION_MATRIX,
  type ExposureTrade,
  type CurrencyExposure,
  type PairCorrelation,
  type CorrelationAnalysisResult,
} from "./correlation";

export {
  calculateCompounding,
  calculateExpectedValue,
  type CompoundingInput,
  type ProjectedTrade,
  type CompoundingResult,
} from "./compounding";