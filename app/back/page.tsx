"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Avatar, SectionTitle } from "@/components/ui";
import { ExternalArtist } from "@/lib/artists/types";
import { BACKS, CURRENT_USER_ID } from "@/lib/data";
import { WEEKLY_PICK_LIMIT, useStore } from "@/lib/store";

export default function BackPage() {
  const { extraBacks, picksLeft } = useStore();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ExternalArtist[]>([]);
  const [status, setStatus] = useState<"idle" | "searching" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const alreadyBacked = new Set<string>([
    ...BACKS.filter((b) => b.userId === CURRENT_USER_ID).map((b) => b.artistId),
    ...extraBacks.map((b) => b.artistId),
  ]);

  const search = useCallback(async (q: string) => {
    const id = ++requestId.current;
    if (q.trim().length < 2) {
      setResults([]);
      setStatus("idle");
      return;
    }

    setStatus("searching");
    try {
      const response = await fetch(`/api/artists/search?q=${encodeURIComponent(q)}`);
      const body = await response.json();
      // A slower earlier search must not overwrite a newer one's results.
      if (id !== requestId.current) return;

      if (!response.ok) {
        setError(body?.error ?? "Artist search is unavailable right now.");
        setStatus("error");
        setResults([]);
        return;
      }
      setResults(body.artists ?? []);
      setStatus("idle");
      setError(null);
    } catch {
      if (id !== requestId.current) return;
      setError("Couldn't reach the server. Is the site still running?");
      setStatus("error");
    }
  }, []);

  // MusicBrainz is rate-limited to roughly one request a second, so wait for a pause in
  // typing rather than firing on every keystroke.
  useEffect(() => {
    const timer = setTimeout(() => search(query), 400);
    return () => clearTimeout(timer);
  }, [query, search]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Back an artist</h1>
        <p className="mt-2 text-muted">
          Search for anyone, open them up to see where they&apos;re at, then decide. Once you back
          someone the card is on your profile permanently.
        </p>
      </div>

      <div className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-line bg-surface/60 px-4 py-3">
        <div className="text-sm text-muted">Picks left this week</div>
        <div className="flex items-center gap-1.5">
          {Array.from({ length: WEEKLY_PICK_LIMIT }).map((_, i) => (
            <span
              key={i}
              className={`size-2.5 rounded-full ${i < picksLeft ? "bg-accent" : "bg-white/12"}`}
            />
          ))}
          <span className="ml-2 font-mono text-sm">
            {picksLeft}/{WEEKLY_PICK_LIMIT}
          </span>
        </div>
      </div>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search any artist…"
        className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-[15px] outline-none placeholder:text-faint focus:border-accent/60"
      />

      <div className="mt-8">
        <SectionTitle>
          {status === "searching"
            ? "Searching…"
            : query.trim().length >= 2
              ? "Results"
              : "Live search"}
        </SectionTitle>

        {query.trim().length < 2 ? (
          <div className="rounded-2xl border border-dashed border-line px-6 py-14 text-center text-sm text-muted">
            Type at least two letters to search.
            <div className="mt-1 text-xs text-faint">
              Real artists, live from MusicBrainz, with artwork from iTunes.
            </div>
          </div>
        ) : status === "error" ? (
          <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 px-5 py-6 text-sm">
            {error}
          </div>
        ) : results.length === 0 && status === "idle" ? (
          <div className="rounded-2xl border border-dashed border-line px-6 py-14 text-center text-sm text-muted">
            No artists found for “{query}”.
          </div>
        ) : (
          <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line">
            {results.map((artist) => {
              const backed = alreadyBacked.has(artist.externalId);
              return (
                <div
                  key={artist.externalId}
                  className="flex items-center gap-4 bg-surface/50 transition-colors hover:bg-surface"
                >
                  <Link
                    href={`/artist/${artist.externalId}`}
                    className="flex min-w-0 flex-1 items-center gap-4 px-4 py-3"
                  >
                    {artist.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- remote art from many hosts
                      <img
                        src={artist.imageUrl}
                        alt=""
                        className="size-10 shrink-0 rounded-lg object-cover ring-1 ring-white/10"
                        loading="lazy"
                      />
                    ) : (
                      <Avatar name={artist.name} size={40} rounded="rounded-lg" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{artist.name}</div>
                      <div className="mt-0.5 truncate text-xs text-muted">
                        {artist.genre ?? "Unknown genre"}
                        {artist.disambiguation ? ` · ${artist.disambiguation}` : ""}
                      </div>
                    </div>
                  </Link>
                  <div className="pr-4">
                    {backed ? (
                      <span className="rounded-lg border border-line px-3 py-1.5 text-xs text-faint">
                        Backed
                      </span>
                    ) : (
                      <Link
                        href={`/artist/${artist.externalId}`}
                        className="inline-block rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-accent hover:text-black"
                      >
                        View
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <p className="mt-3 text-xs text-faint">
          Several artists often share a name. Open one to see their listener count and
          disambiguation before you commit — artwork is hidden where a name isn&apos;t unique,
          rather than risk showing you the wrong act.
        </p>
      </div>
    </div>
  );
}
