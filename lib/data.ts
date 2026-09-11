import {
  Band,
  Tier,
  bandFor,
  growthPct,
  tierFor,
} from "./bands";

export type Artist = {
  id: string;
  name: string;
  genre: string;
  listeners: number;
};

export type User = {
  id: string;
  username: string;
  name: string;
  kind: "person" | "publication";
  bio: string;
};

export type Back = {
  id: string;
  userId: string;
  artistId: string;
  backedAt: string;
  listenersAtBacking: number;
};

export const ARTISTS: Artist[] = [
  { id: "chappell-roan", name: "Chappell Roan", genre: "Pop", listeners: 42_100_000 },
  { id: "sampha", name: "Sampha", genre: "Soul", listeners: 6_300_000 },
  { id: "fontaines-dc", name: "Fontaines D.C.", genre: "Post-punk", listeners: 5_240_000 },
  { id: "brockhampton", name: "BROCKHAMPTON", genre: "Hip hop", listeners: 4_760_000 },
  { id: "pinkpantheress", name: "PinkPantheress", genre: "Alt pop", listeners: 8_420_000 },
  { id: "alex-g", name: "Alex G", genre: "Indie rock", listeners: 4_180_000 },
  { id: "earl-sweatshirt", name: "Earl Sweatshirt", genre: "Hip hop", listeners: 3_900_000 },
  { id: "loyle-carner", name: "Loyle Carner", genre: "Hip hop", listeners: 3_450_000 },
  { id: "mk-gee", name: "MK.gee", genre: "Alternative", listeners: 2_600_000 },
  { id: "the-dare", name: "The Dare", genre: "Dance punk", listeners: 2_100_000 },
  { id: "panda-bear", name: "Panda Bear", genre: "Psych pop", listeners: 1_900_000 },
  { id: "wet-leg", name: "Wet Leg", genre: "Indie rock", listeners: 1_410_000 },
  { id: "la-lom", name: "LA LOM", genre: "Cumbia", listeners: 1_120_000 },
  { id: "joy-orbison", name: "Joy Orbison", genre: "Electronic", listeners: 1_050_000 },
  { id: "wednesday", name: "Wednesday", genre: "Indie rock", listeners: 780_000 },
  { id: "sofia-kourtesis", name: "Sofia Kourtesis", genre: "House", listeners: 720_000 },
  { id: "bar-italia", name: "bar italia", genre: "Indie", listeners: 640_000 },
  { id: "jane-remover", name: "Jane Remover", genre: "Hyperpop", listeners: 610_000 },
  { id: "english-teacher", name: "English Teacher", genre: "Indie", listeners: 520_000 },
  { id: "geordie-greep", name: "Geordie Greep", genre: "Art rock", listeners: 480_000 },
  { id: "saya-gray", name: "Saya Gray", genre: "Alternative", listeners: 470_000 },
  { id: "mike", name: "MIKE", genre: "Abstract hip hop", listeners: 412_000 },
  { id: "kara-jackson", name: "Kara Jackson", genre: "Folk", listeners: 390_000 },
  { id: "nourished-by-time", name: "Nourished by Time", genre: "Alt R&B", listeners: 340_000 },
  { id: "cindy-lee", name: "Cindy Lee", genre: "Lo-fi pop", listeners: 285_000 },
  { id: "deki-alem", name: "Deki Alem", genre: "Alt hip hop", listeners: 210_000 },
  { id: "horsegirl", name: "Horsegirl", genre: "Indie rock", listeners: 165_000 },
  { id: "yaya-bey", name: "Yaya Bey", genre: "Neo-soul", listeners: 96_000 },
  { id: "tapir", name: "Tapir!", genre: "Indie folk", listeners: 88_000 },
  { id: "blue-bendy", name: "Blue Bendy", genre: "Post-punk", listeners: 41_000 },
];

export const USERS: User[] = [
  { id: "bruce", username: "bruce", name: "Bruce", kind: "person", bio: "Rap, post-punk, and whatever Chap sends me." },
  { id: "jack", username: "jack", name: "Jack", kind: "person", bio: "Found BROCKHAMPTON in 2017. Still bringing it up." },
  { id: "maia", username: "maia", name: "Maia", kind: "person", bio: "Hyperpop apologist." },
  { id: "pitchfork", username: "pitchfork", name: "Pitchfork", kind: "publication", bio: "Ones to Watch lists, 2023–2025. Auto-backed from published articles." },
];

export const CURRENT_USER_ID = "bruce";

export const BACKS: Back[] = [
  // Bruce
  { id: "b1", userId: "bruce", artistId: "chappell-roan", backedAt: "2020-03-14", listenersAtBacking: 22_000 },
  { id: "b2", userId: "bruce", artistId: "fontaines-dc", backedAt: "2018-09-02", listenersAtBacking: 84_000 },
  { id: "b3", userId: "bruce", artistId: "alex-g", backedAt: "2017-11-20", listenersAtBacking: 190_000 },
  { id: "b4", userId: "bruce", artistId: "pinkpantheress", backedAt: "2021-02-11", listenersAtBacking: 310_000 },
  { id: "b5", userId: "bruce", artistId: "mike", backedAt: "2018-01-22", listenersAtBacking: 48_000 },
  { id: "b6", userId: "bruce", artistId: "wet-leg", backedAt: "2021-06-30", listenersAtBacking: 62_000 },
  { id: "b7", userId: "bruce", artistId: "cindy-lee", backedAt: "2023-08-01", listenersAtBacking: 96_000 },
  { id: "b8", userId: "bruce", artistId: "geordie-greep", backedAt: "2024-10-05", listenersAtBacking: 140_000 },
  { id: "b9", userId: "bruce", artistId: "yaya-bey", backedAt: "2022-05-18", listenersAtBacking: 71_000 },

  // Jack
  { id: "j1", userId: "jack", artistId: "mike", backedAt: "2018-01-04", listenersAtBacking: 44_000 },
  { id: "j2", userId: "jack", artistId: "mk-gee", backedAt: "2021-09-19", listenersAtBacking: 74_000 },
  { id: "j3", userId: "jack", artistId: "brockhampton", backedAt: "2017-04-12", listenersAtBacking: 130_000 },
  { id: "j4", userId: "jack", artistId: "la-lom", backedAt: "2023-03-08", listenersAtBacking: 52_000 },
  { id: "j5", userId: "jack", artistId: "sampha", backedAt: "2016-02-02", listenersAtBacking: 620_000 },
  { id: "j6", userId: "jack", artistId: "nourished-by-time", backedAt: "2023-05-04", listenersAtBacking: 38_000 },
  { id: "j7", userId: "jack", artistId: "blue-bendy", backedAt: "2024-01-15", listenersAtBacking: 12_000 },

  // Maia
  { id: "m1", userId: "maia", artistId: "jane-remover", backedAt: "2022-07-14", listenersAtBacking: 90_000 },
  { id: "m2", userId: "maia", artistId: "the-dare", backedAt: "2023-06-21", listenersAtBacking: 180_000 },
  { id: "m3", userId: "maia", artistId: "horsegirl", backedAt: "2021-11-02", listenersAtBacking: 22_000 },
  { id: "m4", userId: "maia", artistId: "saya-gray", backedAt: "2022-02-09", listenersAtBacking: 60_000 },

  // Pitchfork (seeded from published "ones to watch" lists)
  { id: "p1", userId: "pitchfork", artistId: "english-teacher", backedAt: "2024-01-09", listenersAtBacking: 60_000 },
  { id: "p2", userId: "pitchfork", artistId: "wednesday", backedAt: "2023-01-10", listenersAtBacking: 95_000 },
  { id: "p3", userId: "pitchfork", artistId: "kara-jackson", backedAt: "2023-01-10", listenersAtBacking: 25_000 },
  { id: "p4", userId: "pitchfork", artistId: "bar-italia", backedAt: "2023-01-10", listenersAtBacking: 140_000 },
  { id: "p5", userId: "pitchfork", artistId: "tapir", backedAt: "2024-01-09", listenersAtBacking: 30_000 },
];

export type Card = {
  id: string;
  user: User;
  artist: Artist;
  backedAt: string;
  listenersAtBacking: number;
  listenersNow: number;
  bandAtBacking: Band;
  bandNow: Band;
  bandsGained: number;
  tier: Tier;
};

export function artistById(id: string): Artist | undefined {
  return ARTISTS.find((a) => a.id === id);
}

export function userById(id: string): User | undefined {
  return USERS.find((u) => u.id === id);
}

export function userByUsername(username: string): User | undefined {
  return USERS.find((u) => u.username === username);
}

export function toCard(back: Back): Card | null {
  const artist = artistById(back.artistId);
  const user = userById(back.userId);
  if (!artist || !user) return null;
  const bandAtBacking = bandFor(back.listenersAtBacking);
  const bandNow = bandFor(artist.listeners);
  const bandsGained = bandNow.id - bandAtBacking.id;
  return {
    id: back.id,
    user,
    artist,
    backedAt: back.backedAt,
    listenersAtBacking: back.listenersAtBacking,
    listenersNow: artist.listeners,
    bandAtBacking,
    bandNow,
    bandsGained,
    tier: tierFor(bandsGained),
  };
}

export function cardsForUser(userId: string, extraBacks: Back[] = []): Card[] {
  return [...BACKS, ...extraBacks]
    .filter((b) => b.userId === userId)
    .map(toCard)
    .filter((c): c is Card => c !== null)
    .sort((a, b) => b.bandsGained - a.bandsGained || +new Date(a.backedAt) - +new Date(b.backedAt));
}

export function cardById(id: string, extraBacks: Back[] = []): Card | null {
  const back = [...BACKS, ...extraBacks].find((b) => b.id === id);
  return back ? toCard(back) : null;
}

export function backersOf(artistId: string, extraBacks: Back[] = []): Card[] {
  return [...BACKS, ...extraBacks]
    .filter((b) => b.artistId === artistId)
    .map(toCard)
    .filter((c): c is Card => c !== null)
    .sort((a, b) => +new Date(a.backedAt) - +new Date(b.backedAt));
}

export type ProfileStats = {
  cards: number;
  upgraded: number;
  avgGrowth: number;
  bestTier: Tier;
};

export function statsFor(cards: Card[]): ProfileStats {
  const upgraded = cards.filter((c) => c.bandsGained > 0).length;
  const avgGrowth = cards.length
    ? cards.reduce((sum, c) => sum + growthPct(c.listenersAtBacking, c.listenersNow), 0) / cards.length
    : 0;
  const best = cards.reduce((m, c) => Math.max(m, c.bandsGained), 0);
  return { cards: cards.length, upgraded, avgGrowth, bestTier: tierFor(best) };
}

export type ActivityItem = {
  id: string;
  kind: "back" | "upgrade";
  user: User;
  artist: Artist;
  at: string;
  tier?: Tier;
  cardId: string;
};

export const ACTIVITY: ActivityItem[] = [
  { id: "a1", kind: "upgrade", user: userById("jack")!, artist: artistById("mk-gee")!, at: "2026-09-08", tier: "gold", cardId: "j2" },
  { id: "a2", kind: "back", user: userById("maia")!, artist: artistById("saya-gray")!, at: "2026-09-07", cardId: "m4" },
  { id: "a3", kind: "upgrade", user: userById("bruce")!, artist: artistById("cindy-lee")!, at: "2026-09-05", tier: "bronze", cardId: "b7" },
  { id: "a4", kind: "back", user: userById("jack")!, artist: artistById("blue-bendy")!, at: "2026-09-03", cardId: "j7" },
  { id: "a5", kind: "upgrade", user: userById("pitchfork")!, artist: artistById("english-teacher")!, at: "2026-08-29", tier: "silver", cardId: "p1" },
  { id: "a6", kind: "back", user: userById("maia")!, artist: artistById("the-dare")!, at: "2026-08-24", cardId: "m2" },
  { id: "a7", kind: "upgrade", user: userById("jack")!, artist: artistById("la-lom")!, at: "2026-08-19", tier: "silver", cardId: "j4" },
];

/** Deterministic monthly listener series between backing and now, for card charts. */
export function listenerHistory(card: Card): { date: string; value: number }[] {
  const start = new Date(card.backedAt);
  const end = new Date("2026-09-09");
  const months = Math.max(
    2,
    (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())
  );
  const points: { date: string; value: number }[] = [];
  let seed = 0;
  for (let i = 0; i < card.id.length; i++) seed += card.id.charCodeAt(i);

  for (let i = 0; i <= months; i++) {
    const t = i / months;
    // Ease-in growth curve: slow at first, accelerating.
    const eased = Math.pow(t, 1.8);
    const base = card.listenersAtBacking + (card.listenersNow - card.listenersAtBacking) * eased;
    const noise = Math.sin((i + seed) * 1.7) * 0.035 + Math.sin((i + seed) * 0.6) * 0.02;
    const flat = i === 0 || i === months;
    const value = Math.max(1000, Math.round(base * (1 + (flat ? 0 : noise))));
    const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
    points.push({
      date: d.toISOString().slice(0, 10),
      value: i === months ? card.listenersNow : i === 0 ? card.listenersAtBacking : value,
    });
  }
  return points;
}
