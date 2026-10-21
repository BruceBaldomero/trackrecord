"use client";

import { createContext, useCallback, useContext, useSyncExternalStore } from "react";
import { todayISO } from "./bands";
import { Back, CURRENT_USER_ID } from "./data";

const STORAGE_KEY = "trackrecord.demo.backs";
export const WEEKLY_PICK_LIMIT = 3;

const EMPTY: Back[] = [];
const listeners = new Set<() => void>();
let cache: Back[] | null = null;

function read(): Back[] {
  if (cache) return cache;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    cache = raw ? (JSON.parse(raw) as Back[]) : EMPTY;
  } catch {
    cache = EMPTY;
  }
  return cache;
}

function write(next: Back[]) {
  cache = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Demo only: ignore unwritable storage.
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

type StoreValue = {
  extraBacks: Back[];
  backArtist: (artist: BackedArtistInput) => void;
  picksLeft: number;
  reset: () => void;
};

export type BackedArtistInput = {
  source: string;
  externalId: string;
  name: string;
  genre: string | null;
  imageUrl: string | null;
  /** Null only when no listener figure could be obtained for this artist. */
  listenersAtBacking: number | null;
};

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const extraBacks = useSyncExternalStore(subscribe, read, () => EMPTY);

  const backArtist = useCallback((artist: BackedArtistInput) => {
    const current = read();
    if (current.some((b) => b.artistId === artist.externalId)) return;
    write([
      ...current,
      {
        id: `new-${artist.externalId}`,
        userId: CURRENT_USER_ID,
        artistId: artist.externalId,
        backedAt: todayISO(),
        listenersAtBacking: artist.listenersAtBacking,
        artist: {
          source: artist.source,
          name: artist.name,
          genre: artist.genre,
          imageUrl: artist.imageUrl,
        },
      },
    ]);
  }, []);

  const reset = useCallback(() => write(EMPTY), []);

  return (
    <StoreContext.Provider
      value={{
        extraBacks,
        backArtist,
        picksLeft: Math.max(0, WEEKLY_PICK_LIMIT - extraBacks.length),
        reset,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
