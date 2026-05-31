// File: src/lib/engine/types.ts

/**
 * Trade direction: buy (long) or sell (short).
 */
export type TradeDirection = "buy" | "sell";

/**
 * Common input validation result.
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// ============================================================
// Position Size Calculator Types
// ============================================================

export interface PositionSizeInput {
  /** Account balance in account currency */
  accountBalance: string | number;
  /** Risk percentage (e.g., 1 for 1%, 2.5 for 2.5%) */
  riskPercent: string | number;
  /** Stop loss distance in pips */
  stopLossPips: string | number;
  /** Currency pair symbol (e.g., "EURUSD") */
  currencyPair: string;
  /** Account currency code (e.g., "USD") */
  accountCurrency: string;
  /**
   * Current exchange rate for the pair.
   * For pairs where quote = account currency, this is the pair price.
   * For conversion, we may need additional rates.
   */
  exchangeRate: string | number;
  /**
   * If quote currency differs from account currency,
   * provide the rate to convert quote to account currency.
   * E.g., for EURGBP with USD account, provide GBPUSD rate.
   */
  quoteToAccountRate?: string | number;
}

export interface PositionSizeResult {
  /** Position size in standard lots (1 lot = 100,000 units) */
  lots: string;
  /** Position size in mini lots (1 mini lot = 10,000 units) */
  miniLots: string;
  /** Position size in micro lots (1 micro lot = 1,000 units) */
  microLots: string;
  /** Position size in units */
  units: string;
  /** Monetary risk in account currency */
  riskAmount: string;
  /** Pip value in account currency (for 1 standard lot) */
  pipValue: string;
}

// ============================================================
// Pip Value Calculator Types
// ============================================================

export interface PipValueInput {
  /** Currency pair symbol */
  currencyPair: string;
  /** Position size in lots */
  lotSize: string | number;
  /** Account currency code */
  accountCurrency: string;
  /** Current exchange rate for the pair */
  exchangeRate: string | number;
  /** Rate to convert quote currency to account currency (if different) */
  quoteToAccountRate?: string | number;
}

export interface PipValueResult {
  /** Pip value in account currency */
  pipValue: string;
  /** Pip value per standard lot */
  pipValuePerLot: string;
  /** Total value of movement in account currency for given lot size */
  totalPipValue: string;
}

// ============================================================
// Margin Calculator Types
// ============================================================

export interface MarginInput {
  /** Currency pair symbol */
  currencyPair: string;
  /** Position size in lots */
  lotSize: string | number;
  /** Account leverage (e.g., 100 for 1:100) */
  leverage: string | number;
  /** Current exchange rate for the pair */
  exchangeRate: string | number;
  /** Account currency code */
  accountCurrency: string;
  /** Rate to convert base currency to account currency (if different) */
  baseToAccountRate?: string | number;
}

export interface MarginResult {
  /** Required margin in account currency */
  requiredMargin: string;
  /** Position value (notional) in account currency */
  positionValue: string;
  /** Effective leverage being used */
  effectiveLeverage: string;
}

// ============================================================
// Risk-Reward Calculator Types
// ============================================================

export interface RiskRewardInput {
  /** Entry price */
  entryPrice: string | number;
  /** Stop loss price */
  stopLossPrice: string | number;
  /** Take profit price */
  takeProfitPrice: string | number;
  /** Trade direction */
  direction: TradeDirection;
  /** Currency pair symbol */
  currencyPair: string;
  /** Position size in lots (optional, for monetary values) */
  lotSize?: string | number;
  /** Account currency (optional, for monetary values) */
  accountCurrency?: string;
  /** Exchange rate (optional, for monetary values) */
  exchangeRate?: string | number;
  /** Quote to account rate (optional) */
  quoteToAccountRate?: string | number;
}

export interface RiskRewardResult {
  /** Risk in pips */
  riskPips: string;
  /** Reward in pips */
  rewardPips: string;
  /** Risk-to-reward ratio (e.g., "2.5" means 1:2.5) */
  riskRewardRatio: string;
  /** Ratio formatted as "1:X" */
  ratioDisplay: string;
  /** Risk in account currency (if lot size provided) */
  riskAmount?: string;
  /** Reward in account currency (if lot size provided) */
  rewardAmount?: string;
  /** Is the trade direction valid (SL below entry for buy, above for sell) */
  isValid: boolean;
  /** Validation message if invalid */
  validationMessage?: string;
}

// ============================================================
// Break-Even Calculator Types
// ============================================================

export interface BreakEvenInput {
  /** Entry price */
  entryPrice: string | number;
  /** Trade direction */
  direction: TradeDirection;
  /** Spread in pips (optional) */
  spreadPips?: string | number;
  /** Commission per lot in account currency (optional) */
  commissionPerLot?: string | number;
  /** Position size in lots (needed if commission provided) */
  lotSize?: string | number;
  /** Currency pair symbol */
  currencyPair: string;
  /** Pip value in account currency (needed for commission conversion to pips) */
  pipValue?: string | number;
}

export interface BreakEvenResult {
  /** Break-even price */
  breakEvenPrice: string;
  /** Total cost in pips to reach break-even */
  breakEvenPips: string;
  /** Total cost in account currency */
  breakEvenCost?: string;
}

// ============================================================
// Profit/Loss Calculator Types
// ============================================================

export interface ProfitLossInput {
  /** Entry price */
  entryPrice: string | number;
  /** Exit price */
  exitPrice: string | number;
  /** Trade direction */
  direction: TradeDirection;
  /** Currency pair symbol */
  currencyPair: string;
  /** Position size in lots */
  lotSize: string | number;
  /** Account currency code */
  accountCurrency: string;
  /** Exchange rate at exit */
  exchangeRate: string | number;
  /** Quote to account rate (if different) */
  quoteToAccountRate?: string | number;
}

export interface ProfitLossResult {
  /** Profit/loss in pips (positive = profit, negative = loss) */
  pips: string;
  /** Profit/loss in account currency */
  profitLoss: string;
  /** Pip value used in calculation */
  pipValue: string;
  /** Was this trade profitable */
  isProfit: boolean;
  /** Percentage return based on position value */
  percentageReturn: string;
}