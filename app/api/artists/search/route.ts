import { NextRequest, NextResponse } from "next/server";
import { ProviderError, searchWithArtwork } from "@/lib/artists";

/**
 * Artist search runs server-side so the MusicBrainz User-Agent (and, later, any provider
 * key) never reaches the browser.
 *
 * Deliberately not route-cached. Next would key its cache on the full URL and happily
 * persist a failed response in .next/cache, so one rate-limited search would keep
 * returning that failure for every identical query — surviving restarts. Caching happens
 * in process instead (lib/cache.ts), where failures are never stored.
 */
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (query.length < 2) {
    return NextResponse.json({ artists: [] });
  }

  try {
    const artists = await searchWithArtwork(query);
    return NextResponse.json({ artists });
  } catch (error) {
    const message =
      error instanceof ProviderError
        ? error.userMessage
        : "Artist search is unavailable right now.";
    console.error("artist search failed", error);
    return NextResponse.json({ artists: [], error: message }, { status: 502 });
  }
}
