"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { ArtistCard } from "@/components/ArtistCard";
import { Sparkline } from "@/components/Sparkline";
import { Avatar, BandPill, SectionTitle } from "@/components/ui";
import {
  TIER_LABEL,
  formatDate,
  formatGrowth,
  formatListeners,
  formatMonthYear,
} from "@/lib/bands";
import { backersOf, cardById, listenerHistory } from "@/lib/data";
import { useStore } from "@/lib/store";

export default function CardPage() {
  const params = useParams<{ id: string }>();
  const { extraBacks } = useStore();
  const [copied, setCopied] = useState(false);

  const card = useMemo(() => cardById(params.id, extraBacks), [params.id, extraBacks]);
  const backers = useMemo(
    () => (card ? backersOf(card.artist.id, extraBacks) : []),
    [card, extraBacks]
  );
  const history = useMemo(() => (card ? listenerHistory(card) : []), [card]);

  if (!card) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
        <h1 className="text-2xl font-semibold">Card not found</h1>
        <Link href="/" className="mt-4 inline-block text-accent hover:underline">
          Back home
        </Link>
      </div>
    );
  }

  const rank = backers.findIndex((b) => b.id === card.id) + 1;
  const accent = card.bandNow.accent;

  async function share() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable in this context.
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <Link href={`/u/${card.user.username}`} className="text-sm text-muted hover:text-ink">
        ← {card.user.name}&apos;s Track Record
      </Link>

      <div className="mt-6 grid gap-10 md:grid-cols-[300px_1fr]">
        <div>
          <ArtistCard card={card} />
        </div>

        <div className="min-w-0">
          {/* The receipt */}
          <div className="rounded-2xl border border-line bg-surface/70 p-6">
            <div className="text-xs tracking-[0.16em] text-faint uppercase">Receipt</div>
            <p className="mt-3 text-xl leading-relaxed font-medium tracking-tight sm:text-2xl">
              <Link href={`/u/${card.user.username}`} className="hover:text-accent">
                {card.user.name}
              </Link>{" "}
              backed{" "}
              <span className="text-accent">{card.artist.name}</span> in{" "}
              {formatMonthYear(card.backedAt)} at{" "}
              <span className="font-mono">{card.listenersAtBacking.toLocaleString()}</span> monthly
              listeners.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                onClick={share}
                className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-black transition-opacity hover:opacity-90"
              >
                {copied ? "Link copied" : "Share this card"}
              </button>
              <span className="text-xs text-faint">
                Anyone with the link sees the card and the date — proof, not a screenshot.
              </span>
            </div>
          </div>

          {/* Numbers */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-line bg-surface/60 px-4 py-3">
              <div className="text-xs text-muted">At backing</div>
              <div className="mt-1 font-mono text-lg">
                {formatListeners(card.listenersAtBacking)}
              </div>
            </div>
            <div className="rounded-xl border border-line bg-surface/60 px-4 py-3">
              <div className="text-xs text-muted">Today</div>
              <div className="mt-1 font-mono text-lg">{formatListeners(card.listenersNow)}</div>
            </div>
            <div className="rounded-xl border border-line bg-surface/60 px-4 py-3">
              <div className="text-xs text-muted">Growth</div>
              <div className="mt-1 font-mono text-lg text-emerald-400">
                {formatGrowth(card.listenersAtBacking, card.listenersNow)}
              </div>
            </div>
          </div>

          {/* Band journey */}
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-line bg-surface/60 px-4 py-3.5">
            <BandPill band={card.bandAtBacking} muted />
            <span className="text-faint">→</span>
            <BandPill band={card.bandNow} />
            <span className="ml-auto text-sm text-muted">
              {card.bandsGained > 0
                ? `${TIER_LABEL[card.tier]} card · +${card.bandsGained} band${
                    card.bandsGained > 1 ? "s" : ""
                  }`
                : "No band change yet"}
            </span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <section className="mt-14">
        <SectionTitle>Monthly listeners since backing</SectionTitle>
        <div className="rounded-2xl border border-line bg-surface/60 p-5">
          <Sparkline points={history} color={accent} />
          <div className="mt-2 flex justify-between text-xs text-faint">
            <span>{formatDate(card.backedAt)}</span>
            <span>Today</span>
          </div>
        </div>
      </section>

      {/* Other backers */}
      <section className="mt-14">
        <SectionTitle>
          Who else backed {card.artist.name}
        </SectionTitle>
        <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line">
          {backers.map((b, i) => (
            <Link
              key={b.id}
              href={`/card/${b.id}`}
              className={`flex items-center gap-4 px-4 py-3 transition-colors hover:bg-surface ${
                b.id === card.id ? "bg-accent/8" : "bg-surface/50"
              }`}
            >
              <span className="w-5 font-mono text-sm text-faint">{i + 1}</span>
              <Avatar name={b.user.name} size={32} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{b.user.name}</div>
                <div className="text-xs text-muted">{formatDate(b.backedAt)}</div>
              </div>
              <span className="font-mono text-xs text-muted">
                {formatListeners(b.listenersAtBacking)}
              </span>
            </Link>
          ))}
        </div>
        {rank > 0 && backers.length > 1 && (
          <p className="mt-3 text-xs text-faint">
            {card.user.name} was {rank === 1 ? "the first" : `#${rank}`} of {backers.length} to back{" "}
            {card.artist.name}.
          </p>
        )}
      </section>
    </div>
  );
}
