
/**
 * Spotify monthly listeners, via Songstats.
 *
 * Spotify's own API doesn't expose monthly listeners at all, which is why a third party is
 * in the stack. Songstats bills per *unique artist per calendar month*, so asking about the
 * same artist repeatedly within a month is free — but widening the set of artists is not.
 * Never call this per page view; call it when an artist is first backed, and on the weekly
 * refresh.
 */

const BASE = process.env.SONGSTATS_API_BASE ?? "https://api.songstats.com/enterprise/v1";

export type ListenerResult =
  | { state: "ok"; spotifyArtistId: string; monthlyListeners: number; raw: unknown }
  /** Songstats authenticated us fine but doesn't carry this artist. Expected, not a fault. */
  | { state: "not-tracked"; spotifyArtistId: string }
  | { state: "error"; spotifyArtistId: string; message: string };

export async function monthlyListenersFor(spotifyArtistId: string): Promise<ListenerResult> {
  const key = process.env.SONGSTATS_API_KEY;
  if (!key) {
    return {
      state: "error",
      spotifyArtistId,
      message: "No Songstats key configured — set SONGSTATS_API_KEY in .env.local",
    };
  }

  const url = `${BASE}/artists/stats?spotify_artist_id=${encodeURIComponent(
    spotifyArtistId
  )}&source=spotify`;

  let response: Response;
  try {
    response = await fetch(url, { headers: { apikey: key, Accept: "application/json" } });
  } catch (cause) {
    return {
      state: "error",
      spotifyArtistId,
      message: `Couldn't reach Songstats: ${(cause as Error).message}`,
    };
  }

  const body = await response.text();
  let json: unknown;
  try {
    json = JSON.parse(body);
  } catch {
    return {
      state: "error",
      spotifyArtistId,
      message: `Songstats returned ${response.status} and something that isn't JSON: ${body.slice(0, 200)}`,
    };
  }

  const message = (json as { message?: unknown })?.message;
  if (response.status === 404 || (typeof message === "string" && /not found/i.test(message))) {
    return { state: "not-tracked", spotifyArtistId };
  }

  if (!response.ok) {
    return {
      state: "error",
      spotifyArtistId,
      message: `Songstats refused the request (${response.status}): ${body.slice(0, 300)}`,
    };
  }

  const monthlyListeners = findMonthlyListeners(json);
  if (monthlyListeners === null) {
    return {
      state: "error",
      spotifyArtistId,
      message:
        "Songstats answered, but no monthly-listeners figure was found. The payload shape " +
        `differs from what was expected: ${body.slice(0, 300)}`,
    };
  }

  return { state: "ok", spotifyArtistId, monthlyListeners, raw: json };
}

/**
 * Songstats nests its numbers differently per endpoint and plan, and their docs aren't
 * reachable from the build environment, so rather than hard-coding one path this hunts for
 * a monthly-listeners field anywhere in the payload. A "current" reading wins over any
 * other if several are present.
 */
export function findMonthlyListeners(json: unknown): number | null {
  const candidates: { key: string; value: number }[] = [];
  const seen = new Set<object>();

  const walk = (node: unknown) => {
    if (node === null || typeof node !== "object") return;
    if (seen.has(node)) return;
    seen.add(node);

    for (const [key, value] of Object.entries(node)) {
      if (typeof value === "number" && /monthly_?listeners/i.test(key)) {
        candidates.push({ key, value });
      } else if (value !== null && typeof value === "object") {
        walk(value);
      }
    }
  };

  walk(json);
  if (candidates.length === 0) return null;

  const current = candidates.find((c) => /current|latest|total/i.test(c.key));
  return (current ?? candidates[0]).value;
}

export function isConfigured(): boolean {
  return Boolean(process.env.SONGSTATS_API_KEY);
}
