"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Avatar, SectionTitle } from "@/components/ui";
import { ExternalArtist } from "@/lib/artists/types";
import { BACKS, CURRENT_USER_ID } from "@/lib/data";
import { WEEKLY_PICK_LIMIT, useStore } from "@/lib/store";

export default function BackPage() {
  const { extraBacks, backArtist, picksLeft } = useStore();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ExternalArtist[]>([]);
  const [status, setStatus] = useState<"idle" | "searching" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<ExternalArtist | null>(null);
  const [justBacked, setJustBacked] = useState<ExternalArtist | null>(null);
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

  function confirm() {
    if (!pending) return;
    backArtist({
      source: pending.source,
      externalId: pending.externalId,
      name: pending.name,
      genre: pending.genre,
      imageUrl: pending.imageUrl,
    });
    setJustBacked(pending);
    setPending(null);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Back an artist</h1>
        <p className="mt-2 text-muted">
          Choose carefully. Once you back someone, the card is on your profile permanently.
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

      {justBacked && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-accent/40 bg-accent/10 px-4 py-3">
          <div className="text-sm">
            <span className="font-semibold">{justBacked.name}</span> is on your Track Record.
          </div>
          <Link
            href={`/card/new-${justBacked.externalId}`}
            className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-black"
          >
            See the card
          </Link>
        </div>
      )}

      <div className="mt-8">
        <SectionTitle>
          {status === "searching" ? "Searching…" : query.trim().length >= 2 ? "Results" : "Live search"}
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
                  className="flex items-center gap-4 bg-surface/50 px-4 py-3 transition-colors hover:bg-surface"
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
                  {backed ? (
                    <span className="rounded-lg border border-line px-3 py-1.5 text-xs text-faint">
                      Backed
                    </span>
                  ) : (
                    <button
                      onClick={() => setPending(artist)}
                      disabled={picksLeft === 0}
                      className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-accent hover:text-black disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white/10 disabled:hover:text-ink"
                    >
                      Back
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <p className="mt-3 text-xs text-faint">
          Listener counts aren&apos;t connected yet, so a new card records the artist and the date
          but not their size. That arrives with Songstats.
        </p>
      </div>

      {pending && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setPending(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-line bg-raised p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              {pending.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- remote art from many hosts
                <img
                  src={pending.imageUrl}
                  alt=""
                  className="size-12 rounded-xl object-cover ring-1 ring-white/10"
                />
              ) : (
                <Avatar name={pending.name} size={48} rounded="rounded-xl" />
              )}
              <div className="min-w-0">
                <div className="truncate font-semibold tracking-tight">{pending.name}</div>
                <div className="truncate text-xs text-muted">
                  {pending.genre ?? "Unknown genre"}
                </div>
              </div>
            </div>

            <dl className="mt-5 space-y-2 rounded-xl border border-line bg-surface p-4 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Monthly listeners</dt>
                <dd className="text-right text-xs text-faint">Not connected yet</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Dated</dt>
                <dd className="font-mono">today</dd>
              </div>
            </dl>

            <p className="mt-4 text-xs leading-relaxed text-muted">
              This is permanent. The artist and date are locked into your profile and can&apos;t be
              removed or edited later.
            </p>

            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setPending(null)}
                className="flex-1 rounded-xl border border-line px-4 py-2.5 text-sm font-medium text-muted transition-colors hover:text-ink"
              >
                Cancel
              </button>
              <button
                onClick={confirm}
                className="flex-1 truncate rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-black transition-opacity hover:opacity-90"
              >
                Back {pending.name}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
