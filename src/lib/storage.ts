/* Everything aim keeps lives in this browser (PRODUCT.md: no accounts),
   under keys that start with "aim_". Browser storage can be blocked
   (site data turned off) or full, and then even reading it throws:
   pages that touched it directly crashed before they drew anything.
   These helpers never throw. The first time a write fails they tell
   anyone listening (StorageNotice says so on screen), so nobody is left
   believing their work was kept when it wasn't. */

type Area = "local" | "session";

/** Set when Settings' name is cleared or the welcome is skipped: the
 *  welcome dialog doesn't come back on every visit. */
export const WELCOME_SKIPPED_KEY = "aim_welcome_skipped";

const listeners = new Set<() => void>();
let writeFailed = false;

function reportFailure() {
  if (writeFailed) return;
  writeFailed = true;
  listeners.forEach((listener) => listener());
}

/** True once a write has failed: what's changed now may not outlive the tab. */
export function isStorageFailing(): boolean {
  return writeFailed;
}

/** Runs once when a write first fails (at once if one already has).
 *  Returns the unsubscribe. */
export function onStorageFailure(listener: () => void): () => void {
  listeners.add(listener);
  if (writeFailed) listener();
  return () => {
    listeners.delete(listener);
  };
}

function area(kind: Area): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    // Merely reading window.localStorage throws when storage is blocked.
    return kind === "local" ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

export function readKey(key: string, kind: Area = "local"): string | null {
  try {
    return area(kind)?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

/** False when the browser wouldn't keep it (blocked, full, private). */
export function writeKey(key: string, value: string, kind: Area = "local"): boolean {
  const store = area(kind);
  try {
    if (!store) throw new Error("storage unavailable");
    store.setItem(key, value);
    return true;
  } catch {
    if (typeof window !== "undefined") reportFailure();
    return false;
  }
}

export function removeKey(key: string, kind: Area = "local") {
  try {
    area(kind)?.removeItem(key);
  } catch {
    // Nothing to remove if storage is unavailable.
  }
}

/** "Clear all data": every aim_ key in both areas, the paused session
 *  and the welcome flag included, so aim starts over as on a first
 *  visit. It used to remove five named keys and leave the subjects,
 *  tabs, backdrop choices and welcome flag behind (critique,
 *  2026-10-28). */
export function clearAllData() {
  for (const kind of ["local", "session"] as const) {
    const store = area(kind);
    if (!store) continue;
    try {
      const keys: string[] = [];
      for (let i = 0; i < store.length; i++) {
        const key = store.key(i);
        if (key?.startsWith("aim_")) keys.push(key);
      }
      keys.forEach((key) => store.removeItem(key));
    } catch {
      // Blocked mid-way: nothing more can be removed.
    }
  }
}
