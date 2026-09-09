import Link from "next/link";
import { formatDate, formatGrowth, formatListeners } from "@/lib/bands";
import { Card } from "@/lib/data";
import { BandPill, TierChip, gradientFor, initialsOf } from "./ui";

export function ArtistCard({ card, showOwner = false }: { card: Card; showOwner?: boolean }) {
  return (
    <Link href={`/card/${card.id}`} className={`tier tier-${card.tier} block`}>
      <div className="card-frame rounded-2xl p-[1.5px]">
        <div className="overflow-hidden rounded-[15px] bg-surface">
          <div
            className="card-sheen grain relative aspect-4/3"
            style={{ background: gradientFor(card.artist.name) }}
          >
            <div className="absolute inset-0 grid place-items-center">
              <span className="text-4xl font-bold tracking-tight text-white/85 drop-shadow-lg">
                {initialsOf(card.artist.name)}
              </span>
            </div>
            <div className="absolute top-2.5 right-2.5">
              <TierChip tier={card.tier} />
            </div>
            {card.bandsGained > 0 && (
              <div className="absolute bottom-2.5 left-2.5 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-semibold text-white/90 backdrop-blur">
                +{card.bandsGained} band{card.bandsGained > 1 ? "s" : ""}
              </div>
            )}
          </div>

          <div className="space-y-2 p-3">
            <div>
              <div className="truncate text-[15px] font-semibold tracking-tight">
                {card.artist.name}
              </div>
              <div className="truncate text-xs text-muted">
                {showOwner ? `${card.user.name} · ` : ""}
                Backed {formatDate(card.backedAt)}
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 border-t border-line pt-2">
              <div className="font-mono text-xs text-muted">
                <span className="text-ink/80">{formatListeners(card.listenersAtBacking)}</span>
                <span className="mx-1 text-faint">→</span>
                <span className="text-ink/80">{formatListeners(card.listenersNow)}</span>
              </div>
              <div
                className={`font-mono text-xs font-semibold ${
                  card.listenersNow >= card.listenersAtBacking ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {formatGrowth(card.listenersAtBacking, card.listenersNow)}
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[11px]">
              <BandPill band={card.bandAtBacking} muted />
              <span className="text-faint">→</span>
              <BandPill band={card.bandNow} />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
