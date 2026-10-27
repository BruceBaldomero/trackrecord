import { describe, expect, it } from "vitest";
import { parseInfo, parseSearch } from "./songstats";

// Shapes taken from Songstats' own API documentation.
const SEARCH_RESPONSE = {
  result: "success",
  message: "Data Retrieved.",
  results: [
    {
      songstats_artist_id: "7aotBuey",
      avatar: "https://i.scdn.co/image/ab6761610000e5ebcdce7620dc940db079bf4952",
      name: "Ariana Grande",
      site_url: "https://songstats.com/artist/7aotBuey/ariana-grande",
    },
    {
      songstats_artist_id: "pod5zlug",
      avatar: "",
      name: "DONT BLINK",
      site_url: "https://songstats.com/artist/pod5zlug/dont-blink",
    },
  ],
};

const INFO_RESPONSE = {
  result: "success",
  message: "Data Retrieved.",
  artist_info: {
    songstats_artist_id: "pod5zlug",
    avatar: "https://i.scdn.co/image/ab7616100005174b53a0a7848438a9bac2b4b8c",
    site_url: "https://songstats.com/artist/pod5zlug/dont-blink",
    name: "DONT BLINK",
    country: "DE",
    bio: "DONT BLINK, the German-Estonian DJ/Producer duo",
    genres: ["Electronic", "House"],
  },
};

describe("parseSearch", () => {
  it("maps results onto the provider-neutral shape", () => {
    const [ariana, dontBlink] = parseSearch(SEARCH_RESPONSE);

    expect(ariana).toEqual({
      source: "songstats",
      externalId: "7aotBuey",
      name: "Ariana Grande",
      genre: null,
      disambiguation: null,
      imageUrl: "https://i.scdn.co/image/ab6761610000e5ebcdce7620dc940db079bf4952",
    });
    expect(dontBlink.externalId).toBe("pod5zlug");
  });

  it("gives each artist their own avatar", () => {
    // The whole point of moving off iTunes: artwork arrives tied to the artist's ID rather
    // than matched on a name, so two acts called "Ear" can't end up wearing one photo.
    const avatars = parseSearch(SEARCH_RESPONSE).map((a) => a.imageUrl);
    expect(new Set(avatars).size).toBe(avatars.length);
  });

  it("treats an empty avatar as no image", () => {
    expect(parseSearch(SEARCH_RESPONSE)[1].imageUrl).toBeNull();
  });

  it("survives malformed payloads", () => {
    expect(parseSearch({})).toEqual([]);
    expect(parseSearch(null)).toEqual([]);
    expect(parseSearch({ results: "nope" })).toEqual([]);
    expect(parseSearch({ results: [{ name: "No ID" }, { songstats_artist_id: "no-name" }] })).toEqual([]);
  });
});

describe("parseInfo", () => {
  it("reads the artist profile", () => {
    const artist = parseInfo(INFO_RESPONSE);
    expect(artist).toEqual({
      source: "songstats",
      externalId: "pod5zlug",
      name: "DONT BLINK",
      genre: "Electronic",
      disambiguation: "DE",
      imageUrl: "https://i.scdn.co/image/ab7616100005174b53a0a7848438a9bac2b4b8c",
    });
  });

  it("copes with an artist who has no genres listed", () => {
    const thin = { artist_info: { songstats_artist_id: "x", name: "Nobody" } };
    const artist = parseInfo(thin);
    expect(artist?.genre).toBeNull();
    expect(artist?.imageUrl).toBeNull();
  });

  it("returns null for malformed payloads", () => {
    expect(parseInfo({})).toBeNull();
    expect(parseInfo(null)).toBeNull();
    expect(parseInfo({ artist_info: { name: "No ID" } })).toBeNull();
  });
});
