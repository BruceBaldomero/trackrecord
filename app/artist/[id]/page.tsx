import Link from "next/link";
import { BackButton } from "@/components/BackButton";
import { Avatar, BandPill, SectionTitle } from "@/components/ui";
import { artworkFor } from "@/lib/artists/itunes";
import { lookupArtist } from "@/lib/artists/musicbrainz";
import { bandFor, formatListeners } from "@/lib/bands";
import { isConfigured, monthlyListenersFor } from "@/lib/listeners/songstats";

/**
 * The listener lookup lives here rather than on the search results list on purpose.
 * Songstats bills per unique artist per month, so pricing a whole page of search results
 * would burn through the allowance ten artists at a time for no benefit.
 */
async function listenerReading(spotifyId: string | null) {
  if (!spotifyId) {
    return { state: "no-spotify-id" as const };
  }
  if (!isConfigured()) {
    return { state: "no-key" as const };
  }
  try {
    const reading = await monthlyListenersFor(spotifyId);
    return { state: "ok" as const, listeners: reading.monthlyListeners };
  } catch (error) {
    return { state: "error" as const, message: (error as Error).message };
  }
}

export default async function ArtistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let found;
  try {
    found = await lookupArtist(id);
  } catch (error) {
    return (
      <Shell>
        <p className="text-muted">{(error as Error).message}</p>
      </Shell>
    );
  }

  if (!found) {
    return (
      <Shell>
        <p className="text-muted">No artist with that ID.</p>
      </Shell>
    );
  }

  const { artist, spotifyId } = found;
  const [imageUrl, reading] = await Promise.all([
    artworkFor(artist.name),
    listenerReading(spotifyId),
  ]);

  const band = reading.state === "ok" ? bandFor(reading.listeners) : null;

  return (
    <Shell>
      <div className="flex flex-wrap items-start gap-6">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- remote art from many hosts
          <img
            src={imageUrl}
            alt=""
            className="size-28 rounded-2xl object-cover ring-1 ring-white/10"
          />
        ) : (
          <Avatar name={artist.name} size={112} rounded="rounded-2xl" />
        )}

        <div className="min-w-0 flex-1">
          <h1 className="text-3xl font-semibold tracking-tight">{artist.name}</h1>
          <p className="mt-1 text-sm text-muted">
            {artist.genre ?? "Unknown genre"}
            {artist.disambiguation ? ` · ${artist.disambiguation}` : ""}
          </p>
          {band && (
            <div className="mt-3">
              <BandPill band={band} />
            </div>
          )}
        </div>
      </div>

      <section className="mt-10">
        <SectionTitle>Monthly listeners</SectionTitle>
        <div className="rounded-2xl border border-line bg-surface/60 p-6">
          {reading.state === "ok" ? (
            <>
              <div className="font-mono text-4xl tracking-tight">
                {reading.listeners.toLocaleString()}
              </div>
              <p className="mt-2 text-sm text-muted">
                {formatListeners(reading.listeners)} on Spotify, via Songstats. Backing them now
                locks this number onto your card permanently.
              </p>
            </>
          ) : reading.state === "no-key" ? (
            <p className="text-sm text-muted">
              No Songstats key configured. Add <code className="text-ink">SONGSTATS_API_KEY</code>{" "}
              to <code className="text-ink">.env.local</code> and restart.
            </p>
          ) : reading.state === "no-spotify-id" ? (
            <p className="text-sm text-muted">
              MusicBrainz has no Spotify link for this artist, so their listener count can&apos;t
              be looked up. Common for very new or very obscure acts.
            </p>
          ) : (
            <div className="text-sm">
              <p className="text-rose-300">Couldn&apos;t get a listener count.</p>
              <p className="mt-2 font-mono text-xs break-words text-muted">{reading.message}</p>
            </div>
          )}
        </div>
      </section>

      <div className="mt-8">
        <BackButton
          artist={{
            source: artist.source,
            externalId: artist.externalId,
            name: artist.name,
            genre: artist.genre,
            imageUrl,
          }}
        />
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <Link href="/back" className="text-sm text-muted hover:text-ink">
        ← Back to search
      </Link>
      <div className="mt-6">{children}</div>
    </div>
  );
}
