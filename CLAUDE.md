@AGENTS.md

# Track Record — working rules

Users "back" artists they think will grow. Each backing is a permanent, timestamped card
recording the artist's Spotify monthly listeners at that moment. Cards upgrade
(Bronze → Diamond) as the artist climbs listener bands.

Built by Bruce (developer) with Jack (product). Pre-launch, no users yet.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · Vitest.
Planned: Supabase (Postgres + auth), Vercel hosting, Vercel Cron for the weekly refresh.

Next.js is not optional here: the data-provider key must stay server-side and the weekly
refresh needs a scheduled server job. Don't propose a static/SPA host.

## Before pushing

All three must pass:

```bash
npm run lint
npm test
npm run build
```

Fetch and merge `main` first — someone else may have pushed.

Commits are authored by Bruce, with Claude as the committer (this is a personal project, so
Bruce's name belongs on the work):

```bash
GIT_COMMITTER_NAME="Claude" GIT_COMMITTER_EMAIL="noreply@anthropic.com" git commit ...
```

`user.name` / `user.email` stay set to Bruce. Git has no config key for the committer, so
the environment variables go on each commit.

## Product invariants

These are promises made to users. Breaking one silently is worse than shipping late.

- **Backings are immutable.** Never write an `UPDATE` or `DELETE` against a backing. When
  the database lands, enforce this with RLS (`INSERT` + `SELECT` only, for everyone
  including admins) rather than relying on discipline. "You can't take it back" is the
  product.
- **Band thresholds are frozen once live.** They're in `lib/bands.ts`. Changing a boundary
  retroactively re-tiers every existing card — someone's Gold silently becomes a Silver.
  If bands must change (e.g. splitting the very wide 0–100k band), that's a migration with
  a decision about existing cards, not an edit to the array.
- **Backdated rows must be visibly labelled.** Seeding publication profiles from dated
  "ones to watch" articles is legitimate. Writing 2026 rows that pass as 2024 clicks is
  not. Seeded backings need a flag and a badge on the card.
- **Never backdate our own profiles.** Same reason.

## Dates

A backing date is a **calendar day**, not an instant. `new Date("2020-03-14")` parses as
UTC midnight and renders as the 13th west of UTC.

Use `parseDay()`, `toISODay()` and `todayISO()` from `lib/bands.ts`. Never `new Date(iso)`
on a date string, and never `.toISOString().slice(0, 10)` to get "today".

The Vitest suite runs under `TZ=America/New_York` on purpose so this class of bug fails in
CI instead of only for users abroad.

## Secrets and cost

The project has to stay close to free while it's unvalidated.

- **The Songstats key is server-side only** — route handlers or server components, read from
  an environment variable. Never `NEXT_PUBLIC_*`, never committed, never in the client
  bundle. A leaked key burns a real budget on Jack's account.
- **Songstats bills per unique artist per calendar month**, with a €20/month floor. Refresh
  frequency is therefore free; the *number of distinct artists touched in a month* is what
  costs. Don't add per-user or per-page-view artist fetches.
- **The weekly refresh must page past 1000 rows.** Supabase returns at most 1000 per query;
  a refresh job that doesn't paginate will silently update only the first 1000 artists and
  the rest just quietly stop moving.
- Stay on free tiers (Supabase, Vercel) unless we agree otherwise.

## Artist data source — UNRESOLVED, do not assume Spotify

**Spotify's Web API is not available to this project.** Since Feb 2026 development mode is
capped at **5 users** and requires the app owner to hold Spotify Premium; extended quota
mode requires a registered organisation with **250k+ monthly active users**. A pre-launch
consumer app cannot get from one to the other. Earlier versions of this file and Jack's
proposal doc both assumed free Spotify search — that assumption is wrong.

Artist search, artist images and monthly listeners therefore need a provider that is
actually open to us. Preferred: Songstats for all three, if their API does search and
serves images (open question with Evan at Songstats). Fallbacks: MusicBrainz (free,
canonical IDs, ~1 req/sec, needs a descriptive User-Agent, no images), iTunes Search (no
auth), Discogs (token, weak images), with images from Wikidata or Discogs subject to
licensing.

Until this is settled, do not build a Spotify client. Model artists with a generic
`external_id` + `source` so the provider can change without a migration.

## Testing

- `lib/bands.ts` is the product logic — band boundaries, tier calculation, formatting. It
  stays covered, boundary cases included.
- Every real bug gets a regression test written to fail before the fix.
- For visual changes, run the app and look at it before saying it works.

## Current state

Everything on screen is placeholder data (`lib/data.ts`). No database, no auth, no API
calls. `demo/trackrecord.html` is a standalone single-file copy for sharing — if you change
the prototype's behaviour or data, update it too, or say explicitly that it's now stale.
