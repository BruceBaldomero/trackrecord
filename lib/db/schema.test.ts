import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { BANDS, bandFor } from "../bands";

const MIGRATION = readFileSync(
  join(process.cwd(), "supabase/migrations/0001_initial_schema.sql"),
  "utf8"
);

let db: PGlite;

async function seedProfileAndArtist() {
  const { rows } = await db.query<{ id: string }>(
    `insert into profiles (username, display_name) values ('bruce', 'Bruce') returning id`
  );
  const { rows: artistRows } = await db.query<{ id: string }>(
    `insert into artists (source, external_id, name) values ('musicbrainz', 'mb-1', 'MIKE') returning id`
  );
  return { profileId: rows[0].id, artistId: artistRows[0].id };
}

// One database for the file, emptied between tests. Standing up a fresh Postgres per test
// took about four seconds each, which pushed the suite past its timeout and made it slow
// enough to start skipping — and a test suite nobody runs protects nothing.
beforeAll(async () => {
  db = new PGlite();
  // auth.uid() is Supabase's; stub it so the policies parse the same way they will in prod.
  await db.exec(`
    create schema if not exists auth;
    create or replace function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
    $$;
  `);
  await db.exec(MIGRATION);
});

beforeEach(async () => {
  // TRUNCATE skips row-level triggers, so it can clear backings despite them being
  // append-only — which is the point: no normal code path can.
  await db.exec(
    `truncate table follows, listener_snapshots, backings, artists, profiles restart identity cascade`
  );
});

describe("migration", () => {
  it("is safe to run twice", async () => {
    await expect(db.exec(MIGRATION)).resolves.toBeDefined();
  });
});

describe("band_for in SQL", () => {
  // The thresholds exist in both lib/bands.ts and the migration. If they ever drift, cards
  // computed in the database would disagree with cards computed in the app.
  it("agrees with lib/bands.ts at every boundary", async () => {
    const probes = BANDS.flatMap((b) => [b.min, b.max === null ? 250_000_000 : b.max - 1]);

    for (const listeners of probes) {
      const { rows } = await db.query<{ band: number }>("select band_for($1) as band", [listeners]);
      expect(`${listeners} -> ${rows[0].band}`).toBe(`${listeners} -> ${bandFor(listeners).id}`);
    }
  });
});

describe("backings are permanent", () => {
  it("accepts a new backing", async () => {
    const { profileId, artistId } = await seedProfileAndArtist();
    await db.query(
      `insert into backings (profile_id, artist_id, listeners_at_backing, band_at_backing)
       values ($1, $2, 48000, 1)`,
      [profileId, artistId]
    );
    const { rows } = await db.query("select count(*)::int as n from backings");
    expect(rows[0]).toEqual({ n: 1 });
  });

  it("refuses to update one, even as the table owner", async () => {
    const { profileId, artistId } = await seedProfileAndArtist();
    await db.query(
      `insert into backings (profile_id, artist_id, listeners_at_backing, band_at_backing)
       values ($1, $2, 48000, 1)`,
      [profileId, artistId]
    );

    await expect(
      db.query(`update backings set listeners_at_backing = 10`)
    ).rejects.toThrow(/permanent/i);
  });

  it("refuses to delete one, even as the table owner", async () => {
    const { profileId, artistId } = await seedProfileAndArtist();
    await db.query(
      `insert into backings (profile_id, artist_id, listeners_at_backing, band_at_backing)
       values ($1, $2, 48000, 1)`,
      [profileId, artistId]
    );

    await expect(db.query(`delete from backings`)).rejects.toThrow(/permanent/i);
  });

  it("won't let an account be deleted out from under its backings", async () => {
    const { profileId, artistId } = await seedProfileAndArtist();
    await db.query(
      `insert into backings (profile_id, artist_id, listeners_at_backing, band_at_backing)
       values ($1, $2, 48000, 1)`,
      [profileId, artistId]
    );

    // GDPR erasure has to be answered by anonymising the profile, not cascading the record
    // away — other people's cards reference when this artist was first backed.
    await expect(db.query(`delete from profiles where id = $1`, [profileId])).rejects.toThrow();
  });

  it("allows only one card per artist per person", async () => {
    const { profileId, artistId } = await seedProfileAndArtist();
    const insert = () =>
      db.query(
        `insert into backings (profile_id, artist_id, listeners_at_backing, band_at_backing)
         values ($1, $2, 48000, 1)`,
        [profileId, artistId]
      );
    await insert();
    await expect(insert()).rejects.toThrow(/backings_one_per_artist|duplicate key/i);
  });
});

describe("the database refuses dishonest rows", () => {
  it("rejects a band that disagrees with the listener count", async () => {
    const { profileId, artistId } = await seedProfileAndArtist();
    await expect(
      db.query(
        `insert into backings (profile_id, artist_id, listeners_at_backing, band_at_backing)
         values ($1, $2, 48000, 5)`,
        [profileId, artistId]
      )
    ).rejects.toThrow(/band_matches_listeners/i);
  });

  it("rejects a backing dated in the future", async () => {
    const { profileId, artistId } = await seedProfileAndArtist();
    await expect(
      db.query(
        `insert into backings (profile_id, artist_id, backed_at, listeners_at_backing, band_at_backing)
         values ($1, $2, current_date + 1, 48000, 1)`,
        [profileId, artistId]
      )
    ).rejects.toThrow(/not_in_the_future/i);
  });

  it("rejects negative listener counts", async () => {
    const { profileId, artistId } = await seedProfileAndArtist();
    await expect(
      db.query(
        `insert into backings (profile_id, artist_id, listeners_at_backing, band_at_backing)
         values ($1, $2, -5, 1)`,
        [profileId, artistId]
      )
    ).rejects.toThrow(/listeners_sane/i);
  });

  it("makes a seeded row say where its date came from", async () => {
    const { profileId, artistId } = await seedProfileAndArtist();
    await expect(
      db.query(
        `insert into backings (profile_id, artist_id, listeners_at_backing, band_at_backing, seeded)
         values ($1, $2, 48000, 1, true)`,
        [profileId, artistId]
      )
    ).rejects.toThrow(/seeded_rows_explain_themselves/i);

    await expect(
      db.query(
        `insert into backings (profile_id, artist_id, listeners_at_backing, band_at_backing, seeded, seeded_note)
         values ($1, $2, 48000, 1, true, 'Pitchfork, Ones to Watch, 9 Jan 2024')`,
        [profileId, artistId]
      )
    ).resolves.toBeDefined();
  });

  it("rejects an artist whose cached band contradicts its cached listener count", async () => {
    await expect(
      db.query(
        `insert into artists (source, external_id, name, current_listeners, current_band)
         values ('musicbrainz', 'mb-2', 'Wrong', 50000, 4)`
      )
    ).rejects.toThrow(/band_matches_listeners/i);
  });

  it("rejects usernames that wouldn't work in a profile URL", async () => {
    for (const bad of ["ab", "Has Spaces", "way_too_long_a_username_here", "bad!chars"]) {
      await expect(
        db.query(`insert into profiles (username, display_name) values ($1, 'X')`, [bad])
      ).rejects.toThrow(/username_format|value too long/i);
    }
  });

  it("stops anyone following themselves", async () => {
    const { profileId } = await seedProfileAndArtist();
    await expect(
      db.query(`insert into follows (follower_id, followee_id) values ($1, $1)`, [profileId])
    ).rejects.toThrow(/follows_not_self/i);
  });
});

describe("provider provenance", () => {
  // Providers measure slightly differently, so a switch must not silently blend two
  // different measurements into one growth line.
  it("records which provider a card's permanent number came from", async () => {
    const { profileId, artistId } = await seedProfileAndArtist();
    await db.query(
      `insert into backings (profile_id, artist_id, listeners_at_backing, band_at_backing)
       values ($1, $2, 48000, 1)`,
      [profileId, artistId]
    );
    const { rows } = await db.query<{ listeners_source: string }>(
      "select listeners_source from backings"
    );
    expect(rows[0].listeners_source).toBe("songstats");
  });

  it("records which provider each weekly snapshot came from", async () => {
    const { artistId } = await seedProfileAndArtist();
    await db.query(
      `insert into listener_snapshots (artist_id, captured_on, listeners)
       values ($1, current_date, 51000)`,
      [artistId]
    );
    const { rows } = await db.query<{ source: string }>("select source from listener_snapshots");
    expect(rows[0].source).toBe("songstats");
  });

  it("accepts a different provider, so switching is possible", async () => {
    const { artistId } = await seedProfileAndArtist();
    await expect(
      db.query(
        `insert into listener_snapshots (artist_id, captured_on, listeners, source)
         values ($1, current_date, 51000, 'soundcharts')`,
        [artistId]
      )
    ).resolves.toBeDefined();
  });

  it("rejects a provider nobody has agreed to", async () => {
    const { artistId } = await seedProfileAndArtist();
    await expect(
      db.query(
        `insert into listener_snapshots (artist_id, captured_on, listeners, source)
         values ($1, current_date, 51000, 'guesswork')`,
        [artistId]
      )
    ).rejects.toThrow(/source_valid/i);
  });
});

describe("row-level security", () => {
  it("is switched on for every table", async () => {
    const { rows } = await db.query<{ tablename: string; rowsecurity: boolean }>(
      `select tablename, rowsecurity from pg_tables
       where schemaname = 'public' order by tablename`
    );
    expect(rows.length).toBeGreaterThan(0);
    for (const table of rows) {
      expect(`${table.tablename}: ${table.rowsecurity}`).toBe(`${table.tablename}: true`);
    }
  });

  it("gives backings no update or delete policy at all", async () => {
    const { rows } = await db.query<{ cmd: string }>(
      `select cmd from pg_policies where tablename = 'backings'`
    );
    const commands = rows.map((r) => r.cmd);
    expect(commands).toContain("SELECT");
    expect(commands).toContain("INSERT");
    expect(commands).not.toContain("UPDATE");
    expect(commands).not.toContain("DELETE");
  });
});
