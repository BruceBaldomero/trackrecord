import { NextRequest, NextResponse } from "next/server";
import { ProviderError, searchWithArtwork } from "@/lib/artists";

/**
 * Artist search runs server-side so the MusicBrainz User-Agent (and, later, any provider
 * key) never reaches the browser. Results are cached briefly because MusicBrainz is
 * rate-limited to about one request per second across the whole app.
 */
export const revalidate = 300;

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (query.length < 2) {
    return NextResponse.json({ artists: [] });
  }

  try {
    const artists = await searchWithArtwork(query);
    return NextResponse.json(
      { artists },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } }
    );
  } catch (error) {
    const message =
      error instanceof ProviderError
        ? error.userMessage
        : "Artist search is unavailable right now.";
    console.error("artist search failed", error);
    return NextResponse.json({ artists: [], error: message }, { status: 502 });
  }
}
