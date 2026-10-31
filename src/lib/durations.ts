/* How long a focus session can be, in minutes: the one range the Focus
   card, the dashboard's length menu and Settings all keep to. Settings
   used to accept up to 180, so the dashboard could offer "focus for
   2h 30m" and Begin then ran a 2-hour timer (critique, 2026-10-28). */
export const DURATION_MIN = 5;
export const DURATION_MAX = 120;
export const DURATION_STEP = 5;

/** The quick lengths offered on Focus and in the dashboard launcher. */
export const DURATION_PRESETS = [25, 45, 60, 90];

/** A whole number of minutes inside the session range. */
export function clampDuration(minutes: number): number {
  if (!Number.isFinite(minutes)) return DURATION_PRESETS[0];
  return Math.max(DURATION_MIN, Math.min(DURATION_MAX, Math.round(minutes)));
}

/** The daily goal's range: at least a minute, at most a whole day. */
export const GOAL_MIN = 1;
export const GOAL_MAX = 24 * 60;

export function clampGoal(minutes: number): number {
  if (!Number.isFinite(minutes)) return 120;
  return Math.max(GOAL_MIN, Math.min(GOAL_MAX, Math.round(minutes)));
}
