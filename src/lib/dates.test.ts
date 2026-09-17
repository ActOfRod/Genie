import { describe, expect, it } from "vitest";
import { inDateFilter } from "./dates";

describe("inDateFilter", () => {
  const asOf = new Date("2026-09-17T12:00:00");

  it("keeps every date when the filter is all", () => {
    expect(inDateFilter("2024-01-01", "all", asOf)).toBe(true);
  });

  it("limits to the current month", () => {
    expect(inDateFilter("2026-09-02", "month", asOf)).toBe(true);
    expect(inDateFilter("2026-08-31", "month", asOf)).toBe(false);
  });

  it("limits to the last three months", () => {
    expect(inDateFilter("2026-06-17", "three-months", asOf)).toBe(true);
    expect(inDateFilter("2026-06-16", "three-months", asOf)).toBe(false);
  });

  it("limits to the calendar year", () => {
    expect(inDateFilter("2026-01-01", "year", asOf)).toBe(true);
    expect(inDateFilter("2025-12-31", "year", asOf)).toBe(false);
  });
});
