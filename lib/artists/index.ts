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
/**
 * iTunes is searched by name, so artists who share a name would otherwise all be given the
 * same album art — a search for "Ear" returned six different acts wearing one photograph.
 * Where a name isn't unique in the results, no artwork is better than the wrong artwork.
 */
export function dropAmbiguousArtwork(artists: ExternalArtist[]): ExternalArtist[] {
  const counts = new Map<string, number>();
  for (const artist of artists) {
    const key = artist.name.toLowerCase().replace(/[^a-z0-9]/g, "");
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return artists.map((artist) => {
    const key = artist.name.toLowerCase().replace(/[^a-z0-9]/g, "");
    return (counts.get(key) ?? 0) > 1 ? { ...artist, imageUrl: null } : artist;
  });
}

export async function searchWithArtwork(
  query: string,
  limit = 10
): Promise<ExternalArtist[]> {
  const artists = await searchArtists(query, limit);

  const decorated = await Promise.all(
    artists.map(async (artist) => ({
      ...artist,
      imageUrl: await artworkFor(artist.name),
    }))
  );

  return dropAmbiguousArtwork(decorated);
}
