import { useEffect, useRef } from "react";

/** How long an Undo (or a notice like it) stays offered. */
export const UNDO_TIMEOUT_MS = 5000;

/**
 * Run `onFire` after `ms` of *visible* time, not wall time. When the tab is
 * hidden mid-countdown we freeze the timer; on return we resume with whatever
 * time was left. The principle: a 5-second undo should mean five seconds the
 * user could actually see — Sonner does the same for toasts. The count
 * runs while `item` isn't null, and a new item starts it over: a second
 * Mark done or Delete within the five seconds used to get only what was
 * left of the first one's.
 *
 * `held` freezes it too, for as long as it's true: the Undo is being
 * pointed at or has keyboard focus, so it can't vanish from under the
 * click or the Enter on its way. Shared by Tasks' banners and the
 * dashboard's Undo after a saved session.
 */
export function useVisibleTimeout(
  item: object | null,
  ms: number,
  onFire: () => void,
  held = false
) {
  // Stash onFire in a ref so the effect doesn't restart every render
  // (a fresh inline callback would otherwise reset the timer each tick).
  const onFireRef = useRef(onFire);
  onFireRef.current = onFire;
  const heldRef = useRef(held);
  heldRef.current = held;
  const control = useRef<{ pause: () => void; resume: () => void } | null>(null);

  useEffect(() => {
    if (item === null) return;
    let remaining = ms;
    let startedAt = 0;
    let id: ReturnType<typeof setTimeout> | null = null;

    const resume = () => {
      if (id !== null || document.hidden || heldRef.current) return;
      startedAt = performance.now();
      id = setTimeout(() => {
        id = null;
        onFireRef.current();
      }, remaining);
    };
    const pause = () => {
      if (id === null) return;
      clearTimeout(id);
      id = null;
      remaining = Math.max(0, remaining - (performance.now() - startedAt));
    };
    const handleVisibility = () => (document.hidden ? pause() : resume());

    control.current = { pause, resume };
    // A tab opened in the background, or an Undo already under the
    // pointer, starts with its count frozen.
    resume();
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      pause();
      control.current = null;
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [item, ms]);

  useEffect(() => {
    if (held) control.current?.pause();
    else control.current?.resume();
  }, [held]);
}
