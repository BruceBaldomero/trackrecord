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
  const contact = process.env.MUSICBRAINZ_CONTACT;
  if (!contact) {
    console.warn(
      "MUSICBRAINZ_CONTACT is not set. MusicBrainz throttles clients that don't give a " +
        "contact address — put MUSICBRAINZ_CONTACT=you@example.com in .env.local"
    );
  }
  return `TrackRecord/0.1.0 ( ${contact ?? "https://github.com/BruceBaldomero/trackrecord"} )`;
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

  // MusicBrainz answers 503 both for genuine rate limiting and for transient load, and
  // asks clients to back off and retry rather than treat it as fatal.
  for (let attempt = 0; attempt < 2; attempt++) {
    let response: Response;
    try {
      response = await throttle(() =>
        fetch(url, { headers: { "User-Agent": userAgent(), Accept: "application/json" } })
      );
    } catch (cause) {
      throw new ProviderError("Couldn't reach the artist database. Try again in a moment.", cause);
    }

    if (response.ok) {
      return parseSearchResponse(await response.json());
    }

    // The body carries MusicBrainz's own explanation, which is the only way to tell a
    // rate-limit apart from a rejected User-Agent.
    const detail = (await response.text().catch(() => "")).slice(0, 300);
    console.error(
      `MusicBrainz ${response.status} for "${q}" (attempt ${attempt + 1}) ` +
        `ua="${userAgent()}" body=${JSON.stringify(detail)}`
    );

    if (response.status === 503 && attempt === 0) {
      await new Promise((r) => setTimeout(r, 1500));
      continue;
    }

    throw new ProviderError(
      response.status === 503
        ? `The artist database turned us away (503). ${detail || "No reason given."}`
        : `Artist search failed (${response.status}). ${detail || "Try again in a moment."}`
    );
  }

  return [];
}
