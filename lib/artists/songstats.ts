import { TtlCache } from "../cache";
import { ExternalArtist, ProviderError } from "./types";

/**
 * Songstats as the single artist source: search, profile info and listener counts.
 *
 * Billing shape matters to the design here. Search requests are **free**, so searching is
 * cheap and can happen on every keystroke. Stats and info are billed per *unique artist per
 * calendar month*, so those belong on a deliberately-opened artist page, never on a list of
 * search results — ten results would otherwise cost ten artists per search.
 *
 * Confirmed by Songstats 27 Oct 2026: 10 requests/second per key, and each artist may be
 * requested up to 1,000 times per calendar month.
 */

const BASE = process.env.SONGSTATS_API_BASE ?? "https://api.songstats.com/enterprise/v1";

const searchCache = new TtlCache<ExternalArtist[]>(10 * 60 * 1000);
const infoCache = new TtlCache<ExternalArtist | null>(60 * 60 * 1000);

function key(): string {
  const value = process.env.SONGSTATS_API_KEY;
  if (!value) {
    throw new ProviderError("No Songstats key configured — set SONGSTATS_API_KEY in .env.local");
  }
  return value;
}

type SearchRow = {
  songstats_artist_id?: unknown;
  name?: unknown;
  avatar?: unknown;
};

/** Split out from the request so shape handling is testable without a network call. */
export function parseSearch(json: unknown): ExternalArtist[] {
  const results = (json as { results?: unknown })?.results;
  if (!Array.isArray(results)) return [];

  return (results as SearchRow[]).flatMap((row) => {
    if (typeof row?.songstats_artist_id !== "string" || typeof row?.name !== "string") return [];
    return [
      {
        source: "songstats" as const,
        externalId: row.songstats_artist_id,
        name: row.name,
        genre: null,
        disambiguation: null,
        // The avatar belongs to this specific artist, so unlike the iTunes-by-name
        // approach it can't end up on a different act who happens to share a name.
        imageUrl: typeof row.avatar === "string" && row.avatar.length > 0 ? row.avatar : null,
      },
    ];
  });
}

export function parseInfo(json: unknown): ExternalArtist | null {
  const info = (json as { artist_info?: unknown })?.artist_info as
    | (SearchRow & { genres?: unknown; country?: unknown; bio?: unknown })
    | undefined;
  if (typeof info?.songstats_artist_id !== "string" || typeof info?.name !== "string") return null;

  const genres = Array.isArray(info.genres)
    ? info.genres.filter((g): g is string => typeof g === "string")
    : [];

  return {
    source: "songstats",
    externalId: info.songstats_artist_id,
    name: info.name,
    genre: genres[0] ?? null,
    disambiguation:
      typeof info.country === "string" && info.country.length > 0 ? info.country : null,
    imageUrl: typeof info.avatar === "string" && info.avatar.length > 0 ? info.avatar : null,
  };
}

async function get(path: string): Promise<{ status: number; json: unknown; body: string }> {
  let response: Response;
  try {
    response = await fetch(`${BASE}${path}`, {
      headers: { apikey: key(), Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    });
  } catch (cause) {
    if (cause instanceof ProviderError) throw cause;
    throw new ProviderError("Couldn't reach Songstats. Try again in a moment.", cause);
  }

  const body = await response.text();
  let json: unknown = null;
  try {
    json = JSON.parse(body);
  } catch {
    throw new ProviderError(
      `Songstats returned ${response.status} and something that isn't JSON: ${body.slice(0, 200)}`
    );
  }
  return { status: response.status, json, body };
}

/** Free per Songstats, so this can run on every keystroke without touching the bill. */
export async function searchArtists(query: string, limit = 10): Promise<ExternalArtist[]> {
  const q = query.trim();
  if (!q) return [];

  return searchCache.wrap(`${q.toLowerCase()}|${limit}`, async () => {
    const { status, json, body } = await get(
      `/artists/search?q=${encodeURIComponent(q)}&limit=${limit}`
    );
    if (status !== 200) {
      throw new ProviderError(`Artist search failed (${status}). ${body.slice(0, 200)}`);
    }
    return parseSearch(json);
  });
}

/** Billed per unique artist per month — only call this for an artist someone opened. */
export async function artistInfo(songstatsArtistId: string): Promise<ExternalArtist | null> {
  return infoCache.wrap(songstatsArtistId, async () => {
    const { status, json } = await get(
      `/artists/info?songstats_artist_id=${encodeURIComponent(songstatsArtistId)}`
    );
    if (status === 404) return null;
    if (status !== 200) {
      throw new ProviderError(`Couldn't load that artist (${status}).`);
    }
    return parseInfo(json);
  });
}
