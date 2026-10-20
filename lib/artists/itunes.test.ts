import { describe, expect, it } from "vitest";
import { namesMatch, parseArtwork, upscale } from "./itunes";

const RESPONSE = {
  resultCount: 2,
  results: [
    {
      wrapperType: "collection",
      artistName: "Mike",
      collectionName: "Burning Desire",
      artworkUrl100:
        "https://is1-ssl.mzstatic.com/image/thumb/Music/v4/ab/cd/ef/abcdef.jpg/100x100bb.jpg",
    },
    {
      wrapperType: "collection",
      artistName: "Michael Bolton",
      collectionName: "Greatest Hits",
      artworkUrl100:
        "https://is1-ssl.mzstatic.com/image/thumb/Music/v4/11/22/33/112233.jpg/100x100bb.jpg",
    },
  ],
};

describe("upscale", () => {
  it("asks iTunes for a usable size instead of a thumbnail", () => {
    expect(upscale(RESPONSE.results[0].artworkUrl100)).toMatch(/600x600bb\.jpg$/);
    expect(upscale("https://example.com/a/300x300bb.png", 1200)).toMatch(/1200x1200bb\.png$/);
  });

  it("leaves a URL it doesn't recognise alone", () => {
    expect(upscale("https://example.com/cover.jpg")).toBe("https://example.com/cover.jpg");
  });
});

describe("namesMatch", () => {
  it("ignores case, punctuation and accents", () => {
    expect(namesMatch("MIKE", "Mike")).toBe(true);
    expect(namesMatch("Fontaines D.C.", "Fontaines DC")).toBe(true);
    expect(namesMatch("Sigur Rós", "Sigur Ros")).toBe(true);
  });

  it("rejects anyone who isn't exactly the artist asked for", () => {
    expect(namesMatch("Michael Bolton", "Mike")).toBe(false);
    // A tribute act's cover art on someone's permanent card would be worse than no art.
    expect(namesMatch("Wet Leg Tribute Band", "Wet Leg")).toBe(false);
    expect(namesMatch("", "Mike")).toBe(false);
  });
});

describe("parseArtwork", () => {
  it("returns artwork for the artist asked for", () => {
    expect(parseArtwork(RESPONSE, "MIKE")).toMatch(/abcdef\.jpg\/600x600bb\.jpg$/);
  });

  it("skips results belonging to a different artist", () => {
    // Nothing in the payload is Wet Leg, so better no image than the wrong one.
    expect(parseArtwork(RESPONSE, "Wet Leg")).toBeNull();
  });

  it("survives malformed payloads", () => {
    expect(parseArtwork({}, "MIKE")).toBeNull();
    expect(parseArtwork(null, "MIKE")).toBeNull();
    expect(parseArtwork({ results: [{ artistName: "MIKE" }] }, "MIKE")).toBeNull();
  });
});
