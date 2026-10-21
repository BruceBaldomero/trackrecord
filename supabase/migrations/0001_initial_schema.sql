-- Track Record — initial schema
--
-- Safe to re-run: every statement is guarded.
--
-- The important thing in this file is that a backing cannot be changed or removed once
-- written. That is the product's central promise, so it's enforced by a trigger rather
-- than by row-level security alone: RLS is bypassed by the service role, and a promise
-- that an admin script can quietly break is not a promise.

-- No extensions required: gen_random_uuid() is core Postgres from 13 onwards, and the
-- username check constraint below already forces lowercase, so citext isn't needed either.

-- ---------------------------------------------------------------------------
-- Bands
--
-- Thresholds live here as well as in lib/bands.ts. They are frozen once live: moving a
-- boundary retroactively re-tiers every existing card. The two copies are kept honest by
-- a test that checks them against each other.
-- ---------------------------------------------------------------------------

create or replace function band_for(listeners bigint)
returns smallint
language sql
immutable
as $$
  select case
    when listeners <   100000 then 1  -- Underground
    when listeners <   500000 then 2  -- Cult Following
    when listeners <  2000000 then 3  -- Established
    when listeners < 10000000 then 4  -- Mainstream
    else 5                            -- Superstar
  end::smallint
$$;

-- ---------------------------------------------------------------------------
-- Profiles
--
-- One row per account. In Supabase this is keyed to auth.users; the auth system owns the
-- email and password, so neither is duplicated here.
-- ---------------------------------------------------------------------------

create table if not exists profiles (
  id            uuid primary key default gen_random_uuid(),
  username      text not null unique,
  display_name  text not null,
  bio           text not null default '',
  avatar_url    text,
  kind          text not null default 'person',
  created_at    timestamptz not null default now(),

  constraint profiles_username_format
    check (username ~ '^[a-z0-9_]{3,20}$'),
  constraint profiles_kind_valid
    check (kind in ('person', 'publication')),
  constraint profiles_bio_length
    check (char_length(bio) <= 300),
  constraint profiles_display_name_length
    check (char_length(display_name) between 1 and 50)
);

-- ---------------------------------------------------------------------------
-- Artists
--
-- Identified by provider + that provider's ID, never by one provider's ID alone, so the
-- source can change without a migration (see BLOCKERS.md — Spotify is not available).
--
-- current_listeners is a cache of the newest listener_snapshots row, kept for fast reads.
-- It is null until we first hear a real figure.
-- ---------------------------------------------------------------------------

create table if not exists artists (
  id                  uuid primary key default gen_random_uuid(),
  source              text not null,
  external_id         text not null,
  name                text not null,
  genre               text,
  image_url           text,
  current_listeners   bigint,
  current_band        smallint,
  listeners_synced_at timestamptz,
  created_at          timestamptz not null default now(),

  constraint artists_source_valid
    check (source in ('musicbrainz', 'songstats', 'spotify')),
  constraint artists_listeners_sane
    check (current_listeners is null or current_listeners >= 0),
  -- The cached band must agree with the cached count, or cards lie.
  constraint artists_band_matches_listeners
    check (
      (current_listeners is null and current_band is null)
      or current_band = band_for(current_listeners)
    ),
  constraint artists_unique_per_source
    unique (source, external_id)
);

-- ---------------------------------------------------------------------------
-- Backings — append-only
--
-- backed_at is a calendar day, not a timestamp: "I backed them on 14 March" is the claim,
-- and a timestamp would render as the previous day for anyone west of UTC.
--
-- seeded marks rows written on behalf of someone else after the fact — publication
-- profiles built from dated "ones to watch" articles. Those are legitimate, but they must
-- never pass as somebody sitting there and clicking at the time.
-- ---------------------------------------------------------------------------

create table if not exists backings (
  id                   uuid primary key default gen_random_uuid(),
  profile_id           uuid not null references profiles(id) on delete restrict,
  artist_id            uuid not null references artists(id)  on delete restrict,
  backed_at            date not null default current_date,
  listeners_at_backing bigint not null,
  band_at_backing      smallint not null,
  seeded               boolean not null default false,
  seeded_note          text,
  created_at           timestamptz not null default now(),

  constraint backings_one_per_artist
    unique (profile_id, artist_id),
  constraint backings_listeners_sane
    check (listeners_at_backing >= 0),
  constraint backings_band_matches_listeners
    check (band_at_backing = band_for(listeners_at_backing)),
  constraint backings_not_in_the_future
    check (backed_at <= current_date),
  -- A backdated row has to say where the date came from.
  constraint backings_seeded_rows_explain_themselves
    check (not seeded or seeded_note is not null)
);

-- on delete restrict above is deliberate. Deleting an account must not take its backings
-- with it: other people's profiles reference when an artist was first backed. The GDPR
-- answer is to anonymise the profile and keep the record, not to destroy it.

create or replace function backings_are_immutable()
returns trigger
language plpgsql
as $$
begin
  raise exception
    'backings are permanent: % on backing % was refused', lower(tg_op), coalesce(old.id::text, '?')
    using hint = 'A backing records what someone believed at a moment in time. Correct it with a new row, never by editing this one.';
end;
$$;

drop trigger if exists backings_no_update on backings;
create trigger backings_no_update
  before update on backings
  for each row execute function backings_are_immutable();

drop trigger if exists backings_no_delete on backings;
create trigger backings_no_delete
  before delete on backings
  for each row execute function backings_are_immutable();

-- ---------------------------------------------------------------------------
-- Listener snapshots — the weekly time series
--
-- One row per artist per capture date. The weekly job must page through artists: Supabase
-- returns at most 1000 rows per query, and a job that ignores that silently refreshes only
-- the first 1000 artists while the rest quietly stop moving.
-- ---------------------------------------------------------------------------

create table if not exists listener_snapshots (
  artist_id   uuid not null references artists(id) on delete cascade,
  captured_on date not null,
  listeners   bigint not null,

  primary key (artist_id, captured_on),
  constraint snapshots_listeners_sane check (listeners >= 0)
);

create index if not exists listener_snapshots_by_date
  on listener_snapshots (artist_id, captured_on desc);

-- ---------------------------------------------------------------------------
-- Follows
-- ---------------------------------------------------------------------------

create table if not exists follows (
  follower_id uuid not null references profiles(id) on delete cascade,
  followee_id uuid not null references profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),

  primary key (follower_id, followee_id),
  constraint follows_not_self check (follower_id <> followee_id)
);

-- ---------------------------------------------------------------------------
-- Row-level security
--
-- Profiles and backings are public on purpose: a shared card has to be viewable by someone
-- who isn't signed in, and that's the growth loop. Writes are restricted to the owner.
-- Artists and snapshots are written only by the server (service role), never by a client.
-- ---------------------------------------------------------------------------

alter table profiles           enable row level security;
alter table artists            enable row level security;
alter table backings           enable row level security;
alter table listener_snapshots enable row level security;
alter table follows            enable row level security;

drop policy if exists profiles_readable_by_anyone on profiles;
create policy profiles_readable_by_anyone on profiles
  for select using (true);

drop policy if exists profiles_updatable_by_owner on profiles;
create policy profiles_updatable_by_owner on profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists profiles_insertable_by_owner on profiles;
create policy profiles_insertable_by_owner on profiles
  for insert with check (id = auth.uid());

drop policy if exists artists_readable_by_anyone on artists;
create policy artists_readable_by_anyone on artists
  for select using (true);

drop policy if exists backings_readable_by_anyone on backings;
create policy backings_readable_by_anyone on backings
  for select using (true);

-- Insert only. There is deliberately no update or delete policy, and the triggers above
-- stop even the service role from getting round that.
drop policy if exists backings_insertable_by_owner on backings;
create policy backings_insertable_by_owner on backings
  for insert with check (profile_id = auth.uid() and seeded = false);

drop policy if exists snapshots_readable_by_anyone on listener_snapshots;
create policy snapshots_readable_by_anyone on listener_snapshots
  for select using (true);

drop policy if exists follows_readable_by_anyone on follows;
create policy follows_readable_by_anyone on follows
  for select using (true);

drop policy if exists follows_managed_by_follower on follows;
create policy follows_managed_by_follower on follows
  for insert with check (follower_id = auth.uid());

drop policy if exists follows_removable_by_follower on follows;
create policy follows_removable_by_follower on follows
  for delete using (follower_id = auth.uid());
