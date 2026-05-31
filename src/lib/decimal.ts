// File: src/lib/decimal.ts
import Decimal from "decimal.js-light";

/**
 * Configure Decimal.js-light for forex calculations.
 * - precision: 20 significant digits (more than enough for forex)
 * - rounding: ROUND_HALF_UP (standard financial rounding)
 */
Decimal.set({
  precision: 20,
  rounding: Decimal.ROUND_HALF_UP,
});

/**
 * Type representing values that can be converted to Decimal.
 * Accepts numbers, strings, or existing Decimal instances.
 */
export type DecimalInput = string | number | Decimal;

/**
 * Creates a new Decimal instance from various input types.
 * Using strings for initialization is preferred for maximum precision.
 */
export function toDecimal(value: DecimalInput): Decimal {
  if (value instanceof Decimal) {
    return value;
  }
  return new Decimal(value);
}

/**
 * Adds two decimal values.
 */
export function add(a: DecimalInput, b: DecimalInput): Decimal {
  return toDecimal(a).plus(toDecimal(b));
}

/**
 * Subtracts b from a.
 */
export function subtract(a: DecimalInput, b: DecimalInput): Decimal {
  return toDecimal(a).minus(toDecimal(b));
}

/**
 * Multiplies two decimal values.
 */
export function multiply(a: DecimalInput, b: DecimalInput): Decimal {
  return toDecimal(a).times(toDecimal(b));
}

/**
 * Divides a by b.
 * Returns Decimal(0) if b is zero to avoid exceptions.
 */
export function divide(a: DecimalInput, b: DecimalInput): Decimal {
  const divisor = toDecimal(b);
  if (divisor.isZero()) {
    return new Decimal(0);
  }
  return toDecimal(a).dividedBy(divisor);
}

/**
 * Returns the absolute value.
 */
export function abs(value: DecimalInput): Decimal {
  return toDecimal(value).abs();
}

/**
 * Rounds a decimal to specified decimal places.
 * Uses ROUND_HALF_UP by default (standard financial rounding).
 */
export function round(
  value: DecimalInput,
  decimalPlaces: number,
  roundingMode: Decimal.Rounding = Decimal.ROUND_HALF_UP
): Decimal {
  return toDecimal(value).toDecimalPlaces(decimalPlaces, roundingMode);
}

/**
 * Converts a Decimal to a JavaScript number.
 * Use this only at the final display layer, never for intermediate calculations.
 */
export function toNumber(value: DecimalInput): number {
  return toDecimal(value).toNumber();
}

/**
 * Converts a Decimal to a string with fixed decimal places.
 * Useful for display formatting.
 */
export function toFixed(value: DecimalInput, decimalPlaces: number): string {
  return toDecimal(value).toFixed(decimalPlaces);
}

/**
 * Checks if a value is greater than another.
 */
export function isGreaterThan(a: DecimalInput, b: DecimalInput): boolean {
  return toDecimal(a).greaterThan(toDecimal(b));
}

/**
 * Checks if a value is less than another.
 */
export function isLessThan(a: DecimalInput, b: DecimalInput): boolean {
  return toDecimal(a).lessThan(toDecimal(b));
}

/**
 * Checks if a value is zero.
 */
export function isZero(value: DecimalInput): boolean {
  return toDecimal(value).isZero();
}

/**
 * Checks if a value is positive (greater than zero).
 */
export function isPositive(value: DecimalInput): boolean {
  return toDecimal(value).isPositive() && !toDecimal(value).isZero();
}

/**
 * Checks if a value is negative.
 */
export function isNegative(value: DecimalInput): boolean {
  return toDecimal(value).isNegative();
}

/**
 * Returns the minimum of two values.
 */
export function min(a: DecimalInput, b: DecimalInput): Decimal {
  const decA = toDecimal(a);
  const decB = toDecimal(b);
  return decA.lessThan(decB) ? decA : decB;
}

/**
 * Returns the maximum of two values.
 */
export function max(a: DecimalInput, b: DecimalInput): Decimal {
  const decA = toDecimal(a);
  const decB = toDecimal(b);
  return decA.greaterThan(decB) ? decA : decB;
}

/**
 * Calculates percentage: (value * percent) / 100
 */
export function percentage(value: DecimalInput, percent: DecimalInput): Decimal {
  return divide(multiply(value, percent), 100);
}

// Re-export Decimal class for advanced usage
export { Decimal };