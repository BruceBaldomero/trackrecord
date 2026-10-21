/**
 * A small in-process cache with expiry.
 *
 * Searching is slow mostly because of other people's rate limits: MusicBrainz asks for
 * about one request a second, and typing "wet leg" fires a search per pause. Caching turns
 * most of those keystrokes into free lookups.
 *
 * In-process means per server instance and lost on restart, which is the right trade here —
 * nothing stored is precious, and it needs no infrastructure.
 */

type Entry<T> = { value: T; expires: number };

export class TtlCache<T> {
  private store = new Map<string, Entry<T>>();

  constructor(
    private ttlMs: number,
    private maxEntries = 500
  ) {}

  get(key: string): T | undefined {
    const hit = this.store.get(key);
    if (!hit) return undefined;
    if (hit.expires < Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    // Refresh insertion order so the hottest keys survive eviction.
    this.store.delete(key);
    this.store.set(key, hit);
    return hit.value;
  }

  set(key: string, value: T): void {
    if (this.store.size >= this.maxEntries) {
      const oldest = this.store.keys().next().value;
      if (oldest !== undefined) this.store.delete(oldest);
    }
    this.store.set(key, { value, expires: Date.now() + this.ttlMs });
  }

  /** Runs `load` only on a miss, and shares one in-flight promise between callers. */
  async wrap(key: string, load: () => Promise<T>): Promise<T> {
    const cached = this.get(key);
    if (cached !== undefined) return cached;

    const existing = this.inFlight.get(key);
    if (existing) return existing;

    const promise = load()
      .then((value) => {
        this.set(key, value);
        return value;
      })
      .finally(() => this.inFlight.delete(key));

    this.inFlight.set(key, promise);
    return promise;
  }

  private inFlight = new Map<string, Promise<T>>();
}
