"use client";

import { createContext, useCallback, useContext, useSyncExternalStore } from "react";
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
  backArtist: (artistId: string, listeners: number) => void;
  picksLeft: number;
  reset: () => void;
};

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const extraBacks = useSyncExternalStore(subscribe, read, () => EMPTY);

  const backArtist = useCallback((artistId: string, listenerCount: number) => {
    const current = read();
    if (current.some((b) => b.artistId === artistId)) return;
    write([
      ...current,
      {
        id: `new-${artistId}`,
        userId: CURRENT_USER_ID,
        artistId,
        backedAt: new Date().toISOString().slice(0, 10),
        listenersAtBacking: listenerCount,
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
