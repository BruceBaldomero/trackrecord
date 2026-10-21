import { describe, expect, it } from "vitest";
import { findMonthlyListeners } from "./songstats";

// Songstats' exact response shape is unverified (their docs aren't reachable from the
// build environment), so the parser hunts for the figure rather than assuming one path.
// These cover the shapes their API plausibly returns.
describe("findMonthlyListeners", () => {
  it("finds a figure nested under a stats array", () => {
    const payload = {
      result: "success",
      stats: [
        {
          source: "spotify",
          data: { monthly_listeners_current: 1_412_000, followers_total: 98_000 },
        },
      ],
    };
    expect(findMonthlyListeners(payload)).toBe(1_412_000);
  });

  it("finds a flat figure", () => {
    expect(findMonthlyListeners({ monthlyListeners: 42_100 })).toBe(42_100);
  });

  it("finds one buried several levels down", () => {
    const payload = { data: { artist: { spotify: { stats: { monthly_listeners: 7 } } } } };
    expect(findMonthlyListeners(payload)).toBe(7);
  });

  it("prefers the current reading when several are present", () => {
    const payload = {
      data: {
        monthly_listeners_peak: 9_000_000,
        monthly_listeners_current: 1_412_000,
      },
    };
    expect(findMonthlyListeners(payload)).toBe(1_412_000);
  });

  it("ignores fields that merely sound similar", () => {
    expect(findMonthlyListeners({ listeners_weekly: 50, followers: 10 })).toBeNull();
  });

  it("returns null rather than guessing when there's nothing to find", () => {
    expect(findMonthlyListeners({})).toBeNull();
    expect(findMonthlyListeners(null)).toBeNull();
    expect(findMonthlyListeners({ result: "error", message: "not found" })).toBeNull();
  });

  it("survives a payload that references itself", () => {
    const cyclic: Record<string, unknown> = { data: {} };
    (cyclic.data as Record<string, unknown>).back = cyclic;
    expect(() => findMonthlyListeners(cyclic)).not.toThrow();
  });
});
