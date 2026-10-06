import type { FocusQuality } from "./types";

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
  try {
    window.sessionStorage.setItem(LIVE_SESSION_KEY, JSON.stringify(live));
  } catch {
    // Storage full or blocked: the session still runs, it just won't
    // survive a reload.
  }
}

export function loadLiveSession(): LiveSession | null {
  try {
    const raw = window.sessionStorage.getItem(LIVE_SESSION_KEY);
    if (!raw) return null;
    const live = JSON.parse(raw) as LiveSession;
    const states: LiveSession["state"][] = ["running", "paused", "done", "reflecting"];
    return states.includes(live.state) && typeof live.subject === "string" ? live : null;
  } catch {
    return null;
  }
}

export function clearLiveSession() {
  try {
    window.sessionStorage.removeItem(LIVE_SESSION_KEY);
  } catch {
    // Nothing to clear if storage is unavailable.
  }
}
