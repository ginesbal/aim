import type { FocusQuality } from "./types";
import { readKey, writeKey, removeKey } from "./storage";

export type TimerState = "idle" | "running" | "paused" | "done" | "reflecting";

/* The focus session in flight, kept in sessionStorage so a reload (or
   leaving Focus and coming back in the same tab) resumes it instead of
   losing it, and so the dashboard can tell one is still open.
   sessionStorage is per tab and dies with it, so a stale session can't
   surface in another tab or days later. */
const LIVE_SESSION_KEY = "aim_focus_live";

export interface LiveSession {
  state: Exclude<TimerState, "idle">;
  /** Absolute end (ms since epoch) while running. */
  endTime: number;
  /** Remaining seconds while paused. */
  secondsLeft: number;
  duration: number;
  subject: string;
  task: string;
  taskId: string | null;
  elapsedMinutes: number;
  quality: FocusQuality | null;
  note: string;
}

export function saveLiveSession(live: LiveSession) {
  // Storage full or blocked: the session still runs, it just won't
  // survive a reload, and StorageNotice says so.
  writeKey(LIVE_SESSION_KEY, JSON.stringify(live), "session");
}

export function loadLiveSession(): LiveSession | null {
  try {
    const raw = readKey(LIVE_SESSION_KEY, "session");
    if (!raw) return null;
    const live = JSON.parse(raw) as LiveSession;
    const states: LiveSession["state"][] = ["running", "paused", "done", "reflecting"];
    // Every field the dashboard and Focus read, checked: a malformed
    // record (another version, a hand edit) is ignored, not crashed on.
    return states.includes(live.state) &&
      typeof live.subject === "string" &&
      typeof live.task === "string" &&
      Number.isFinite(live.duration) &&
      Number.isFinite(live.secondsLeft) &&
      Number.isFinite(live.endTime)
      ? live
      : null;
  } catch {
    return null;
  }
}

export function clearLiveSession() {
  removeKey(LIVE_SESSION_KEY, "session");
}
