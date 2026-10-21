import { NextRequest, NextResponse } from "next/server";
import { searchArtists, spotifyIdFor } from "@/lib/artists/musicbrainz";

/**
 * Temporary diagnostic. Songstats' documentation isn't reachable from the build
 * environment, so rather than guess at their request shape this tries the plausible
 * variants for one artist and reports exactly what each returns.
 *
 * All variants concern the same artist, so this does not multiply the per-unique-artist
 * billing. Delete this route once the correct shape is known.
 */

const BASE = process.env.SONGSTATS_API_BASE ?? "https://api.songstats.com/enterprise/v1";

function variants(spotifyId: string, name: string) {
  const q = encodeURIComponent(name);
  const id = encodeURIComponent(spotifyId);
  return [
    { label: "stats?spotify_artist_id", url: `${BASE}/artists/stats?spotify_artist_id=${id}&source=spotify` },
    { label: "info?spotify_artist_id", url: `${BASE}/artists/info?spotify_artist_id=${id}` },
    { label: "stats?spotify_id", url: `${BASE}/artists/stats?spotify_id=${id}&source=spotify` },
    { label: "search?q=name", url: `${BASE}/artists/search?q=${q}` },
    { label: "artists?q=name", url: `${BASE}/artists?q=${q}` },
  ];
}

export async function GET(request: NextRequest) {
  const key = process.env.SONGSTATS_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "SONGSTATS_API_KEY is not set" }, { status: 400 });
  }

  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (!query) {
    return NextResponse.json({ error: "Add ?q=an artist name" }, { status: 400 });
  }

  const [artist] = await searchArtists(query, 1);
  if (!artist) {
    return NextResponse.json({ error: `No MusicBrainz match for "${query}"` }, { status: 404 });
  }

  const spotifyId = await spotifyIdFor(artist.externalId);
  if (!spotifyId) {
    return NextResponse.json({
      artist: artist.name,
      error: "MusicBrainz has no Spotify link for this artist, so there's no ID to probe with.",
    });
  }

  const attempts = [];
  for (const variant of variants(spotifyId, artist.name)) {
    try {
      const response = await fetch(variant.url, {
        headers: { apikey: key, Accept: "application/json" },
      });
      const body = await response.text();
      attempts.push({
        variant: variant.label,
        status: response.status,
        body: body.slice(0, 400),
      });
    } catch (error) {
      attempts.push({ variant: variant.label, error: (error as Error).message });
    }
  }

  return NextResponse.json({
    artist: artist.name,
    disambiguation: artist.disambiguation,
    musicBrainzId: artist.externalId,
    spotifyId,
    checkSpotifyMatch: `https://open.spotify.com/artist/${spotifyId}`,
    attempts,
  });
}
