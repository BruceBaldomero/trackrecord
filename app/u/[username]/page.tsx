"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { ArtistCard } from "@/components/ArtistCard";
import { Avatar, SectionTitle, Stat } from "@/components/ui";
import { TIER_LABEL, Tier, formatDate } from "@/lib/bands";
import { CURRENT_USER_ID, USERS, cardsForUser, statsFor, userByUsername } from "@/lib/data";
import { useStore } from "@/lib/store";

const FILTERS: { key: "all" | Tier; label: string }[] = [
  { key: "all", label: "All" },
  { key: "diamond", label: "Diamond" },
  { key: "gold", label: "Gold" },
  { key: "silver", label: "Silver" },
  { key: "bronze", label: "Bronze" },
  { key: "none", label: "Unmoved" },
];

export default function ProfilePage() {
  const params = useParams<{ username: string }>();
  const { extraBacks } = useStore();
  const [filter, setFilter] = useState<"all" | Tier>("all");
  const [following, setFollowing] = useState(false);

  const user = userByUsername(params.username);

  const cards = useMemo(
    () => (user ? cardsForUser(user.id, user.id === CURRENT_USER_ID ? extraBacks : []) : []),
    [user, extraBacks]
  );
  const stats = useMemo(() => statsFor(cards), [cards]);

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
        <h1 className="text-2xl font-semibold">No such profile</h1>
        <Link href="/" className="mt-4 inline-block text-accent hover:underline">
          Back home
        </Link>
      </div>
    );
  }

  const isMe = user.id === CURRENT_USER_ID;
  const visible = filter === "all" ? cards : cards.filter((c) => c.tier === filter);
  const earliest = cards.reduce<string | null>(
    (min, c) => (!min || c.backedAt < min ? c.backedAt : min),
    null
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      {/* Header */}
      <div className="flex flex-wrap items-start gap-5">
        <Avatar name={user.name} size={80} rounded="rounded-2xl" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight">{user.name}</h1>
            {user.kind === "publication" && (
              <span className="rounded-full bg-white/8 px-2.5 py-1 text-[11px] tracking-wide text-muted uppercase">
                Publication
              </span>
            )}
          </div>
          <div className="mt-1 font-mono text-sm text-faint">@{user.username}</div>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">{user.bio}</p>
          {earliest && (
            <p className="mt-2 text-xs text-faint">
              Backing artists since {formatDate(earliest)}
            </p>
          )}
        </div>
        {!isMe && (
          <button
            onClick={() => setFollowing((f) => !f)}
            className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors ${
              following
                ? "border border-line text-muted hover:text-ink"
                : "bg-accent text-black hover:opacity-90"
            }`}
          >
            {following ? "Following" : "Follow"}
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat value={String(stats.cards)} label="Cards" />
        <Stat value={String(stats.upgraded)} label="Upgraded" />
        <Stat
          value={`${stats.avgGrowth >= 0 ? "+" : ""}${Math.round(stats.avgGrowth).toLocaleString()}%`}
          label="Avg. growth since backing"
        />
        <Stat value={TIER_LABEL[stats.bestTier]} label="Best card" />
      </div>

      {/* Cards */}
      <div className="mt-12">
        <SectionTitle
          action={
            <div className="flex flex-wrap gap-1">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`rounded-lg px-2.5 py-1 text-xs transition-colors ${
                    filter === f.key ? "bg-white/10 text-ink" : "text-muted hover:text-ink"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          }
        >
          Track Record
        </SectionTitle>

        {visible.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {visible.map((c) => (
              <ArtistCard key={c.id} card={c} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-line px-6 py-16 text-center text-muted">
            Nothing in this tier yet.
          </div>
        )}
      </div>

      {/* Other profiles */}
      <div className="mt-16 border-t border-line pt-10">
        <SectionTitle>Other track records</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-3">
          {USERS.filter((u) => u.id !== user.id).map((u) => {
            const s = statsFor(cardsForUser(u.id));
            return (
              <Link
                key={u.id}
                href={`/u/${u.username}`}
                className="flex items-center gap-3 rounded-xl border border-line bg-surface/60 p-4 transition-colors hover:border-white/25"
              >
                <Avatar name={u.name} size={40} />
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{u.name}</div>
                  <div className="text-xs text-muted">
                    {s.cards} cards · {s.upgraded} upgraded
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
