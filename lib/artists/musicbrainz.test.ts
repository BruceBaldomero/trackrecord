import { describe, expect, it } from "vitest";
import { parseSearchResponse, userAgent } from "./musicbrainz";

// Shaped on a real MusicBrainz /ws/2/artist?query=… response.
const RESPONSE = {
  created: "2026-10-20T12:00:00.000Z",
  count: 2,
  offset: 0,
  artists: [
    {
      id: "6d7a3a0d-0d6b-4f0f-9b0e-2b0f5f4a1111",
      type: "Person",
      score: 100,
      name: "MIKE",
      "sort-name": "MIKE",
      country: "US",
      disambiguation: "US rapper",
      tags: [
        { count: 1, name: "hip hop" },
        { count: 4, name: "abstract hip hop" },
      ],
    },
    {
      id: "0a1b2c3d-4e5f-6a7b-8c9d-0e1f2a3b4444",
      type: "Group",
      score: 72,
      name: "Wet Leg",
      "sort-name": "Wet Leg",
      disambiguation: "",
      tags: [],
    },
  ],
};

describe("parseSearchResponse", () => {
  it("maps artists onto the provider-neutral shape", () => {
    const [mike, wetLeg] = parseSearchResponse(RESPONSE);

    expect(mike).toEqual({
      source: "musicbrainz",
      externalId: "6d7a3a0d-0d6b-4f0f-9b0e-2b0f5f4a1111",
      name: "MIKE",
      genre: "Abstract Hip Hop",
      disambiguation: "US rapper",
      imageUrl: null,
    });
    expect(wetLeg.name).toBe("Wet Leg");
  });

  it("picks the most-used tag as the genre, not the first one listed", () => {
    expect(parseSearchResponse(RESPONSE)[0].genre).toBe("Abstract Hip Hop");
  });

  it("treats a missing or empty disambiguation as absent", () => {
    expect(parseSearchResponse(RESPONSE)[1].disambiguation).toBeNull();
  });

  it("returns no genre when nobody has tagged the artist", () => {
    expect(parseSearchResponse(RESPONSE)[1].genre).toBeNull();
  });

  it("survives malformed payloads rather than throwing at the user", () => {
    expect(parseSearchResponse({})).toEqual([]);
    expect(parseSearchResponse(null)).toEqual([]);
    expect(parseSearchResponse({ artists: "nope" })).toEqual([]);
    expect(parseSearchResponse({ artists: [{ name: "No ID" }, { id: "no-name" }] })).toEqual([]);
  });
});

describe("userAgent", () => {
  // MusicBrainz blocks clients that don't identify themselves with contact details.
  it("identifies the app and carries a contact", () => {
    expect(userAgent()).toMatch(/^TrackRecord\/\d+\.\d+\.\d+ \( .+ \)$/);
  });
});
