/**
 * Artists come from whichever provider will actually serve us — Spotify won't (see
 * BLOCKERS.md). Nothing downstream should know or care which one it was, so artists are
 * identified by `source` + `externalId` rather than by any one provider's ID.
 */

export type ArtistSource = "musicbrainz";

export type ExternalArtist = {
  source: ArtistSource;
  externalId: string;
  name: string;
  /** Best-guess genre. MusicBrainz tags are crowd-sourced, so this is often null. */
  genre: string | null;
  /** MusicBrainz's own short note, e.g. "US rapper" — useful for telling acts apart. */
  disambiguation: string | null;
  /** Album artwork, not an artist photograph. Filled in separately; null is normal. */
  imageUrl: string | null;
};

export class ProviderError extends Error {
  readonly userMessage: string;

  constructor(userMessage: string, cause?: unknown) {
    super(userMessage);
    this.name = "ProviderError";
    this.userMessage = userMessage;
    this.cause = cause;
  }
}
