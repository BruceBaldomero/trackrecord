import Link from "next/link";
import { Band, TIER_LABEL, Tier } from "@/lib/bands";
import { User } from "@/lib/data";

export function hashOf(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) % 100000;
  return h;
}

export function initialsOf(name: string): string {
  const words = name.replace(/[^\p{L}\p{N} ]/gu, "").split(/\s+/).filter(Boolean);
  if (words.length === 0) return "??";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

export function gradientFor(name: string): string {
  const h = hashOf(name);
  const a = h % 360;
  const b = (a + 48 + (h % 40)) % 360;
  return `linear-gradient(150deg, hsl(${a} 58% 30%), hsl(${b} 62% 16%) 70%, hsl(${a} 40% 10%))`;
}

export function Avatar({
  name,
  size = 44,
  rounded = "rounded-full",
}: {
  name: string;
  size?: number;
  rounded?: string;
}) {
  return (
    <div
      className={`${rounded} grid shrink-0 place-items-center font-semibold text-ink/90 ring-1 ring-white/10`}
      style={{
        width: size,
        height: size,
        background: gradientFor(name),
        fontSize: size * 0.36,
        letterSpacing: "0.02em",
      }}
    >
      {initialsOf(name)}
    </div>
  );
}

export function BandPill({ band, muted = false }: { band: Band; muted?: boolean }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap"
      style={{
        background: muted ? "rgba(255,255,255,0.05)" : `${band.accent}1f`,
        color: muted ? "var(--color-muted)" : band.accent,
        boxShadow: muted ? "none" : `inset 0 0 0 1px ${band.accent}33`,
      }}
    >
      <span
        className="size-1.5 rounded-full"
        style={{ background: muted ? "var(--color-faint)" : band.accent }}
      />
      {band.name}
    </span>
  );
}

export function TierChip({ tier }: { tier: Tier }) {
  if (tier === "none") {
    return (
      <span className="rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-muted uppercase backdrop-blur">
        Backed
      </span>
    );
  }
  return (
    <span className="tier-chip rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase">
      {TIER_LABEL[tier]}
    </span>
  );
}

export function UserLine({ user, size = 28 }: { user: User; size?: number }) {
  return (
    <Link
      href={`/u/${user.username}`}
      className="inline-flex items-center gap-2 text-ink transition-colors hover:text-accent"
    >
      <Avatar name={user.name} size={size} />
      <span className="text-sm font-medium">{user.name}</span>
      {user.kind === "publication" && (
        <span className="rounded bg-white/8 px-1.5 py-0.5 text-[10px] tracking-wide text-muted uppercase">
          Publication
        </span>
      )}
    </Link>
  );
}

export function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface/70 px-4 py-3">
      <div className="text-xl font-semibold tracking-tight">{value}</div>
      <div className="mt-0.5 text-xs text-muted">{label}</div>
    </div>
  );
}

export function SectionTitle({
  children,
  action,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <h2 className="text-sm font-semibold tracking-[0.16em] text-muted uppercase">{children}</h2>
      {action}
    </div>
  );
}
