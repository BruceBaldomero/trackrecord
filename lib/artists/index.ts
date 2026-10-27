import { searchArtists } from "./songstats";
import { ExternalArtist } from "./types";

export * from "./types";
export { artistInfo, searchArtists } from "./songstats";

/**
 * Artist search.
 *
 * Songstats returns each artist's own avatar with the search result, so there's no second
 * lookup and no name-matching — which is what used to put one act's cover art on another's
 * card. Search requests are free, so this costs nothing per keystroke.
 */
export async function searchWithArtwork(
  query: string,
  limit = 10
): Promise<ExternalArtist[]> {
  return searchArtists(query, limit);
}
