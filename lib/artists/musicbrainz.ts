import { ExternalArtist, ProviderError } from "./types";

const ENDPOINT = "https://musicbrainz.org/ws/2/artist";

/**
 * MusicBrainz asks for roughly one request per second from a single client and will return
 * 503 if you ignore that. Requests are therefore queued rather than fired in parallel.
 */
const MIN_INTERVAL_MS = 1100;
let lastRequest = 0;
let queue: Promise<unknown> = Promise.resolve();

function throttle<T>(run: () => Promise<T>): Promise<T> {
  const result = queue.then(async () => {
    const wait = Math.max(0, lastRequest + MIN_INTERVAL_MS - Date.now());
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    lastRequest = Date.now();
    return run();
  });
  // Keep the chain alive even when a request rejects.
  queue = result.catch(() => undefined);
  return result;
}

/** MusicBrainz requires a descriptive User-Agent with contact details, or it blocks you. */
export function userAgent(): string {
  const contact = process.env.MUSICBRAINZ_CONTACT ?? "https://github.com/BruceBaldomero/trackrecord";
  return `TrackRecord/0.1.0 ( ${contact} )`;
}

type MusicBrainzArtist = {
  id?: unknown;
  name?: unknown;
  disambiguation?: unknown;
  tags?: unknown;
};

/** Split out from the request so the shape handling is testable without a network call. */
export function parseSearchResponse(json: unknown): ExternalArtist[] {
  const artists = (json as { artists?: unknown })?.artists;
  if (!Array.isArray(artists)) return [];

  return artists.flatMap((raw: MusicBrainzArtist) => {
    if (typeof raw?.id !== "string" || typeof raw?.name !== "string") return [];
    return [
      {
        source: "musicbrainz" as const,
        externalId: raw.id,
        name: raw.name,
        genre: topTag(raw.tags),
        disambiguation:
          typeof raw.disambiguation === "string" && raw.disambiguation.length > 0
            ? raw.disambiguation
            : null,
        imageUrl: null,
      },
    ];
  });
}

function topTag(tags: unknown): string | null {
  if (!Array.isArray(tags)) return null;
  const ranked = tags
    .filter(
      (t): t is { count: number; name: string } =>
        typeof t?.name === "string" && typeof t?.count === "number"
    )
    .sort((a, b) => b.count - a.count);
  if (ranked.length === 0) return null;
  return ranked[0].name.replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function searchArtists(query: string, limit = 10): Promise<ExternalArtist[]> {
  const q = query.trim();
  if (!q) return [];

  const url = `${ENDPOINT}?query=${encodeURIComponent(q)}&fmt=json&limit=${limit}`;

  let response: Response;
  try {
    response = await throttle(() =>
      fetch(url, { headers: { "User-Agent": userAgent(), Accept: "application/json" } })
    );
  } catch (cause) {
    throw new ProviderError("Couldn't reach the artist database. Try again in a moment.", cause);
  }

  if (response.status === 503) {
    throw new ProviderError("The artist database is rate-limiting us. Try again in a moment.");
  }
  if (!response.ok) {
    throw new ProviderError(`Artist search failed (${response.status}). Try again in a moment.`);
  }

  return parseSearchResponse(await response.json());
}
