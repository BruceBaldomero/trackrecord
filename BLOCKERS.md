# What's blocking Track Record

Running notes on the external things standing between the prototype and a live product.
Written down so it can be explained to Jack without re-deriving it.

Last updated: 20 October 2026.

---

## 1. Spotify's API is closed to us (hard blocker, no workaround)

This is the big one, and it invalidates an assumption in the original proposal doc.

Since **February 2026**:

- **Development mode is capped at 5 users** (down from 25), and the app owner must hold an
  active **Spotify Premium** subscription or the app stops working.
- **Extended quota mode** — the only way past 5 users — has required since May 2025 that the
  applicant be a **registered organisation with an active service of at least 250,000
  monthly active users**. Spotify said over 95% of applications fall short of its security,
  privacy and licensing standards.

So a launch to 30–50 friends doesn't fit inside development mode, and the thing that would
let us grow is gated behind already being large. There is no legitimate path between the
two for a pre-launch consumer app.

**What this changes:** Jack's proposal and schema both assume Spotify supplies artist ID,
name, picture and genre. It can't. Artist search, identity and images need a different
source. Monthly listeners were always going to come from Songstats, so that part stands.

Sources:
- https://developer.spotify.com/blog/2025-04-15-updating-the-criteria-for-web-api-extended-access
- https://developer.spotify.com/documentation/web-api/tutorials/february-2026-migration-guide
- https://techcrunch.com/2026/02/06/spotify-changes-developer-mode-api-to-require-premium-accounts-limits-test-users/

### Chosen replacement

MusicBrainz for artist search and canonical identity (free, open, no key; rate-limited to
about one request per second and requires a descriptive User-Agent), plus the iTunes Search
API for artwork (free, no auth). Note that iTunes gives **album artwork, not artist
photographs** — good enough for cards, but it is not the same thing as a Spotify artist
picture, and Jack should know that.

Still worth asking Evan at Songstats whether their API does artist search and serves artist
images. If it does, we drop MusicBrainz and iTunes and run the whole thing off one provider
and one bill.

---

## 2. Songstats commercial terms (open question, cheap to resolve)

Evan has offered to **split the €20/month minimum across two keys** (current stats and
historic stats), e.g. €10 each. That is worse for us than it sounds: historic data gets used
once, to seed the publication profiles at launch, so a €10/month floor on that key is roughly
£100/year for an endpoint sitting idle.

**Ask instead for**, in order of preference:
1. One pooled €20 minimum across both keys.
2. Failing that, €20 on the current-stats key and €0 on the historic key, so historic is
   pure pay-as-you-go.

Also unresolved: Songstats only holds historical data **from the point they added an artist
to their database, earliest 2020**. The artists most likely to be missing early history are
small emerging ones — exactly who appears in a "ones to watch" list. So seeding publication
profiles should lean on recent lists (2024 onwards), and any gap should be labelled honestly
rather than silently using a later figure.

---

## 3. Development environment can't reach any external API (blocks verification, not building)

The cloud environment this is being built in restricts outbound network access to package
registries. Every one of these is refused at the proxy:

- `api.spotify.com`, `accounts.spotify.com`, `developer.spotify.com`
- `api.songstats.com`
- `musicbrainz.org`, `itunes.apple.com`, `coverartarchive.org`
- `supabase.com`

Integration code can be written and unit-tested against fixtures, but **no live call can be
made or verified from inside that environment**. Two ways round it: add the hosts under
Network access in the environment settings, or run the app locally where there is no such
restriction.

---

## 4. Accounts needed before anything is live

None of these exist yet, and all require Bruce or Jack to create them:

- A **Supabase** project (database + auth). Free tier is fine at this size.
- A **Vercel** project for hosting and the weekly cron.
- The **Songstats** production key (the test key in Jack's email is limited to 20 artists).
- A domain — `trackrecord.com` is taken and about £1,000; `jointrackrecord.com` was the
  ~£8 fallback.

Keys go in environment variables, never in the repo.

---

## 5. Legal and policy work, not yet started

Not blocking a private prototype, but blocking a public launch:

- **Privacy policy and terms**, since accounts mean storing email addresses. UK/EU GDPR
  applies.
- **Right to erasure versus permanent records.** Our core promise is that a backing can
  never be deleted; GDPR gives users a right to have their data removed. These genuinely
  conflict and need a decided answer — most likely anonymising a deleted user's backings
  rather than destroying them, which should be stated up front in the terms.
- **Image licensing** for whatever artwork source we settle on.
- **Name/trademark** check on "Track Record".

---

## Summary for Jack

The idea is unaffected. One technical assumption in the proposal is wrong — Spotify will not
give us artist data at our size — and the fix is to take artist search and images from
MusicBrainz and iTunes instead, which are open and free. Songstats for listener counts is
unchanged and still the right call. The outstanding commercial item is asking Evan to pool
the €20 minimum rather than split it across two keys.
