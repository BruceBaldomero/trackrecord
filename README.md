# Track Record

Back artists you believe in. Every pick is permanent, timestamped with their monthly listeners at
that moment, and upgrades as they grow.

This repo is currently a **clickable prototype** — the full UI running on placeholder data, so the
idea can be looked at and argued with before any money is spent on APIs or hosting.

## Run it

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## What's here

| Route            | What it shows                                                            |
| ---------------- | ------------------------------------------------------------------------ |
| `/`              | The pitch: how backing works, the five bands, card upgrade tiers          |
| `/back`          | Search artists and back one — with a confirmation that it's permanent     |
| `/u/[username]`  | A profile: stats plus the full grid of Artist Cards, filterable by tier   |
| `/card/[id]`     | A single card: the shareable "receipt", growth chart, and who else backed |
| `/feed`          | Friends' backs and upgrades, plus a best-scouts leaderboard               |

Backing an artist works for real in the prototype — the card is created and persists in the
browser's local storage, so you can click through the whole loop. There's a 3-picks-per-week limit
wired in to keep picks scarce (and, later, to keep API costs down).

Try `/u/bruce`, `/u/jack`, `/u/maia` and `/u/pitchfork` — the last one demonstrates seeding
publication profiles from their "ones to watch" lists, so the site isn't empty on day one.

## Bands and upgrades

Artists sit in a band by monthly listeners:

| Band | Name           | Monthly listeners |
| ---- | -------------- | ----------------- |
| 1    | Underground    | < 100k            |
| 2    | Cult Following | 100k – 500k       |
| 3    | Established    | 500k – 2m         |
| 4    | Mainstream     | 2m – 10m          |
| 5    | Superstar      | 10m+              |

Every band an artist climbs after you back them upgrades the card: +1 Bronze, +2 Silver, +3 Gold,
+4 Diamond.

## What is NOT real yet

- **All artists and listener numbers are placeholder data** (`lib/data.ts`). No API is called.
- **No accounts.** There's a single hardcoded "you" (Bruce); Follow buttons are cosmetic.
- **No database.** New backs live in local storage and disappear if you clear it.

## The intended real build

- **Artist search** — Spotify Web API (client-credentials, server-side). Free.
- **Monthly listeners** — Songstats (~€0.025 per unique artist per month, €20/month minimum).
  Spotify's own API does not expose monthly listeners, which is why a third party is needed.
- **Snapshots** — the listener count is captured server-side the moment a user backs an artist and
  stored permanently; a weekly scheduled job refreshes the current count for every backed artist.
- **Database + auth** — Postgres (Supabase), which also covers login.
- **Hosting** — Vercel, with the weekly refresh running as a cron job.

## Structure

```
app/          routes (landing, back, profile, card, feed)
components/   ArtistCard, Nav, Sparkline, shared UI
lib/bands.ts  band thresholds, tier logic, number formatting
lib/data.ts   placeholder artists/users/backs + card computation
lib/store.tsx client-side store for backs made during the demo
```

`lib/bands.ts` is the piece worth keeping as-is — the band and upgrade rules there are the actual
product logic, and they'll move server-side unchanged.
