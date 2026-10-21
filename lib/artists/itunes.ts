/**
 * iTunes Search supplies cover art, free and without a key. Note this is *album artwork*,
 * not an artist photograph — Spotify was the artist-photo source and it isn't available
 * to us (BLOCKERS.md). Album art reads fine on a card, but it isn't the same thing.
 */

const ENDPOINT = "https://itunes.apple.com/search";

/** iTunes serves 100×100 by default; the same URL pattern yields larger sizes. */
export function upscale(url: string, size = 600): string {
  return url.replace(/\/\d+x\d+bb\.(jpg|png)$/, `/${size}x${size}bb.$1`);
}

/**
 * Normalised equality. Deliberately strict: a near-match like "Wet Leg Tribute Band" would
 * otherwise put someone else's cover art on the card, and no image beats a wrong one.
 */
export function namesMatch(a: string, b: string): boolean {
  const norm = (s: string) =>
    s
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]/g, "");
  const x = norm(a);
  const y = norm(b);
  return x.length > 0 && x === y;
}

type ITunesResult = { artistName?: unknown; artworkUrl100?: unknown };

/** Split out from the request so the shape handling is testable without a network call. */
export function parseArtwork(json: unknown, expectedName: string): string | null {
  const results = (json as { results?: unknown })?.results;
  if (!Array.isArray(results)) return null;

  for (const raw of results as ITunesResult[]) {
    if (typeof raw?.artworkUrl100 !== "string" || typeof raw?.artistName !== "string") continue;
    if (!namesMatch(raw.artistName, expectedName)) continue;
    return upscale(raw.artworkUrl100);
  }
  return null;
}

import { TtlCache } from "../cache";

/** Cover art barely changes, so cache it hard. */
const artworkCache = new TtlCache<string | null>(24 * 60 * 60 * 1000);

export async function artworkFor(name: string): Promise<string | null> {
  const term = name.trim();
  if (!term) return null;

  return artworkCache.wrap(term.toLowerCase(), async () => {
    const url = `${ENDPOINT}?term=${encodeURIComponent(term)}&entity=album&limit=5`;
    try {
      const response = await fetch(url, {
        headers: { Accept: "application/json" },
        // Artwork must never hold up a search; without this one slow reply stalls the lot.
        signal: AbortSignal.timeout(2500),
      });
      if (!response.ok) return null;
      return parseArtwork(await response.json(), term);
    } catch {
      // Artwork is decorative — a card without it still works, so never fail the search.
      return null;
    }
  });
}
