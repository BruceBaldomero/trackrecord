"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Avatar, BandPill, SectionTitle } from "@/components/ui";
import { bandFor, formatListeners } from "@/lib/bands";
import { ARTISTS, Artist, BACKS, CURRENT_USER_ID } from "@/lib/data";
import { WEEKLY_PICK_LIMIT, useStore } from "@/lib/store";

export default function BackPage() {
  const { extraBacks, backArtist, picksLeft } = useStore();
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState<Artist | null>(null);
  const [justBacked, setJustBacked] = useState<Artist | null>(null);

  const alreadyBacked = useMemo(() => {
    const mine = new Set(
      BACKS.filter((b) => b.userId === CURRENT_USER_ID).map((b) => b.artistId)
    );
    extraBacks.forEach((b) => mine.add(b.artistId));
    return mine;
  }, [extraBacks]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? ARTISTS.filter(
          (a) => a.name.toLowerCase().includes(q) || a.genre.toLowerCase().includes(q)
        )
      : [...ARTISTS].sort((a, b) => a.listeners - b.listeners);
    return list.slice(0, 14);
  }, [query]);

  function confirm() {
    if (!pending) return;
    backArtist(pending.id, pending.listeners);
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
        <div className="text-sm text-muted">
          Picks left this week
        </div>
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
        placeholder="Search artists…"
        className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-[15px] outline-none placeholder:text-faint focus:border-accent/60"
      />

      {justBacked && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-accent/40 bg-accent/10 px-4 py-3">
          <div className="text-sm">
            <span className="font-semibold">{justBacked.name}</span> is on your Track Record at{" "}
            {formatListeners(justBacked.listeners)} monthly listeners.
          </div>
          <Link
            href={`/card/new-${justBacked.id}`}
            className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-black"
          >
            See the card
          </Link>
        </div>
      )}

      <div className="mt-8">
        <SectionTitle>{query ? "Results" : "Smallest artists first"}</SectionTitle>
        <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line">
          {results.map((a) => {
            const band = bandFor(a.listeners);
            const backed = alreadyBacked.has(a.id);
            return (
              <div
                key={a.id}
                className="flex items-center gap-4 bg-surface/50 px-4 py-3 transition-colors hover:bg-surface"
              >
                <Avatar name={a.name} size={40} rounded="rounded-lg" />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{a.name}</div>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-muted">
                    <span>{a.genre}</span>
                    <span className="text-faint">·</span>
                    <span className="font-mono">{formatListeners(a.listeners)} listeners</span>
                  </div>
                </div>
                <BandPill band={band} />
                {backed ? (
                  <span className="rounded-lg border border-line px-3 py-1.5 text-xs text-faint">
                    Backed
                  </span>
                ) : (
                  <button
                    onClick={() => setPending(a)}
                    disabled={picksLeft === 0}
                    className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-accent hover:text-black disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white/10 disabled:hover:text-ink"
                  >
                    Back
                  </button>
                )}
              </div>
            );
          })}
          {results.length === 0 && (
            <div className="bg-surface/50 px-4 py-8 text-center text-sm text-muted">
              No artists match “{query}”.
            </div>
          )}
        </div>
        <p className="mt-3 text-xs text-faint">
          Prototype note: this list is placeholder data. In the real build it&apos;s Spotify search,
          with monthly listeners from Songstats.
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
              <Avatar name={pending.name} size={48} rounded="rounded-xl" />
              <div>
                <div className="font-semibold tracking-tight">{pending.name}</div>
                <div className="text-xs text-muted">{pending.genre}</div>
              </div>
            </div>

            <dl className="mt-5 space-y-2 rounded-xl border border-line bg-surface p-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Monthly listeners</dt>
                <dd className="font-mono">{pending.listeners.toLocaleString()}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Band</dt>
                <dd>
                  <BandPill band={bandFor(pending.listeners)} />
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Dated</dt>
                <dd className="font-mono">today</dd>
              </div>
            </dl>

            <p className="mt-4 text-xs leading-relaxed text-muted">
              This is permanent. The number above is locked into your profile and can&apos;t be
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
