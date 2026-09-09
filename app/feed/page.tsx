"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Avatar, SectionTitle, TierChip } from "@/components/ui";
import { formatDate, formatListeners } from "@/lib/bands";
import {
  ACTIVITY,
  ActivityItem,
  CURRENT_USER_ID,
  USERS,
  cardsForUser,
  statsFor,
  toCard,
  userById,
} from "@/lib/data";
import { useStore } from "@/lib/store";

export default function FeedPage() {
  const { extraBacks } = useStore();

  const items: ActivityItem[] = useMemo(() => {
    const mine = extraBacks
      .map(toCard)
      .filter((c) => c !== null)
      .map((c) => ({
        id: `own-${c!.id}`,
        kind: "back" as const,
        user: c!.user,
        artist: c!.artist,
        at: c!.backedAt,
        cardId: c!.id,
      }));
    return [...mine, ...ACTIVITY];
  }, [extraBacks]);

  const leaderboard = useMemo(
    () =>
      USERS.map((u) => ({ user: u, stats: statsFor(cardsForUser(u.id)) })).sort(
        (a, b) => b.stats.upgraded - a.stats.upgraded || b.stats.avgGrowth - a.stats.avgGrowth
      ),
    []
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight">Feed</h1>
      <p className="mt-2 text-muted">What the people you follow are backing, and whose cards moved.</p>

      <div className="mt-10 grid gap-10 md:grid-cols-[1fr_260px]">
        <div>
          <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line">
            {items.map((item) => (
              <Link
                key={item.id}
                href={`/card/${item.cardId}`}
                className="flex items-center gap-4 bg-surface/50 px-4 py-4 transition-colors hover:bg-surface"
              >
                <Avatar name={item.user.name} size={36} />
                <div className="min-w-0 flex-1">
                  <div className="text-sm leading-snug">
                    <span className="font-semibold">
                      {item.user.id === CURRENT_USER_ID ? "You" : item.user.name}
                    </span>{" "}
                    {item.kind === "back" ? (
                      <>
                        backed <span className="font-medium">{item.artist.name}</span>
                      </>
                    ) : (
                      <>
                        &apos;s <span className="font-medium">{item.artist.name}</span> card
                        upgraded
                      </>
                    )}
                  </div>
                  <div className="mt-0.5 text-xs text-muted">
                    {formatDate(item.at)} · {formatListeners(item.artist.listeners)} listeners now
                  </div>
                </div>
                {item.kind === "upgrade" && item.tier && (
                  <div className={`tier tier-${item.tier}`}>
                    <TierChip tier={item.tier} />
                  </div>
                )}
              </Link>
            ))}
          </div>
        </div>

        <aside>
          <SectionTitle>Best scouts</SectionTitle>
          <div className="space-y-2">
            {leaderboard.map(({ user, stats }, i) => (
              <Link
                key={user.id}
                href={`/u/${user.username}`}
                className="flex items-center gap-3 rounded-xl border border-line bg-surface/60 px-3 py-2.5 transition-colors hover:border-white/25"
              >
                <span className="w-4 font-mono text-xs text-faint">{i + 1}</span>
                <Avatar name={user.name} size={28} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm">{user.name}</div>
                  <div className="text-[11px] text-muted">{stats.upgraded} upgraded</div>
                </div>
              </Link>
            ))}
          </div>
          <p className="mt-4 text-xs leading-relaxed text-faint">
            Publications get seeded profiles from their &ldquo;ones to watch&rdquo; lists, so the
            site isn&apos;t empty on day one — and you can see which ones actually call it right.
          </p>
          <Link
            href={`/u/${userById("pitchfork")!.username}`}
            className="mt-3 inline-block text-xs text-accent hover:underline"
          >
            See Pitchfork&apos;s record →
          </Link>
        </aside>
      </div>
    </div>
  );
}
