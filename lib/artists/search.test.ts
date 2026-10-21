import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const SEARCH_RESPONSE = {
  artists: [
    { id: "mb-1", name: "haloplus+", score: 100, disambiguation: "hyperpop producer", tags: [] },
    { id: "mb-2", name: "Halo Plus", score: 61, tags: [] },
    { id: "mb-3", name: "Halo", score: 28, tags: [] },
  ],
};

const ITUNES_RESPONSE = {
  results: [
    {
      artistName: "haloplus+",
      artworkUrl100: "https://is1-ssl.mzstatic.com/image/a/100x100bb.jpg",
    },
  ],
};

describe("searchWithArtwork", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns results for a query", async () => {
    const calls: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        calls.push(String(url));
        const body = String(url).includes("musicbrainz") ? SEARCH_RESPONSE : ITUNES_RESPONSE;
        return new Response(JSON.stringify(body), { status: 200 });
      })
    );

    const { searchWithArtwork } = await import("./index");
    const results = await searchWithArtwork("haloplus");

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].name).toBe("haloplus+");
    expect(calls.some((c) => c.includes("musicbrainz"))).toBe(true);
  });

  it("suppresses artwork when two results normalise to the same name", async () => {
    // "haloplus+" and "Halo Plus" both reduce to "haloplus", so neither can be matched to
    // cover art with any confidence.
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        const body = String(url).includes("musicbrainz") ? SEARCH_RESPONSE : ITUNES_RESPONSE;
        return new Response(JSON.stringify(body), { status: 200 });
      })
    );

    const { searchWithArtwork } = await import("./index");
    const results = await searchWithArtwork("haloplus");
    expect(results.every((r) => r.imageUrl === null)).toBe(true);
  });

  it("does attach artwork when a name is unambiguous", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        const body = String(url).includes("musicbrainz")
          ? { artists: [{ id: "mb-1", name: "haloplus+", score: 100, tags: [] }] }
          : ITUNES_RESPONSE;
        return new Response(JSON.stringify(body), { status: 200 });
      })
    );

    const { searchWithArtwork } = await import("./index");
    const results = await searchWithArtwork("haloplus");
    expect(results[0].imageUrl).toMatch(/600x600bb\.jpg$/);
  });

  it("still returns the artists when artwork lookups fail", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (String(url).includes("musicbrainz")) {
          return new Response(JSON.stringify(SEARCH_RESPONSE), { status: 200 });
        }
        throw new Error("iTunes unreachable");
      })
    );

    const { searchWithArtwork } = await import("./index");
    const results = await searchWithArtwork("haloplus");

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].imageUrl).toBeNull();
  });

  it("doesn't let the score filter wipe out every result", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({ artists: [{ id: "a", name: "Obscure", score: 12, tags: [] }] }),
            { status: 200 }
          )
      )
    );

    const { searchWithArtwork } = await import("./index");
    expect(await searchWithArtwork("obscure")).toHaveLength(1);
  });
});
