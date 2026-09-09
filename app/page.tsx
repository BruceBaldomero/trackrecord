import Link from "next/link";
import { ArtistCard } from "@/components/ArtistCard";
import { BandPill, SectionTitle } from "@/components/ui";
import { BANDS, TIER_LABEL, Tier, formatListeners } from "@/lib/bands";
import { cardById, cardsForUser } from "@/lib/data";

const UPGRADES: { tier: Tier; bands: string; blurb: string }[] = [
  { tier: "bronze", bands: "+1 band", blurb: "They moved up one tier since you backed them." },
  { tier: "silver", bands: "+2 bands", blurb: "A real climb. You were early." },
  { tier: "gold", bands: "+3 bands", blurb: "Underground to mainstream on your watch." },
  { tier: "diamond", bands: "+4 bands", blurb: "Nobody to superstar. The rarest card there is." },
];

export default function Home() {
  const hero = cardById("b1");
  const showcase = cardsForUser("bruce").slice(0, 4);

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      {/* Hero */}
      <section className="grid items-center gap-10 py-16 md:grid-cols-[1.15fr_0.85fr] md:py-24">
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs text-muted">
            <span className="size-1.5 rounded-full bg-accent" />
            Early prototype
          </div>
          <h1 className="max-w-[12ch] text-4xl leading-[1.05] font-semibold tracking-tight text-balance sm:text-6xl">
            Back artists
            <br />
            <span className="text-accent">before they blow up.</span>
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted">
            When you back an artist, they&apos;re added to your profile forever — with the date you
            backed them and exactly how many monthly listeners they had at that moment. As they
            grow, your card upgrades.
          </p>
          <p className="mt-3 max-w-lg text-muted">
            No unfollowing. No deleting. Just a permanent record of your taste.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/back"
              className="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-black transition-opacity hover:opacity-90"
            >
              Back an artist
            </Link>
            <Link
              href="/u/bruce"
              className="rounded-xl border border-line bg-surface px-5 py-2.5 text-sm font-semibold transition-colors hover:border-white/25"
            >
              See a Track Record
            </Link>
          </div>
        </div>

        {hero && (
          <div className="relative mx-auto w-full max-w-[280px]">
            <div className="absolute -inset-8 -z-10 rounded-full bg-accent/10 blur-3xl" />
            <ArtistCard card={hero} />
            <p className="mt-4 text-center text-xs text-faint">
              Backed at {formatListeners(hero.listenersAtBacking)} monthly listeners. Now{" "}
              {formatListeners(hero.listenersNow)}.
            </p>
          </div>
        )}
      </section>

      {/* How it works */}
      <section className="border-t border-line py-16">
        <SectionTitle>How it works</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              n: "01",
              t: "Pick an artist",
              d: "Search any artist. We snapshot their monthly listeners the second you back them.",
            },
            {
              n: "02",
              t: "The card is permanent",
              d: "It sits on your profile with the date and number locked in. You can't take it back.",
            },
            {
              n: "03",
              t: "Watch it upgrade",
              d: "Every band they climb upgrades your card — Bronze, Silver, Gold, Diamond.",
            },
          ].map((s) => (
            <div key={s.n} className="rounded-2xl border border-line bg-surface/60 p-5">
              <div className="font-mono text-xs text-accent">{s.n}</div>
              <div className="mt-3 font-semibold tracking-tight">{s.t}</div>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bands */}
      <section className="border-t border-line py-16">
        <SectionTitle>The five bands</SectionTitle>
        <p className="mb-6 max-w-2xl text-muted">
          Artists sit in a band based on their monthly listeners. The lower the band when you back
          them, the more there is to gain.
        </p>
        <div className="overflow-hidden rounded-2xl border border-line">
          {BANDS.map((b, i) => (
            <div
              key={b.id}
              className={`flex items-center justify-between gap-4 px-5 py-4 ${
                i % 2 ? "bg-surface/40" : "bg-surface/70"
              }`}
            >
              <div className="flex items-center gap-4">
                <span className="w-6 font-mono text-sm text-faint">{b.id}</span>
                <BandPill band={b} />
              </div>
              <span className="font-mono text-sm text-muted">
                {b.max === null
                  ? `${formatListeners(b.min)}+`
                  : `${b.min === 0 ? "0" : formatListeners(b.min)} – ${formatListeners(b.max)}`}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Upgrades */}
      <section className="border-t border-line py-16">
        <SectionTitle>Card upgrades</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {UPGRADES.map((u) => (
            <div key={u.tier} className={`tier tier-${u.tier}`}>
              <div className="card-frame rounded-2xl p-[1.5px]">
                <div className="card-sheen relative overflow-hidden rounded-[15px] bg-surface p-5">
                  <div className="tier-chip inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase">
                    {TIER_LABEL[u.tier]}
                  </div>
                  <div className="mt-3 text-lg font-semibold tracking-tight">{u.bands}</div>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{u.blurb}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Showcase */}
      <section className="border-t border-line py-16">
        <SectionTitle
          action={
            <Link href="/u/bruce" className="text-sm text-accent hover:underline">
              View full profile →
            </Link>
          }
        >
          A track record in progress
        </SectionTitle>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {showcase.map((c) => (
            <ArtistCard key={c.id} card={c} />
          ))}
        </div>
      </section>
    </div>
  );
}
