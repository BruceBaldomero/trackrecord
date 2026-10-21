"use client";

import Link from "next/link";
import { useState } from "react";
import { BackedArtistInput, useStore } from "@/lib/store";

export function BackButton({ artist }: { artist: BackedArtistInput }) {
  const { backArtist, picksLeft, extraBacks } = useStore();
  const [confirming, setConfirming] = useState(false);

  const alreadyBacked = extraBacks.some((b) => b.artistId === artist.externalId);

  if (alreadyBacked) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-xl border border-line px-5 py-2.5 text-sm text-muted">
          Already on your Track Record
        </span>
        <Link
          href={`/card/new-${artist.externalId}`}
          className="text-sm text-accent hover:underline"
        >
          See the card →
        </Link>
      </div>
    );
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        disabled={picksLeft === 0}
        className="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {picksLeft === 0 ? "No picks left this week" : `Back ${artist.name}`}
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-accent/40 bg-accent/10 p-4">
      <p className="text-sm">
        This is permanent. <span className="font-semibold">{artist.name}</span> joins your profile
        with today&apos;s date, and can&apos;t be removed or edited later.
      </p>
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => setConfirming(false)}
          className="rounded-lg border border-line px-4 py-2 text-sm text-muted transition-colors hover:text-ink"
        >
          Cancel
        </button>
        <button
          onClick={() => backArtist(artist)}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-black"
        >
          Yes, back them
        </button>
      </div>
    </div>
  );
}
