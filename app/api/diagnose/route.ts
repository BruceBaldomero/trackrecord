import { NextRequest, NextResponse } from "next/server";
import { searchWithArtwork } from "@/lib/artists";
import { spotifyIdFor } from "@/lib/artists/musicbrainz";
import { isConfigured, monthlyListenersFor } from "@/lib/listeners/songstats";

/**
 * Walks the whole artist pipeline for one query and reports what each step actually did.
 *
 * Songstats' documentation isn't reachable from the build environment, so the exact shape
 * of their response is unverified. This endpoint exists so one real call tells us the truth
 * instead of a guess — including the raw payload when something doesn't match.
 */
export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (!query) {
    return NextResponse.json({ error: "Add ?q=an artist name" }, { status: 400 });
  }

  const steps: Record<string, unknown> = {
    songstatsKeyPresent: isConfigured(),
  };

  // 1 — find the artist
  let artist;
  try {
    const results = await searchWithArtwork(query, 5);
    artist = results[0];
    steps.search = artist
      ? { ok: true, name: artist.name, musicBrainzId: artist.externalId, hasArtwork: Boolean(artist.imageUrl) }
      : { ok: false, reason: "no results" };
  } catch (error) {
    steps.search = { ok: false, error: (error as Error).message };
    return NextResponse.json({ query, steps }, { status: 502 });
  }
  if (!artist) return NextResponse.json({ query, steps }, { status: 404 });

  // 2 — bridge MusicBrainz -> Spotify ID
  const spotifyArtistId = await spotifyIdFor(artist.externalId);
  steps.spotifyIdLookup = spotifyArtistId
    ? { ok: true, spotifyArtistId }
    : { ok: false, reason: "MusicBrainz has no Spotify link for this artist" };

  if (!spotifyArtistId) return NextResponse.json({ query, steps }, { status: 404 });

  // 3 — ask Songstats for the listener count
  try {
    const reading = await monthlyListenersFor(spotifyArtistId);
    steps.songstats = { ok: true, monthlyListeners: reading.monthlyListeners, raw: reading.raw };
  } catch (error) {
    steps.songstats = { ok: false, error: (error as Error).message };
    return NextResponse.json({ query, steps }, { status: 502 });
  }

  return NextResponse.json({ query, steps });
}
