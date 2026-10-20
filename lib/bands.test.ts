import { describe, expect, it } from "vitest";
import {
  BANDS,
  TIER_LABEL,
  bandFor,
  formatDate,
  formatGrowth,
  formatListeners,
  formatMonthYear,
  growthPct,
  parseDay,
  tierFor,
  toISODay,
  todayISO,
} from "./bands";

describe("band table", () => {
  it("is contiguous, so no listener count falls between two bands", () => {
    for (let i = 0; i < BANDS.length - 1; i++) {
      expect(BANDS[i].max).toBe(BANDS[i + 1].min);
    }
    expect(BANDS[0].min).toBe(0);
    expect(BANDS[BANDS.length - 1].max).toBeNull();
  });

  it("is numbered 1 to 5", () => {
    expect(BANDS.map((b) => b.id)).toEqual([1, 2, 3, 4, 5]);
  });
});

describe("bandFor", () => {
  // Boundaries are the whole game: one listener either side decides whether
  // somebody's card upgrades, and these thresholds are frozen once live.
  it.each([
    [0, 1],
    [99_999, 1],
    [100_000, 2],
    [499_999, 2],
    [500_000, 3],
    [1_999_999, 3],
    [2_000_000, 4],
    [9_999_999, 4],
    [10_000_000, 5],
    [250_000_000, 5],
  ])("puts %i listeners in band %i", (listeners, expected) => {
    expect(bandFor(listeners).id).toBe(expected);
  });
});

describe("tierFor", () => {
  it.each([
    [-1, "none"],
    [0, "none"],
    [1, "bronze"],
    [2, "silver"],
    [3, "gold"],
    [4, "diamond"],
  ])("maps %i bands gained to %s", (gained, expected) => {
    expect(tierFor(gained)).toBe(expected);
  });

  it("clamps above +4 rather than falling off the end of the tier list", () => {
    expect(tierFor(5)).toBe("diamond");
    expect(tierFor(99)).toBe("diamond");
  });

  it("names every tier", () => {
    expect(Object.keys(TIER_LABEL)).toEqual([
      "none",
      "bronze",
      "silver",
      "gold",
      "diamond",
    ]);
  });

  it("makes underground-to-superstar a diamond", () => {
    const gained = bandFor(42_100_000).id - bandFor(22_000).id;
    expect(tierFor(gained)).toBe("diamond");
  });
});

describe("formatListeners", () => {
  it.each([
    [0, "0"],
    [999, "999"],
    [1_000, "1k"],
    [1_500, "1.5k"],
    [48_000, "48k"],
    [412_000, "412k"],
    [1_000_000, "1m"],
    [1_410_000, "1.4m"],
    [10_000_000, "10m"],
    [42_100_000, "42m"],
  ])("renders %i as %s", (n, expected) => {
    expect(formatListeners(n)).toBe(expected);
  });

  it("rounds 99,999 up to 100k for display while leaving it in band 1", () => {
    expect(formatListeners(99_999)).toBe("100k");
    expect(bandFor(99_999).id).toBe(1);
  });
});

describe("formatGrowth", () => {
  it("shows a percentage below 10x", () => {
    expect(formatGrowth(100, 200)).toBe("+100%");
    expect(formatGrowth(100, 999)).toBe("+899%");
  });

  it("switches to a multiplier at 10x and above", () => {
    expect(formatGrowth(100, 1_000)).toBe("×10");
    expect(formatGrowth(22_000, 42_100_000)).toMatch(/^×1[,.]?914$/);
  });

  it("handles no movement and decline", () => {
    expect(formatGrowth(100, 100)).toBe("+0%");
    expect(formatGrowth(100, 50)).toBe("-50%");
  });

  it("refuses to divide by a zero baseline", () => {
    expect(formatGrowth(0, 5_000)).toBe("—");
    expect(growthPct(0, 5_000)).toBe(0);
  });
});

describe("calendar days", () => {
  it("runs the suite outside UTC, so the regression below can actually fail", () => {
    expect(new Date().getTimezoneOffset()).not.toBe(0);
  });

  // Regression: formatDate used `new Date("2020-03-14")`, which parses as UTC
  // midnight and renders as the 13th anywhere west of UTC.
  it("parses a date string as a local day, not a UTC instant", () => {
    const day = parseDay("2020-03-14");
    expect(day.getFullYear()).toBe(2020);
    expect(day.getMonth()).toBe(2);
    expect(day.getDate()).toBe(14);
    expect(new Date("2020-03-14").getDate()).not.toBe(14);
  });

  it("formats backing dates as the day that was actually stored", () => {
    expect(formatDate("2020-03-14")).toBe("14 Mar 2020");
    expect(formatDate("2026-01-01")).toBe("1 Jan 2026");
    expect(formatMonthYear("2020-03-14")).toBe("March 2020");
  });

  it("round-trips a day through toISODay", () => {
    for (const iso of ["2020-03-14", "2026-01-01", "2024-12-31"]) {
      expect(toISODay(parseDay(iso))).toBe(iso);
    }
  });

  it("pads single-digit months and days", () => {
    expect(toISODay(new Date(2026, 0, 5))).toBe("2026-01-05");
  });

  it("stamps new backings with the local date", () => {
    const now = new Date();
    expect(todayISO()).toBe(toISODay(now));
    expect(todayISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
