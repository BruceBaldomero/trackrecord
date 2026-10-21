import { ProviderError } from "../artists/types";

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

export type ListenerReading = {
  spotifyArtistId: string;
  monthlyListeners: number;
  /** Raw payload, kept so a shape surprise can be diagnosed rather than guessed at. */
  raw?: unknown;
};

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

export async function monthlyListenersFor(spotifyArtistId: string): Promise<ListenerReading> {
  const key = process.env.SONGSTATS_API_KEY;
  if (!key) {
    throw new ProviderError("No Songstats key configured — set SONGSTATS_API_KEY in .env.local");
  }

  const url = `${BASE}/artists/stats?spotify_artist_id=${encodeURIComponent(
    spotifyArtistId
  )}&source=spotify`;

  let response: Response;
  try {
    response = await fetch(url, {
      headers: { apikey: key, Accept: "application/json" },
    });
  } catch (cause) {
    throw new ProviderError("Couldn't reach Songstats.", cause);
  }

  const body = await response.text();
  let json: unknown;
  try {
    json = JSON.parse(body);
  } catch {
    throw new ProviderError(
      `Songstats returned ${response.status} and something that isn't JSON: ${body.slice(0, 200)}`
    );
  }

  if (!response.ok) {
    throw new ProviderError(
      `Songstats refused the request (${response.status}): ${body.slice(0, 300)}`
    );
  }

  const monthlyListeners = findMonthlyListeners(json);
  if (monthlyListeners === null) {
    throw new ProviderError(
      "Songstats answered, but no monthly-listeners figure was found in the response. " +
        "The payload shape differs from what was expected — see the raw output."
    );
  }

  return { spotifyArtistId, monthlyListeners, raw: json };
}
