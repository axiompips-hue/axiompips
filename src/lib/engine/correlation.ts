// File: src/lib/engine/correlation.ts
import {
  add,
  subtract,
  multiply,
  toDecimal,
  toFixed,
  round,
  abs,
  isPositive,
  isNegative,
  Decimal,
} from "@/lib/decimal";
import { getPair, ALL_PAIRS } from "@/lib/forex/pairs";
import { TradeDirection } from "./types";

/**
 * Static correlation matrix for major currency pairs.
 *
 * Values range from -1 (perfect negative correlation) to +1 (perfect positive correlation).
 * These are approximate historical correlations and should be treated as estimates.
 *
 * Data source: Typical 6-month rolling correlations (approximate values).
 * Note: Correlations change over time based on market conditions.
 */
export const CORRELATION_MATRIX: Record<string, Record<string, number>> = {
  EURUSD: {
    EURUSD: 1.0,
    GBPUSD: 0.85,
    AUDUSD: 0.75,
    NZDUSD: 0.70,
    USDCHF: -0.90,
    USDJPY: -0.30,
    USDCAD: -0.65,
    EURGBP: 0.40,
    EURJPY: 0.60,
    GBPJPY: 0.50,
  },
  GBPUSD: {
    EURUSD: 0.85,
    GBPUSD: 1.0,
    AUDUSD: 0.70,
    NZDUSD: 0.65,
    USDCHF: -0.80,
    USDJPY: -0.25,
    USDCAD: -0.60,
    EURGBP: -0.45,
    EURJPY: 0.50,
    GBPJPY: 0.65,
  },
  AUDUSD: {
    EURUSD: 0.75,
    GBPUSD: 0.70,
    AUDUSD: 1.0,
    NZDUSD: 0.90,
    USDCHF: -0.70,
    USDJPY: -0.20,
    USDCAD: -0.75,
    EURGBP: 0.30,
    EURJPY: 0.55,
    GBPJPY: 0.50,
  },
  NZDUSD: {
    EURUSD: 0.70,
    GBPUSD: 0.65,
    AUDUSD: 0.90,
    NZDUSD: 1.0,
    USDCHF: -0.65,
    USDJPY: -0.20,
    USDCAD: -0.70,
    EURGBP: 0.25,
    EURJPY: 0.50,
    GBPJPY: 0.45,
  },
  USDCHF: {
    EURUSD: -0.90,
    GBPUSD: -0.80,
    AUDUSD: -0.70,
    NZDUSD: -0.65,
    USDCHF: 1.0,
    USDJPY: 0.40,
    USDCAD: 0.55,
    EURGBP: -0.30,
    EURJPY: -0.50,
    GBPJPY: -0.40,
  },
  USDJPY: {
    EURUSD: -0.30,
    GBPUSD: -0.25,
    AUDUSD: -0.20,
    NZDUSD: -0.20,
    USDCHF: 0.40,
    USDJPY: 1.0,
    USDCAD: 0.30,
    EURGBP: -0.10,
    EURJPY: 0.60,
    GBPJPY: 0.70,
  },
  USDCAD: {
    EURUSD: -0.65,
    GBPUSD: -0.60,
    AUDUSD: -0.75,
    NZDUSD: -0.70,
    USDCHF: 0.55,
    USDJPY: 0.30,
    USDCAD: 1.0,
    EURGBP: -0.25,
    EURJPY: -0.35,
    GBPJPY: -0.30,
  },
  EURGBP: {
    EURUSD: 0.40,
    GBPUSD: -0.45,
    AUDUSD: 0.30,
    NZDUSD: 0.25,
    USDCHF: -0.30,
    USDJPY: -0.10,
    USDCAD: -0.25,
    EURGBP: 1.0,
    EURJPY: 0.35,
    GBPJPY: -0.10,
  },
  EURJPY: {
    EURUSD: 0.60,
    GBPUSD: 0.50,
    AUDUSD: 0.55,
    NZDUSD: 0.50,
    USDCHF: -0.50,
    USDJPY: 0.60,
    USDCAD: -0.35,
    EURGBP: 0.35,
    EURJPY: 1.0,
    GBPJPY: 0.90,
  },
  GBPJPY: {
    EURUSD: 0.50,
    GBPUSD: 0.65,
    AUDUSD: 0.50,
    NZDUSD: 0.45,
    USDCHF: -0.40,
    USDJPY: 0.70,
    USDCAD: -0.30,
    EURGBP: -0.10,
    EURJPY: 0.90,
    GBPJPY: 1.0,
  },
};

/**
 * Gets correlation between two currency pairs.
 */
export function getCorrelation(pair1: string, pair2: string): number {
  const p1 = pair1.toUpperCase();
  const p2 = pair2.toUpperCase();

  if (CORRELATION_MATRIX[p1]?.[p2] !== undefined) {
    return CORRELATION_MATRIX[p1][p2];
  }
  if (CORRELATION_MATRIX[p2]?.[p1] !== undefined) {
    return CORRELATION_MATRIX[p2][p1];
  }

  // Default to 0 if not in matrix
  return 0;
}

/**
 * Trade for exposure calculation.
 */
export interface ExposureTrade {
  id: string;
  currencyPair: string;
  direction: TradeDirection;
  lotSize: string | number;
}

/**
 * Currency exposure details.
 */
export interface CurrencyExposure {
  currency: string;
  longLots: string;
  shortLots: string;
  netLots: string;
  netDirection: "long" | "short" | "neutral";
  exposureLevel: "low" | "medium" | "high";
}

/**
 * Pair correlation detail.
 */
export interface PairCorrelation {
  pair1: string;
  pair2: string;
  correlation: number;
  correlationLevel: "strong_positive" | "moderate_positive" | "weak" | "moderate_negative" | "strong_negative";
  warning: string | null;
}

/**
 * Correlation analysis result.
 */
export interface CorrelationAnalysisResult {
  currencyExposures: CurrencyExposure[];
  pairCorrelations: PairCorrelation[];
  warnings: string[];
  highlyCorrelatedPairs: string[][];
  totalLongExposure: string;
  totalShortExposure: string;
}

/**
 * Analyzes currency exposure and correlation for a set of trades.
 *
 * For each trade:
 * - Buy EURUSD = Long EUR, Short USD
 * - Sell EURUSD = Short EUR, Long USD
 *
 * @param trades - List of trades to analyze
 * @returns Correlation and exposure analysis
 */
export function analyzeCorrelation(
  trades: ExposureTrade[]
): CorrelationAnalysisResult {
  // Track exposure per currency
  const exposures: Record<string, { long: Decimal; short: Decimal }> = {};
  const pairsInPortfolio: string[] = [];

  // Process each trade
  for (const trade of trades) {
    const pair = getPair(trade.currencyPair);
    if (!pair) continue;

    const lotSize = toDecimal(trade.lotSize);
    const { base, quote } = pair;

    if (!pairsInPortfolio.includes(trade.currencyPair)) {
      pairsInPortfolio.push(trade.currencyPair);
    }

    // Initialize currencies if not exist
    if (!exposures[base]) {
      exposures[base] = { long: toDecimal(0), short: toDecimal(0) };
    }
    if (!exposures[quote]) {
      exposures[quote] = { long: toDecimal(0), short: toDecimal(0) };
    }

    // Apply exposure based on direction
    if (trade.direction === "buy") {
      // Buy = Long base, Short quote
      exposures[base].long = add(exposures[base].long, lotSize);
      exposures[quote].short = add(exposures[quote].short, lotSize);
    } else {
      // Sell = Short base, Long quote
      exposures[base].short = add(exposures[base].short, lotSize);
      exposures[quote].long = add(exposures[quote].long, lotSize);
    }
  }

  // Calculate currency exposures
  const currencyExposures: CurrencyExposure[] = [];
  let totalLong = toDecimal(0);
  let totalShort = toDecimal(0);

  for (const [currency, exposure] of Object.entries(exposures)) {
    const netLots = subtract(exposure.long, exposure.short);
    const absNet = abs(netLots);

    totalLong = add(totalLong, exposure.long);
    totalShort = add(totalShort, exposure.short);

    let netDirection: "long" | "short" | "neutral" = "neutral";
    if (isPositive(netLots)) {
      netDirection = "long";
    } else if (isNegative(netLots)) {
      netDirection = "short";
    }

    // Determine exposure level
    let exposureLevel: "low" | "medium" | "high" = "low";
    if (absNet.greaterThan(2)) {
      exposureLevel = "high";
    } else if (absNet.greaterThan(1)) {
      exposureLevel = "medium";
    }

    currencyExposures.push({
      currency,
      longLots: toFixed(round(exposure.long, 2), 2),
      shortLots: toFixed(round(exposure.short, 2), 2),
      netLots: toFixed(round(netLots, 2), 2),
      netDirection,
      exposureLevel,
    });
  }

  // Sort by absolute net exposure (highest first)
  currencyExposures.sort((a, b) => {
    return Math.abs(parseFloat(b.netLots)) - Math.abs(parseFloat(a.netLots));
  });

  // Analyze pair correlations
  const pairCorrelations: PairCorrelation[] = [];
  const highlyCorrelatedPairs: string[][] = [];
  const warnings: string[] = [];

  for (let i = 0; i < pairsInPortfolio.length; i++) {
    for (let j = i + 1; j < pairsInPortfolio.length; j++) {
      const pair1 = pairsInPortfolio[i];
      const pair2 = pairsInPortfolio[j];
      const correlation = getCorrelation(pair1, pair2);
      const absCorr = Math.abs(correlation);

      let correlationLevel: PairCorrelation["correlationLevel"] = "weak";
      let warning: string | null = null;

      if (correlation >= 0.7) {
        correlationLevel = "strong_positive";
        warning = `${pair1} and ${pair2} are highly correlated (+${correlation.toFixed(2)}). Consider reducing position size.`;
        highlyCorrelatedPairs.push([pair1, pair2]);
      } else if (correlation >= 0.4) {
        correlationLevel = "moderate_positive";
      } else if (correlation <= -0.7) {
        correlationLevel = "strong_negative";
        warning = `${pair1} and ${pair2} are inversely correlated (${correlation.toFixed(2)}). Positions may hedge each other.`;
      } else if (correlation <= -0.4) {
        correlationLevel = "moderate_negative";
      }

      if (warning) {
        warnings.push(warning);
      }

      pairCorrelations.push({
        pair1,
        pair2,
        correlation,
        correlationLevel,
        warning,
      });
    }
  }

  // Sort correlations by absolute value (highest first)
  pairCorrelations.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));

  // Add warnings for high currency exposure
  for (const exposure of currencyExposures) {
    if (exposure.exposureLevel === "high") {
      warnings.push(
        `High ${exposure.netDirection} exposure to ${exposure.currency} (${exposure.netLots} lots net)`
      );
    }
  }

  return {
    currencyExposures,
    pairCorrelations,
    warnings,
    highlyCorrelatedPairs,
    totalLongExposure: toFixed(round(totalLong, 2), 2),
    totalShortExposure: toFixed(round(totalShort, 2), 2),
  };
}