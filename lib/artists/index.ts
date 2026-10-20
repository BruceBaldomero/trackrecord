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
export async function searchWithArtwork(
  query: string,
  limit = 10
): Promise<ExternalArtist[]> {
  const artists = await searchArtists(query, limit);

  return Promise.all(
    artists.map(async (artist) => ({
      ...artist,
      imageUrl: await artworkFor(artist.name),
    }))
  );
}
