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
  /** "Mark done" ticked on the ending card. Optional: older records
      don't have it. */
  markDone?: boolean;
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

/* What "Save session" did, kept for the dashboard's five-second Undo: the
   session it logged, the ending card as it stood (so Undo puts the
   session back exactly as it was, waiting to be saved) and the task
   "Mark done" completed, if any. Written by Focus as it saves, taken
   (read once and removed) by the dashboard on arrival, so a reload
   never offers it again. */
const SAVED_SESSION_KEY = "aim_focus_saved";

export interface SavedSession {
  sessionId: string;
  live: LiveSession;
  doneTaskId: string | null;
}

export function rememberSavedSession(saved: SavedSession) {
  writeKey(SAVED_SESSION_KEY, JSON.stringify(saved), "session");
}

/** The save to offer Undo for, if it's the one named; null otherwise.
    Removed either way: it's good for one arrival. */
export function takeSavedSession(sessionId: string): SavedSession | null {
  try {
    const raw = readKey(SAVED_SESSION_KEY, "session");
    if (!raw) return null;
    removeKey(SAVED_SESSION_KEY, "session");
    const saved = JSON.parse(raw) as SavedSession;
    return saved &&
      saved.sessionId === sessionId &&
      saved.live?.state === "reflecting" &&
      typeof saved.live.subject === "string" &&
      typeof saved.live.task === "string" &&
      Number.isFinite(saved.live.duration) &&
      Number.isFinite(saved.live.secondsLeft) &&
      (saved.doneTaskId === null || typeof saved.doneTaskId === "string")
      ? saved
      : null;
  } catch {
    return null;
  }
}
