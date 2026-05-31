// File: tests/engine/sample.test.ts
import { describe, it, expect } from "vitest";

describe("Sample Test Suite", () => {
  it("should perform basic arithmetic correctly", () => {
    expect(1 + 1).toBe(2);
  });

  it("should handle string operations", () => {
    const appName = "AxiomPips";
    expect(appName.toLowerCase()).toBe("axiompips");
  });

  it("should verify decimal.js-light is importable", async () => {
    const Decimal = (await import("decimal.js-light")).default;
    const result = new Decimal("0.1").plus("0.2");
    expect(result.toString()).toBe("0.3");
  });
});