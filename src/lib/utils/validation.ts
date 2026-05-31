// File: src/lib/utils/validation.ts

/**
 * Validation result type.
 */
export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates that a value is a positive number.
 */
export function validatePositiveNumber(
  value: string | number,
  fieldName: string = "Value"
): ValidationResult {
  const num = typeof value === "string" ? parseFloat(value) : value;

  if (isNaN(num)) {
    return { isValid: false, error: `${fieldName} must be a valid number` };
  }

  if (num <= 0) {
    return { isValid: false, error: `${fieldName} must be greater than zero` };
  }

  return { isValid: true };
}

/**
 * Validates that a value is a non-negative number.
 */
export function validateNonNegativeNumber(
  value: string | number,
  fieldName: string = "Value"
): ValidationResult {
  const num = typeof value === "string" ? parseFloat(value) : value;

  if (isNaN(num)) {
    return { isValid: false, error: `${fieldName} must be a valid number` };
  }

  if (num < 0) {
    return { isValid: false, error: `${fieldName} cannot be negative` };
  }

  return { isValid: true };
}

/**
 * Validates that a value is within a range.
 */
export function validateRange(
  value: string | number,
  min: number,
  max: number,
  fieldName: string = "Value"
): ValidationResult {
  const num = typeof value === "string" ? parseFloat(value) : value;

  if (isNaN(num)) {
    return { isValid: false, error: `${fieldName} must be a valid number` };
  }

  if (num < min || num > max) {
    return {
      isValid: false,
      error: `${fieldName} must be between ${min} and ${max}`,
    };
  }

  return { isValid: true };
}

/**
 * Validates a percentage value (0-100).
 */
export function validatePercentage(
  value: string | number,
  fieldName: string = "Percentage"
): ValidationResult {
  return validateRange(value, 0, 100, fieldName);
}

/**
 * Validates an email address.
 */
export function validateEmail(email: string): ValidationResult {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email || !email.trim()) {
    return { isValid: false, error: "Email is required" };
  }

  if (!emailRegex.test(email)) {
    return { isValid: false, error: "Please enter a valid email address" };
  }

  return { isValid: true };
}

/**
 * Validates a password meets requirements.
 */
export function validatePassword(
  password: string,
  minLength: number = 6
): ValidationResult {
  if (!password) {
    return { isValid: false, error: "Password is required" };
  }

  if (password.length < minLength) {
    return {
      isValid: false,
      error: `Password must be at least ${minLength} characters`,
    };
  }

  return { isValid: true };
}

/**
 * Validates that a required field is not empty.
 */
export function validateRequired(
  value: string | undefined | null,
  fieldName: string = "Field"
): ValidationResult {
  if (value === undefined || value === null || value.trim() === "") {
    return { isValid: false, error: `${fieldName} is required` };
  }

  return { isValid: true };
}

/**
 * Validates a currency pair symbol.
 */
export function validateCurrencyPair(symbol: string): ValidationResult {
  if (!symbol || symbol.length !== 6) {
    return { isValid: false, error: "Invalid currency pair format" };
  }

  const base = symbol.slice(0, 3).toUpperCase();
  const quote = symbol.slice(3, 6).toUpperCase();

  if (!/^[A-Z]{3}$/.test(base) || !/^[A-Z]{3}$/.test(quote)) {
    return { isValid: false, error: "Invalid currency pair format" };
  }

  return { isValid: true };
}

/**
 * Combines multiple validation results.
 */
export function combineValidations(
  ...results: ValidationResult[]
): ValidationResult {
  for (const result of results) {
    if (!result.isValid) {
      return result;
    }
  }
  return { isValid: true };
}

/**
 * Validates an object with multiple fields.
 */
export function validateFields<T extends Record<string, unknown>>(
  data: T,
  validators: Partial<Record<keyof T, (value: any) => ValidationResult>>
): { isValid: boolean; errors: Partial<Record<keyof T, string>> } {
  const errors: Partial<Record<keyof T, string>> = {};
  let isValid = true;

  for (const [field, validator] of Object.entries(validators)) {
    if (validator) {
      const result = validator(data[field as keyof T]);
      if (!result.isValid) {
        errors[field as keyof T] = result.error;
        isValid = false;
      }
    }
  }

  return { isValid, errors };
}