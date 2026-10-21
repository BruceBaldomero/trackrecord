import { artworkFor } from "./itunes";
import { searchArtists } from "./musicbrainz";
import { ExternalArtist } from "./types";

export * from "./types";

/**
 * Search artists and decorate them with artwork.
 *
 * Artwork lookups run in parallel because iTunes has no documented per-client limit; the
 * MusicBrainz call that produced the names is the throttled one.
 */
function nameKey(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * iTunes is searched by name, so artists who share a name would otherwise all be given the
 * same album art — a search for "Ear" returned six different acts wearing one photograph.
 * Where a name isn't unique, no artwork is better than the wrong artwork.
 */
export function uniqueNames(artists: ExternalArtist[]): Set<string> {
  const counts = new Map<string, number>();
  for (const artist of artists) {
    const key = nameKey(artist.name);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return new Set([...counts].filter(([, n]) => n === 1).map(([key]) => key));
}

export async function searchWithArtwork(
  query: string,
  limit = 10
): Promise<ExternalArtist[]> {
  const artists = await searchArtists(query, limit);

  // Work out which names are unique *before* fetching, so ambiguous ones cost no request
  // at all. Previously every result was looked up and the duplicates then discarded.
  const unique = uniqueNames(artists);

  return Promise.all(
    artists.map(async (artist) =>
      unique.has(nameKey(artist.name))
        ? { ...artist, imageUrl: await artworkFor(artist.name) }
        : artist
    )
  );
}
