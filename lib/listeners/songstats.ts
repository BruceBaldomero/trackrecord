
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
  | { state: "ok"; artistId: string; monthlyListeners: number; raw: unknown }
  /**
   * Songstats authenticated us fine but has no figure yet. Per Songstats (27 Oct 2026),
   * requesting an artist they don't hold enrols them and starts monitoring from that point,
   * so this can be a temporary state for a brand-new artist rather than a permanent gap.
   */
  | { state: "not-tracked"; artistId: string }
  | { state: "error"; artistId: string; message: string };

export async function monthlyListenersFor(songstatsArtistId: string): Promise<ListenerResult> {
  const artistId = songstatsArtistId;
  const key = process.env.SONGSTATS_API_KEY;
  if (!key) {
    return {
      state: "error",
      artistId,
      message: "No Songstats key configured — set SONGSTATS_API_KEY in .env.local",
    };
  }

  const url = `${BASE}/artists/stats?songstats_artist_id=${encodeURIComponent(
    artistId
  )}&source=spotify`;

  let response: Response;
  try {
    response = await fetch(url, {
      headers: { apikey: key, Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    });
  } catch (cause) {
    return {
      state: "error",
      artistId,
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
      artistId,
      message: `Songstats returned ${response.status} and something that isn't JSON: ${body.slice(0, 200)}`,
    };
  }

  const message = (json as { message?: unknown })?.message;
  if (response.status === 404 || (typeof message === "string" && /not found/i.test(message))) {
    return { state: "not-tracked", artistId };
  }

  if (!response.ok) {
    return {
      state: "error",
      artistId,
      message: `Songstats refused the request (${response.status}): ${body.slice(0, 300)}`,
    };
  }

  const monthlyListeners = findMonthlyListeners(json);
  if (monthlyListeners === null) {
    return {
      state: "error",
      artistId,
      message:
        "Songstats answered, but no monthly-listeners figure was found. The payload shape " +
        `differs from what was expected: ${body.slice(0, 300)}`,
    };
  }

  return { state: "ok", artistId, monthlyListeners, raw: json };
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
