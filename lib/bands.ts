export type BandId = 1 | 2 | 3 | 4 | 5;

export type Band = {
  id: BandId;
  name: string;
  min: number;
  max: number | null;
  accent: string;
};

export const BANDS: Band[] = [
  { id: 1, name: "Underground", min: 0, max: 100_000, accent: "#7c8598" },
  { id: 2, name: "Cult Following", min: 100_000, max: 500_000, accent: "#a78bfa" },
  { id: 3, name: "Established", min: 500_000, max: 2_000_000, accent: "#2dd4bf" },
  { id: 4, name: "Mainstream", min: 2_000_000, max: 10_000_000, accent: "#fb923c" },
  { id: 5, name: "Superstar", min: 10_000_000, max: null, accent: "#f472b6" },
];

export function bandFor(listeners: number): Band {
  return BANDS.find((b) => b.max === null || listeners < b.max) ?? BANDS[4];
}

export const TIERS = ["none", "bronze", "silver", "gold", "diamond"] as const;
export type Tier = (typeof TIERS)[number];

export function tierFor(bandsGained: number): Tier {
  if (bandsGained <= 0) return "none";
  return TIERS[Math.min(bandsGained, 4)];
}

export const TIER_LABEL: Record<Tier, string> = {
  none: "Backed",
  bronze: "Bronze",
  silver: "Silver",
  gold: "Gold",
  diamond: "Diamond",
};

export function formatListeners(n: number): string {
  if (n >= 1_000_000) {
    const v = n / 1_000_000;
    return `${v >= 10 ? Math.round(v) : trim(v.toFixed(1))}m`;
  }
  if (n >= 1_000) {
    const v = n / 1_000;
    return `${v >= 10 ? Math.round(v) : trim(v.toFixed(1))}k`;
  }
  return String(n);
}

function trim(s: string) {
  return s.replace(/\.0$/, "");
}

export function formatGrowth(from: number, to: number): string {
  if (from <= 0) return "—";
  const mult = to / from;
  if (mult >= 10) return `×${Math.round(mult).toLocaleString()}`;
  const pct = (to - from) / from * 100;
  if (pct < 0) return `${pct.toFixed(0)}%`;
  return `+${pct.toFixed(0)}%`;
}

export function growthPct(from: number, to: number): number {
  if (from <= 0) return 0;
  return ((to - from) / from) * 100;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatMonthYear(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });
}
