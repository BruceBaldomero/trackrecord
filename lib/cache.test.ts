import { describe, expect, it, vi } from "vitest";
import { TtlCache } from "./cache";

describe("TtlCache", () => {
  it("serves a cached value without calling the loader again", async () => {
    const cache = new TtlCache<number>(1000);
    const load = vi.fn().mockResolvedValue(42);

    expect(await cache.wrap("k", load)).toBe(42);
    expect(await cache.wrap("k", load)).toBe(42);
    expect(load).toHaveBeenCalledTimes(1);
  });

  it("shares one in-flight request between simultaneous callers", async () => {
    // Four keystrokes landing on the same query should cost one upstream request, not four.
    const cache = new TtlCache<string>(1000);
    const load = vi.fn(
      () => new Promise<string>((resolve) => setTimeout(() => resolve("done"), 20))
    );

    const all = await Promise.all([
      cache.wrap("k", load),
      cache.wrap("k", load),
      cache.wrap("k", load),
      cache.wrap("k", load),
    ]);

    expect(all).toEqual(["done", "done", "done", "done"]);
    expect(load).toHaveBeenCalledTimes(1);
  });

  it("reloads once the entry has expired", async () => {
    const cache = new TtlCache<number>(5);
    const load = vi.fn().mockResolvedValue(1);

    await cache.wrap("k", load);
    await new Promise((r) => setTimeout(r, 15));
    await cache.wrap("k", load);

    expect(load).toHaveBeenCalledTimes(2);
  });

  it("doesn't cache a failure", async () => {
    const cache = new TtlCache<number>(1000);
    const load = vi.fn().mockRejectedValueOnce(new Error("upstream down")).mockResolvedValue(7);

    await expect(cache.wrap("k", load)).rejects.toThrow("upstream down");
    expect(await cache.wrap("k", load)).toBe(7);
  });

  it("evicts the least recently used entry when full", async () => {
    const cache = new TtlCache<number>(1000, 2);
    await cache.wrap("a", async () => 1);
    await cache.wrap("b", async () => 2);
    cache.get("a"); // touch a, so b becomes the coldest
    await cache.wrap("c", async () => 3);

    expect(cache.get("a")).toBe(1);
    expect(cache.get("b")).toBeUndefined();
    expect(cache.get("c")).toBe(3);
  });
});
