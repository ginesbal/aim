"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useFocus, useSubjects, usePreferences, useTasks } from "@/lib/contexts";
import { SUBJECTS, type SubjectKey, type FocusQuality } from "@/lib/types";
import { cn, formatTime, readableFill } from "@/lib/utils";
import { QualitySelector } from "@/components/ui/QualityIndicator";
import DurationPicker, { DURATION_MAX, DURATION_MIN } from "@/components/ui/DurationPicker";
import SubjectSelector from "@/components/ui/SubjectSelector";
import {
  type TimerState,
  saveLiveSession,
  loadLiveSession,
  clearLiveSession,
} from "@/lib/liveSession";

const TopologyBg = dynamic(() => import("@/components/ui/TopologyBg"), { ssr: false });

// Topology backdrop presets — the line color is drawn from the shared app
// palette so the focus page sits cohesively beside the rest of the app.
// The mesh background stays on baltic-50 (the app surface) for every preset;
// only the line color changes. The choice persists in localStorage.
type TopoPresetKey = "baltic" | "ash" | "lavender" | "cream";

const TOPO_BG = 0xeff1f5; // baltic-50

const TOPO_PRESETS: { key: TopoPresetKey; label: string; color: number; hex: string }[] = [
  { key: "baltic",   label: "Baltic",   color: 0x808eb3, hex: "#808eb3" },
  { key: "ash",      label: "Ash",      color: 0x76946b, hex: "#76946b" },
  { key: "lavender", label: "Lavender", color: 0x6e7891, hex: "#6e7891" },
  { key: "cream",    label: "Cream",    color: 0x949b31, hex: "#949b31" },
];

const TOPO_STORAGE_KEY = "aim_focus_topo";

/* Parked, not deleted: the Ambient sound menu, whose options are all
   "Soon". Flip to true when the sounds exist. */
const SHOW_AMBIENT = false;

const MUSIC_OPTIONS = [
  { id: "brown",  label: "Brown noise",  desc: "Low, warm, hush" },
  { id: "pink",   label: "Pink noise",   desc: "Balanced static" },
  { id: "rain",   label: "Rain",         desc: "Wet pavement, soft" },
  { id: "lofi",   label: "Lofi loop",    desc: "Tape, no vocals" },
] as const;

export default function FocusPage() {
  const router = useRouter();
  const { addSession } = useFocus();
  const { getSubject } = useSubjects();
  const { focusBlockMin } = usePreferences();
  const { tasks, toggleComplete } = useTasks();

  const [duration, setDuration] = useState(25);
  const [subject, setSubject] = useState<string | null>(null);
  const [task, setTask] = useState("");

  // The planner task this session belongs to, when Focus was opened from
  // one (?taskId=). The link holds only while the task text still matches
  // it — edit the text and the session is about something else — so
  // "Mark done" can never complete the wrong task.
  const [linkedTaskId, setLinkedTaskId] = useState<string | null>(null);
  const [markDone, setMarkDone] = useState(false);
  const linkedTask = linkedTaskId ? tasks.find((t) => t.id === linkedTaskId) : undefined;
  const doneCandidate =
    linkedTask && !linkedTask.completed && task.trim() === linkedTask.title.slice(0, 60).trim()
      ? linkedTask
      : undefined;
  const completeLinkedIfChosen = useCallback(() => {
    if (markDone && doneCandidate) toggleComplete(doneCandidate.id);
    setMarkDone(false);
  }, [markDone, doneCandidate, toggleComplete]);
  const [timerState, setTimerState] = useState<TimerState>("idle");
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Timestamp the timer's target end so it stays accurate when the tab is
  // backgrounded or the machine sleeps — setInterval alone drifts/throttles.
  // Mirrors of secondsLeft/duration keep the ticking callbacks stable.
  const endTimeRef = useRef<number>(0);
  const secondsLeftRef = useRef<number>(25 * 60);
  const durationRef = useRef<number>(25);

  const [reflectionQuality, setReflectionQuality] = useState<FocusQuality | null>(null);
  const [reflectionNote, setReflectionNote] = useState("");
  const [elapsedMinutes, setElapsedMinutes] = useState(0);

  const [musicOpen, setMusicOpen] = useState(false);
  const musicMenuRef = useRef<HTMLDivElement>(null);
  const musicBtnRef = useRef<HTMLButtonElement>(null);
  const [backdropOpen, setBackdropOpen] = useState(false);
  const backdropMenuRef = useRef<HTMLDivElement>(null);
  const backdropBtnRef = useRef<HTMLButtonElement>(null);

  const [topoPreset, setTopoPreset] = useState<TopoPresetKey>(() => {
    if (typeof window === "undefined") return "baltic";
    const saved = window.localStorage.getItem(TOPO_STORAGE_KEY);
    return TOPO_PRESETS.some((p) => p.key === saved) ? (saved as TopoPresetKey) : "baltic";
  });
  const activePreset = TOPO_PRESETS.find((p) => p.key === topoPreset) ?? TOPO_PRESETS[0];

  const selectPreset = useCallback((key: TopoPresetKey) => {
    setTopoPreset(key);
    if (typeof window !== "undefined") window.localStorage.setItem(TOPO_STORAGE_KEY, key);
  }, []);

  const totalSeconds = duration * 60;
  const progress = ((totalSeconds - secondsLeft) / totalSeconds) * 100;
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  const subjectColor = (() => {
    if (!subject) return "#9faac6";
    const userSub = getSubject(subject);
    if (userSub) return userSub.color;
    const legacySub = SUBJECTS[subject as SubjectKey];
    return legacySub?.color || "#9faac6";
  })();

  const subjectLabel = (() => {
    if (!subject) return null;
    const userSub = getSubject(subject);
    if (userSub) return userSub.label;
    const legacySub = SUBJECTS[subject as SubjectKey];
    return legacySub?.label || subject;
  })();

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Recompute remaining from the target timestamp; finish exactly at/after it.
  const tick = useCallback(() => {
    const now = Date.now();
    if (now >= endTimeRef.current) {
      clearTimer();
      secondsLeftRef.current = 0;
      setSecondsLeft(0);
      setTimerState("done");
      return;
    }
    setSecondsLeft(Math.ceil((endTimeRef.current - now) / 1000));
  }, [clearTimer]);

  const startTimer = useCallback(() => {
    clearTimer();
    endTimeRef.current = Date.now() + secondsLeftRef.current * 1000;
    setTimerState("running");
    // 250ms cadence self-corrects drift; setSecondsLeft no-ops when the whole
    // second is unchanged, so this still renders only ~once per second.
    intervalRef.current = setInterval(tick, 250);
  }, [clearTimer, tick]);

  const pauseTimer = useCallback(() => {
    const remaining = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000));
    clearTimer();
    secondsLeftRef.current = remaining;
    setSecondsLeft(remaining);
    setTimerState("paused");
  }, [clearTimer]);

  const resetToIdle = useCallback(() => {
    clearTimer();
    clearLiveSession();
    setTimerState("idle");
    setSecondsLeft(duration * 60);
    setReflectionQuality(null);
    setReflectionNote("");
  }, [clearTimer, duration]);

  const exitToDashboard = useCallback(() => {
    clearTimer();
    clearLiveSession();
    router.push("/dashboard");
  }, [clearTimer, router]);

  // Leaving never throws work away: a running session is paused and kept,
  // and the dashboard offers the way back ("Return to focus", or "Finish
  // saving" for a finished one). Throwing a session away is Discard's job.
  const handleExit = useCallback(() => {
    if (timerState === "idle") {
      exitToDashboard();
      return;
    }
    if (timerState === "running") pauseTimer();
    clearTimer();
    router.push("/dashboard");
  }, [timerState, exitToDashboard, pauseTimer, clearTimer, router]);

  const addFiveMinutes = useCallback(() => {
    setDuration((d) => Math.min(d + 5, DURATION_MAX));
    setSecondsLeft((s) => Math.min(s + 5 * 60, DURATION_MAX * 60));
    // Push the live target out too, capped so remaining never exceeds the max.
    if (intervalRef.current) {
      const maxEnd = Date.now() + DURATION_MAX * 60 * 1000;
      endTimeRef.current = Math.min(endTimeRef.current + 5 * 60 * 1000, maxEnd);
    }
  }, []);

  // End the session now and move to reflection, recording the actual time
  // focused — partial when finishing early, full when the timer completed.
  const endSession = useCallback(() => {
    clearTimer();
    const elapsed = Math.max(Math.round((durationRef.current * 60 - secondsLeftRef.current) / 60), 1);
    setElapsedMinutes(elapsed);
    setTimerState("reflecting");
  }, [clearTimer]);

  // The one way a session ends well: log it (the rating is optional),
  // honour "Mark done", and go back to the dashboard, where the new band
  // grows into the "a". ?logged= names the session so the dashboard can
  // show that moment once.
  const leavingRef = useRef(false);
  const saveSession = useCallback(() => {
    if (!subject || leavingRef.current) return;
    leavingRef.current = true;
    const id = addSession(
      subject,
      elapsedMinutes,
      reflectionQuality
        ? { quality: reflectionQuality, ...(reflectionNote.trim() ? { note: reflectionNote.trim() } : {}) }
        : undefined,
      task
    );
    completeLinkedIfChosen();
    clearTimer();
    clearLiveSession();
    router.push(`/dashboard?logged=${encodeURIComponent(id)}`);
  }, [subject, elapsedMinutes, reflectionQuality, reflectionNote, task, addSession, completeLinkedIfChosen, clearTimer, router]);

  // Keep secondsLeft in sync when duration changes during setup. Only on
  // an actual change: firing on mount too (twice, in dev Strict Mode)
  // would overwrite the countdown of a session restored after a reload.
  const syncedDuration = useRef(duration);
  useEffect(() => {
    if (timerState !== "idle" || syncedDuration.current === duration) return;
    syncedDuration.current = duration;
    setSecondsLeft(duration * 60);
  }, [duration, timerState]);

  // Mirror latest values into refs so the ticking callbacks stay stable.
  useEffect(() => { secondsLeftRef.current = secondsLeft; }, [secondsLeft]);
  useEffect(() => { durationRef.current = duration; }, [duration]);

  // Arriving from the dashboard, the setup sentence is already filled in
  // (?subject=&task=&min=), and start=1 — the dashboard's "Begin
  // focusing" — starts the timer on arrival. Arriving any other way, the
  // length starts at the user's default session length from Settings.
  // Read once on mount; after that the setup is the user's to change.
  const prefilled = useRef(false);
  const [autoStart, setAutoStart] = useState(false);
  const [resumeRunning, setResumeRunning] = useState(false);
  const resumeEndRef = useRef<number | null>(null);
  useEffect(() => {
    if (prefilled.current) return;
    prefilled.current = true;
    const params = new URLSearchParams(window.location.search);

    // A session that was live when this tab reloaded (or navigated away
    // and back) comes back exactly as it was, and wins over anything in
    // the URL: a new ?start=1 must never silently replace running work.
    const live = loadLiveSession();
    if (live) {
      // The URL described a different request (and may carry start=1);
      // drop it so the address bar matches the session on screen.
      if (window.location.search) window.history.replaceState(null, "", "/focus");
      setDuration(live.duration);
      durationRef.current = live.duration;
      syncedDuration.current = live.duration;
      setSubject(live.subject);
      setTask(live.task);
      setLinkedTaskId(live.taskId);
      setElapsedMinutes(live.elapsedMinutes);
      setReflectionQuality(live.quality);
      setReflectionNote(live.note);
      if (live.state === "running") {
        // Counted against the saved end time: if it passed while the
        // page was gone, the first tick lands on "done".
        const remaining = Math.max(0, Math.ceil((live.endTime - Date.now()) / 1000));
        secondsLeftRef.current = remaining;
        setSecondsLeft(remaining);
        resumeEndRef.current = live.endTime;
        setResumeRunning(true);
      } else {
        const remaining = live.state === "done" ? 0 : live.secondsLeft;
        secondsLeftRef.current = remaining;
        setSecondsLeft(remaining);
        setTimerState(live.state);
      }
      return;
    }

    const requested = Number(params.get("min"));
    const length = Math.max(
      DURATION_MIN,
      Math.min(DURATION_MAX, Math.round(Number.isFinite(requested) && requested > 0 ? requested : focusBlockMin))
    );
    setDuration(length);
    const requestedSubject = params.get("subject");
    const match = requestedSubject ? getSubject(requestedSubject) : undefined;
    if (match) setSubject(match.label);
    const requestedTask = params.get("task")?.trim();
    if (requestedTask) setTask(requestedTask.slice(0, 60));
    const requestedTaskId = params.get("taskId");
    if (requestedTaskId) setLinkedTaskId(requestedTaskId);

    if (params.get("start") === "1") {
      // Drop the flag so a reload shows the setup instead of silently
      // starting a second session.
      params.delete("start");
      const query = params.toString();
      window.history.replaceState(null, "", query ? `/focus?${query}` : "/focus");
      // Starting needs a subject, exactly as the Begin button does.
      if (match) setAutoStart(true);
    }
  }, [focusBlockMin, getSubject]);

  // The actual start happens one render later, once the prefilled length
  // is in state. Keeping it out of the mount effect matters: React's dev
  // Strict Mode unmounts and remounts on first render, and the unmount
  // cleanup clears the interval — a timer started during mount would
  // show "running" but never tick.
  useEffect(() => {
    if (!autoStart || timerState !== "idle" || !subject) return;
    setAutoStart(false);
    secondsLeftRef.current = duration * 60;
    durationRef.current = duration;
    setSecondsLeft(duration * 60);
    startTimer();
  }, [autoStart, timerState, subject, duration, startTimer]);

  // Same one-render delay for a restored running session.
  useEffect(() => {
    if (!resumeRunning) return;
    setResumeRunning(false);
    const end = resumeEndRef.current;
    resumeEndRef.current = null;
    if (end === null) return;
    startTimer();
    // Run against the saved end time itself, not a recount of seconds,
    // so a reload never adds or loses time. The immediate tick shows the
    // true remaining time, or lands on "done" if it ran out meanwhile.
    endTimeRef.current = end;
    tick();
  }, [resumeRunning, startTimer, tick]);

  // Keep the live session in sessionStorage while there's one to lose.
  // (Cleared on purpose by resetToIdle and exitToDashboard.) secondsLeft
  // is read from its ref, so a running timer isn't rewritten every tick:
  // the end time is what matters while it runs.
  useEffect(() => {
    if (timerState === "idle" || !subject || leavingRef.current) return;
    saveLiveSession({
      state: timerState,
      endTime: endTimeRef.current,
      secondsLeft: secondsLeftRef.current,
      duration,
      subject,
      task,
      taskId: linkedTaskId,
      elapsedMinutes,
      quality: reflectionQuality,
      note: reflectionNote,
    });
  }, [timerState, duration, subject, task, linkedTaskId, elapsedMinutes, reflectionQuality, reflectionNote]);

  // Closing the tab is the one exit a saved session can't survive, so
  // ask first while there's work in flight.
  useEffect(() => {
    if (timerState === "idle") return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [timerState]);

  // Clean up interval on unmount
  useEffect(() => () => clearTimer(), [clearTimer]);

  // Returning to a backgrounded tab: snap to the true remaining time (and
  // finish if it elapsed while hidden), since timers throttle when hidden.
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible" && intervalRef.current) tick();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [tick]);

  // When the timer runs out, let the ring's completion moment land, then
  // go straight to the one ending screen. (Also covers a session that
  // finished while the tab was reloading.)
  useEffect(() => {
    if (timerState !== "done") return;
    const t = setTimeout(endSession, 1400);
    return () => clearTimeout(t);
  }, [timerState, endSession]);

  // Keyboard control — Space toggles pause/resume, Esc leaves (the session
  // is kept). No letter shortcuts: a single letter that ends a session is
  // too easy to hit, and can't be switched off (WCAG 2.1.4).
  // Skips typing fields and lets a focused button handle its own keys.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const tag = el?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || el?.isContentEditable) return;

      if (e.key === "Escape") {
        if (!musicOpen && !backdropOpen) {
          e.preventDefault();
          handleExit();
        }
        return;
      }
      if (tag === "BUTTON") return;

      if (e.code === "Space") {
        if (timerState === "running") {
          e.preventDefault();
          pauseTimer();
        } else if (timerState === "paused") {
          e.preventDefault();
          startTimer();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [timerState, musicOpen, backdropOpen, pauseTimer, startTimer, handleExit]);

  // Top-bar popovers (music, backdrop) — close on outside click + Esc
  useEffect(() => {
    if (!musicOpen && !backdropOpen) return;
    const onClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (musicMenuRef.current && !musicMenuRef.current.contains(t)) setMusicOpen(false);
      if (backdropMenuRef.current && !backdropMenuRef.current.contains(t)) setBackdropOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      // Focus goes back to the button that opened the menu. Left on the
      // removed menu item it would fall to <body>, and the next Esc
      // would exit Focus from nowhere.
      const trigger = backdropOpen ? backdropBtnRef.current : musicBtnRef.current;
      setMusicOpen(false);
      setBackdropOpen(false);
      trigger?.focus();
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [musicOpen, backdropOpen]);

  // Opening the backdrop list puts focus on the current colour, so a
  // keyboard user lands inside it (same as the subject picker).
  useEffect(() => {
    if (!backdropOpen) return;
    backdropMenuRef.current
      ?.querySelector<HTMLButtonElement>('[aria-pressed="true"]')
      ?.focus();
  }, [backdropOpen]);

  const canBegin = subject !== null;
  const pillSubtitle = task.trim() || subjectLabel || "Ready to focus";

  // The tab title carries the session, so a student working in another
  // window can see how long is left and when it's done. Whole minutes,
  // not seconds: browsers throttle timers in background tabs (to about
  // once a minute after five minutes hidden), so a ticking mm:ss would
  // stall; a minute count stays true.
  // ponytail: "Done" can lag by up to a minute in a long-hidden tab; a
  // Web Worker timer or a notification fixes that if it matters.
  const minutesLeft = Math.ceil(secondsLeft / 60);
  const pageTitle = useRef<string | null>(null);
  useEffect(() => {
    pageTitle.current ??= document.title;
    document.title =
      timerState === "idle"
        ? pageTitle.current
        : timerState === "running"
        ? `${formatTime(minutesLeft)} left · ${pillSubtitle}`
        : timerState === "paused"
        ? `Paused · ${pillSubtitle}`
        : `Done · ${pillSubtitle}`;
  }, [timerState, minutesLeft, pillSubtitle]);
  useEffect(
    () => () => {
      if (pageTitle.current) document.title = pageTitle.current;
    },
    []
  );

  return (
    <div className="fixed inset-0 z-50 focus-canvas focus-canvas-enter overflow-hidden">
      {/* Animated topology mesh — palette-tinted, light surface. */}
      <div className="absolute inset-0" aria-hidden>
        <TopologyBg color={activePreset.color} backgroundColor={TOPO_BG} />
      </div>

      {/* Assistive-tech status — announces state changes only, never the
          per-second countdown (which would flood a screen reader). */}
      <p className="sr-only" role="status" aria-live="polite">
        {timerState === "running"
          ? `Focusing${subjectLabel ? ` on ${subjectLabel}` : ""}`
          : timerState === "paused"
          ? "Timer paused"
          : timerState === "done"
          ? "Session complete"
          : timerState === "reflecting"
          ? "Reflecting on your session"
          : ""}
      </p>

      {/* ── Top-left: context pill — only once a session is underway.
          On phones there's no room beside the top-right controls, so it
          drops to its own centred row beneath them. ── */}
      {timerState !== "idle" && (
        <header className="absolute top-[5.25rem] inset-x-4 flex justify-center sm:top-6 sm:left-6 sm:right-auto sm:block z-10 focus-stage-enter">
          <div className="focus-panel rounded-full px-4 py-2 flex items-center gap-3 min-w-0">
            <span className="whitespace-nowrap text-[11px] uppercase tracking-[0.2em] text-steel-600">
              {/* Keyed so the label re-mounts and blur-fades in on each state
                  change, bridging the swap instead of snapping. */}
              <span key={timerState} className="focus-label-swap inline-block">
                {timerState === "running" && "Focusing on"}
                {timerState === "paused" && "Paused"}
                {timerState === "done" && "Session complete"}
                {timerState === "reflecting" && "Reflecting"}
              </span>
            </span>
            <div className="flex items-center gap-2 min-w-0">
              <div
                className="w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors duration-300"
                style={{ backgroundColor: subjectColor }}
                aria-hidden
              />
              <span className="text-sm text-baltic-700 truncate max-w-[22ch]">
                {pillSubtitle}
              </span>
            </div>
          </div>
        </header>
      )}

      {/* ── Top-right: backdrop + music + exit ── */}
      <div className="absolute top-6 right-6 z-20 flex items-center gap-2">
        {/* Backdrop color */}
        <div className="relative" ref={backdropMenuRef}>
          {/* A disclosure (button + list of pressable buttons), not an
              ARIA menu: role="menu" promises arrow-key navigation that
              this short list doesn't need. */}
          <button
            ref={backdropBtnRef}
            onClick={() => { setBackdropOpen((v) => !v); setMusicOpen(false); }}
            aria-label="Backdrop color"
            aria-expanded={backdropOpen}
            aria-controls={backdropOpen ? "focus-backdrop-list" : undefined}
            title="Backdrop color"
            className="focus-btn tap-target !p-0 w-10 h-10 !rounded-full"
          >
            <span className="w-4 h-4 rounded-full border border-black/10" style={{ backgroundColor: activePreset.hex }} />
          </button>
          {backdropOpen && (
            <div
              id="focus-backdrop-list"
              className="absolute right-0 mt-2 w-52 rounded-2xl overflow-hidden bg-white border border-lavender-200 shadow-[0_16px_36px_-12px_rgba(38,45,64,0.28)] dropdown-enter"
              style={{ transformOrigin: "top right" }}
            >
              <div className="px-4 pt-3 pb-2 border-b border-lavender-100">
                <p className="text-[11px] uppercase tracking-[0.18em] text-steel-600">Backdrop</p>
              </div>
              <ul className="py-1">
                {TOPO_PRESETS.map((p) => (
                  <li key={p.key}>
                    <button
                      onClick={() => { selectPreset(p.key); setBackdropOpen(false); backdropBtnRef.current?.focus(); }}
                      aria-pressed={topoPreset === p.key}
                      className="w-full flex items-center gap-3 px-4 py-2 hover:bg-lavender-50 transition-colors duration-150 focus:outline-none focus-visible:bg-lavender-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-baltic-400/70"
                    >
                      <span className="w-3.5 h-3.5 rounded-full flex-shrink-0" style={{ backgroundColor: p.hex }} />
                      <span className="text-sm text-baltic-700 flex-1 text-left">{p.label}</span>
                      {topoPreset === p.key && (
                        <svg width={14} height={14} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="text-baltic-600 flex-shrink-0">
                          <path d="M2.5 7.5L6 11l5.5-7" />
                        </svg>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Music */}
        {SHOW_AMBIENT && (
          <div className="relative" ref={musicMenuRef}>
            <button
              ref={musicBtnRef}
              onClick={() => { setMusicOpen((v) => !v); setBackdropOpen(false); }}
              aria-label="Ambient sound"
              aria-expanded={musicOpen}
              aria-controls={musicOpen ? "focus-ambient-list" : undefined}
              className="focus-btn tap-target !p-0 w-10 h-10 !rounded-full"
            >
              <svg width={16} height={16} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 12V3l7-1v9" />
                <circle cx="4.5" cy="12" r="1.5" />
                <circle cx="11.5" cy="11" r="1.5" />
              </svg>
            </button>
            {musicOpen && (
              <div
                id="focus-ambient-list"
                className="absolute right-0 mt-2 w-72 rounded-2xl overflow-hidden bg-white border border-lavender-200 shadow-[0_16px_36px_-12px_rgba(38,45,64,0.28)] dropdown-enter"
                style={{ transformOrigin: "top right" }}
              >
                <div className="px-4 pt-3 pb-2 border-b border-lavender-100">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-steel-600">Ambient</p>
                </div>
                <ul>
                  {MUSIC_OPTIONS.map((opt) => (
                    <li key={opt.id}>
                      <button
                        disabled
                        className="w-full flex items-center justify-between gap-3 px-4 py-2.5 text-left disabled:cursor-not-allowed"
                      >
                        <div className="min-w-0">
                          <p className="text-sm text-steel-500 truncate">{opt.label}</p>
                          <p className="text-[11px] text-steel-400 truncate">{opt.desc}</p>
                        </div>
                        <span className="text-[11px] uppercase tracking-[0.12em] text-steel-400 border border-lavender-200 rounded-full px-1.5 py-0.5 flex-shrink-0">
                          Soon
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="px-4 py-2.5 border-t border-lavender-100 text-[11px] text-steel-600">
                  Ambient sound arrives in a later update.
                </div>
              </div>
            )}
          </div>
        )}

        {/* Exit */}
        <button
          onClick={handleExit}
          title={timerState === "idle" ? "Exit (Esc)" : "Leave (Esc) — your session is kept"}
          aria-keyshortcuts="Escape"
          aria-label={timerState === "idle" ? "Exit focus mode" : "Leave focus mode, your session is kept"}
          className="focus-btn tap-target !px-3 !py-2"
        >
          <svg width={12} height={12} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
            <path d="M3 3l6 6M9 3l-6 6" />
          </svg>
          <span className="text-sm whitespace-nowrap">{timerState === "idle" ? "Exit" : "Leave"}</span>
        </button>
      </div>

      {/* ── Center stage ── */}
      <main className="absolute inset-0 flex items-center justify-center px-6">
        {timerState === "idle" && (
          <SetupStage
            duration={duration}
            onDurationChange={setDuration}
            subject={subject}
            onSubjectChange={setSubject}
            task={task}
            onTaskChange={setTask}
            canBegin={canBegin}
            accentColor={subjectColor}
            onBegin={startTimer}
          />
        )}

        {(timerState === "running" || timerState === "paused" || timerState === "done") && (
          <SessionStage
            timerState={timerState}
            minutes={minutes}
            seconds={seconds}
            duration={duration}
            progress={progress}
            accentColor={subjectColor}
            onPause={pauseTimer}
            onResume={startTimer}
            onAddFive={addFiveMinutes}
            onFinish={endSession}
            onDiscard={resetToIdle}
          />
        )}

        {timerState === "reflecting" && (
          <ReflectionStage
            elapsedMinutes={elapsedMinutes}
            subjectLabel={subjectLabel}
            subjectColor={subjectColor}
            task={task}
            quality={reflectionQuality}
            onQualityChange={setReflectionQuality}
            note={reflectionNote}
            onNoteChange={setReflectionNote}
            onSave={saveSession}
            onKeepGoing={secondsLeft > 0 ? startTimer : undefined}
            doneTaskTitle={doneCandidate?.title}
            markDone={markDone}
            onMarkDoneChange={setMarkDone}
          />
        )}
      </main>

      {/* ── Bottom-center: mantra ── */}
      <footer className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
        <p className="font-script text-base text-baltic-600 focus-halo select-none">
          no tabs, no shortcuts, one thing
        </p>
      </footer>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
// Setup stage — duration ring, subject, task, backdrop, begin
// ───────────────────────────────────────────────────────────────

interface SetupStageProps {
  duration: number;
  onDurationChange: (n: number) => void;
  subject: string | null;
  onSubjectChange: (s: string | null) => void;
  task: string;
  onTaskChange: (s: string) => void;
  canBegin: boolean;
  accentColor: string;
  onBegin: () => void;
}

function SetupStage({
  duration, onDurationChange,
  subject, onSubjectChange,
  task, onTaskChange,
  canBegin, accentColor, onBegin,
}: SetupStageProps) {
  const [showTask, setShowTask] = useState(false);
  const showTaskInput = showTask || task.length > 0;

  return (
    <div className="focus-stage-enter w-full max-w-sm">
      {/* Intention card — reads as a handwritten line ("focus for 25 minutes
          on …") and quietly takes on the colour of the subject you choose. */}
      <div className="relative rounded-[28px] bg-white border border-lavender-200 shadow-[0_2px_4px_-1px_rgba(38,45,64,0.04),0_14px_30px_-10px_rgba(38,45,64,0.16),0_40px_64px_-32px_rgba(38,45,64,0.12)]">
        {/* Subject wash — barely-there tint at the head of the card. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-28 rounded-t-[28px] transition-[background-color,opacity] duration-500 ease-out"
          style={{
            backgroundColor: accentColor,
            opacity: subject ? 0.08 : 0.035,
            maskImage: "linear-gradient(180deg, #000, transparent)",
            WebkitMaskImage: "linear-gradient(180deg, #000, transparent)",
          }}
        />

        <div className="relative px-8 pt-8 pb-8">
          {/* Duration */}
          <p className="text-center font-script text-[17px] leading-none text-baltic-500 mb-3 select-none">
            focus for
          </p>
          <DurationPicker value={duration} onChange={onDurationChange} />

          {/* Torn-paper rule — a quiet nod to the journal. */}
          <div className="border-t border-dashed border-lavender-200 my-6" />

          {/* Subject */}
          <p className="text-center font-script text-[17px] leading-none text-baltic-500 mb-3 select-none">
            on
          </p>
          <SubjectSelector value={subject} onChange={onSubjectChange} />

          {/* Optional note — disclosed on demand to keep the default view calm */}
          <div className="mt-3">
            {showTaskInput ? (
              <input
                type="text"
                autoFocus={showTask && task.length === 0}
                value={task}
                onChange={(e) => onTaskChange(e.target.value)}
                placeholder="What are you working on?"
                maxLength={60}
                className="w-full px-4 py-2 text-sm rounded-full bg-white border border-lavender-400 text-baltic-800 placeholder:text-steel-600 outline-none focus:border-baltic-400 focus:ring-2 focus:ring-baltic-400/20 transition-colors duration-150"
              />
            ) : (
              <button
                type="button"
                onClick={() => setShowTask(true)}
                className="tap-target w-full flex items-center justify-center gap-1.5 py-1.5 text-xs text-steel-600 hover:text-baltic-600 transition-colors duration-150"
              >
                <svg width={12} height={12} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
                  <path d="M6 2v8M2 6h8" />
                </svg>
                Add what you&apos;re working on
              </button>
            )}
          </div>

          {/* Begin — fills with the subject's colour once a subject is set. */}
          <button
            onClick={onBegin}
            disabled={!canBegin}
            style={
              canBegin
                ? { backgroundColor: readableFill(accentColor), color: "#ffffff" }
                : undefined
            }
            className={cn(
              "mt-7 w-full inline-flex items-center justify-center gap-2 rounded-full py-3.5 text-[15px] font-medium transition-[filter,transform,background-color,color,box-shadow] duration-150 ease-out active:scale-[0.98]",
              canBegin
                ? "hover:brightness-[0.94] shadow-[0_6px_16px_-8px_rgba(38,45,64,0.35)]"
                : "bg-baltic-100 text-baltic-500 cursor-not-allowed",
            )}
          >
            <svg width={14} height={14} viewBox="0 0 14 14" fill="none">
              <polygon points="3,2 12,7 3,12" fill="currentColor" />
            </svg>
            Begin focusing
          </button>

          {!canBegin && (
            <p className="mt-3 text-center text-xs text-steel-600 select-none">Pick a subject to begin</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
// Session stage — countdown ring + controls
// ───────────────────────────────────────────────────────────────

interface SessionStageProps {
  timerState: "running" | "paused" | "done";
  minutes: number;
  seconds: number;
  duration: number;
  progress: number;
  accentColor: string;
  onPause: () => void;
  onResume: () => void;
  onAddFive: () => void;
  onFinish: () => void;
  onDiscard: () => void;
}

function SessionStage({
  timerState, minutes, seconds, duration, progress, accentColor,
  onPause, onResume, onAddFive, onFinish, onDiscard,
}: SessionStageProps) {
  const size = 320;
  const cx = size / 2;
  const ringR = 140;
  const circ = 2 * Math.PI * ringR;
  const isDone = timerState === "done";
  const isActive = timerState === "running" || timerState === "paused";
  const accent = accentColor;
  const offset = circ * (1 - progress / 100);

  return (
    <div className="focus-stage-enter flex flex-col items-center">
      <div
        className={cn("relative", isDone && "focus-complete-settle")}
        style={{ width: size, height: size }}
      >
        {/* Frosted core — a whisper of blur that softens the mesh behind the
            countdown. Edge fades out via a radial mask so there's no hard
            disc; it reads as haze, not a card. */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" aria-hidden>
          <div
            className="rounded-full"
            style={{
              width: 248,
              height: 248,
              background: "rgba(255,255,255,0.22)",
              backdropFilter: "blur(7px)",
              WebkitBackdropFilter: "blur(7px)",
              maskImage: "radial-gradient(closest-side, #000 70%, transparent 100%)",
              WebkitMaskImage: "radial-gradient(closest-side, #000 70%, transparent 100%)",
            }}
          />
        </div>

        {/* Minimal hour ticks — faint watch-face character, 12 only. */}
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0" aria-hidden>
          {Array.from({ length: 12 }).map((_, i) => {
            const a = (i * 30 - 90) * (Math.PI / 180);
            const r1 = 118;
            const r2 = i % 3 === 0 ? 109 : 113;
            return (
              <line
                key={i}
                x1={cx + r1 * Math.cos(a)} y1={cx + r1 * Math.sin(a)}
                x2={cx + r2 * Math.cos(a)} y2={cx + r2 * Math.sin(a)}
                stroke="#b8bdcc"
                strokeWidth={i % 3 === 0 ? 1.5 : 1}
                strokeLinecap="round"
                className="focus-tick-enter"
                style={{ animationDelay: `${i * 22}ms`, opacity: 0.55 }}
              />
            );
          })}
        </svg>

        {/* Progress ring — bold rounded arc in the subject's colour. */}
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0 -rotate-90">
          <defs>
            <linearGradient id="focusArc" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={accent} stopOpacity={0.45} />
              <stop offset="100%" stopColor={accent} stopOpacity={1} />
            </linearGradient>
          </defs>
          <circle cx={cx} cy={cx} r={ringR} fill="none" stroke="#e4e6ec" strokeWidth={3} />
          <circle
            cx={cx} cy={cx} r={ringR}
            fill="none"
            stroke="url(#focusArc)"
            strokeWidth={7}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            // Paused, the arc steps back so the ring itself says "on hold",
            // not just the small label under the time.
            style={{
              transition: "stroke-dashoffset 900ms linear, opacity 300ms var(--ease-out)",
              opacity: timerState === "paused" ? 0.4 : 1,
            }}
          />
        </svg>

        {/* Center readout */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-6xl font-extralight tracking-tight tabular-nums leading-none text-baltic-800">
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </p>
          <p
            className={cn(
              "mt-3 text-[11px] uppercase tracking-[0.22em] text-steel-600 tabular-nums focus-halo",
              isDone && "focus-complete-label",
            )}
          >
            {isDone ? "Complete" : timerState === "paused" ? "Paused" : `of ${String(duration).padStart(2, "0")}:00`}
          </p>
          {isActive && (
            <button
              onClick={onAddFive}
              className="tap-target mt-3.5 inline-flex items-center gap-1 rounded-full border border-lavender-200 bg-white/60 px-2.5 py-1 text-xs font-medium text-steel-600 hover:border-baltic-300 hover:text-baltic-600 transition-colors duration-150 press"
            >
              <svg width={10} height={10} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round">
                <path d="M6 2v8M2 6h8" />
              </svg>
              <span className="tabular-nums">5 min</span>
            </button>
          )}
        </div>
      </div>

      {/* Controls — one primary toggle plus Finish; Discard tucked beneath. */}
      <div className="flex items-center gap-2.5 mt-9">
        {timerState === "running" && (
          <button onClick={onPause} title="Pause (Space)" aria-keyshortcuts="Space" className="focus-btn focus-btn-primary tap-target !px-6">
            <svg width={12} height={12} viewBox="0 0 12 12" fill="currentColor">
              <rect x="2.5" y="2" width="2.5" height="8" rx="0.5" />
              <rect x="7" y="2" width="2.5" height="8" rx="0.5" />
            </svg>
            Pause
          </button>
        )}
        {timerState === "paused" && (
          <button onClick={onResume} title="Resume (Space)" aria-keyshortcuts="Space" className="focus-btn focus-btn-primary tap-target !px-6">
            <svg width={12} height={12} viewBox="0 0 12 12" fill="currentColor">
              <polygon points="3,2 10,6 3,10" />
            </svg>
            Resume
          </button>
        )}
        {isActive && (
          <button onClick={onFinish} className="focus-btn tap-target">
            Finish
          </button>
        )}
        {/* Done: no buttons. The completion moment plays, then the page
            moves on to the ending screen by itself. */}
      </div>

      {/* Discard — quiet and separated; abandons the session without logging. */}
      {isActive && (
        <div className="mt-3">
          <DiscardButton onConfirm={onDiscard} />
        </div>
      )}
    </div>
  );
}

// Discard control — a two-step confirm so a misclick can't throw away an
// in-progress session. Disarms itself after a few seconds.
function DiscardButton({ onConfirm }: { onConfirm: () => void }) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 3000);
    return () => clearTimeout(t);
  }, [armed]);
  return (
    <button
      onClick={() => { if (armed) onConfirm(); else setArmed(true); }}
      className={cn(
        "tap-target px-3 py-2 rounded-full text-sm transition-colors duration-150 press",
        armed ? "text-red-700 font-medium focus-halo" : "text-steel-600 hover:text-red-600 focus-halo"
      )}
    >
      {armed ? "Confirm discard" : "Discard"}
    </button>
  );
}

// ───────────────────────────────────────────────────────────────
// Reflection stage
// ───────────────────────────────────────────────────────────────

interface ReflectionStageProps {
  elapsedMinutes: number;
  subjectLabel: string | null;
  subjectColor: string;
  task: string;
  quality: FocusQuality | null;
  onQualityChange: (q: FocusQuality) => void;
  note: string;
  onNoteChange: (s: string) => void;
  onSave: () => void;
  /** Present when the session was finished early: back to the timer. */
  onKeepGoing?: () => void;
  /** Title of the planner task this session belongs to, if any. */
  doneTaskTitle?: string;
  markDone: boolean;
  onMarkDoneChange: (v: boolean) => void;
}

// The one ending screen. Everything on it is optional except saving:
// rate it or don't, note it or don't, and "Save session" logs it either
// way. (Leaving without logging is Exit, with its own confirm.)
function ReflectionStage({
  elapsedMinutes, subjectLabel, subjectColor, task,
  quality, onQualityChange, note, onNoteChange,
  onSave, onKeepGoing, doneTaskTitle, markDone, onMarkDoneChange,
}: ReflectionStageProps) {
  return (
    <div className="focus-stage-enter rounded-3xl bg-white border border-lavender-200 shadow-[0_18px_44px_-14px_rgba(38,45,64,0.22)] p-8 w-full max-w-sm flex flex-col items-center">
      {/* Session summary */}
      <div className="flex items-center gap-2 mb-1">
        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: subjectColor }} />
        <span className="text-xs text-steel-600 tabular-nums">
          {formatTime(elapsedMinutes)}{subjectLabel ? ` · ${subjectLabel}` : ""}
        </span>
      </div>
      {task.trim() ? (
        <p className="text-sm text-baltic-700 mb-5 truncate max-w-full">
          {task.trim()}
        </p>
      ) : (
        <div className="mb-5" />
      )}

      <h2 className="text-lg font-medium text-baltic-800 tracking-tight">
        How focused were you?
      </h2>
      <p className="text-xs text-steel-600 mt-1 mb-5">Optional</p>

      <QualitySelector value={quality} onChange={onQualityChange} size={36} />

      {/* The note belongs to the rating (it's saved with it), so it
          appears once there is one: a note typed without a rating would
          have nowhere to go. */}
      {(quality || note) && (
        <div className="w-full mt-6">
          <input
            type="text"
            value={note}
            onChange={(e) => onNoteChange(e.target.value)}
            maxLength={80}
            placeholder="What clicked? (optional)"
            aria-label="What clicked? (optional)"
            className="w-full px-4 py-2 text-sm text-center rounded-full bg-white border border-lavender-400 text-baltic-800 placeholder:text-steel-600 outline-none focus:border-baltic-400 focus:ring-2 focus:ring-baltic-400/20 transition-colors duration-150"
          />
        </div>
      )}

      {/* The moment you actually know a task is finished: right after
          working on it. Saving the session honours it. */}
      {doneTaskTitle && (
        <label className="mt-5 flex w-full cursor-pointer items-start gap-2.5 rounded-2xl border border-lavender-200 px-4 py-3 text-sm text-baltic-700 hover:bg-lavender-50 transition-colors duration-150">
          <input
            type="checkbox"
            checked={markDone}
            onChange={(e) => onMarkDoneChange(e.target.checked)}
            className="mt-0.5 h-4 w-4 flex-shrink-0 accent-baltic-600"
          />
          <span className="min-w-0">
            Mark <span className="font-semibold">{doneTaskTitle}</span> done
          </span>
        </label>
      )}

      <button onClick={onSave} className="focus-btn focus-btn-primary !px-6 mt-6">
        Save session
      </button>
      {onKeepGoing && (
        <button
          onClick={onKeepGoing}
          className="tap-target mt-3 rounded-md px-1 text-sm font-medium text-steel-600 underline decoration-steel-300 underline-offset-2 hover:text-baltic-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-baltic-400/70"
        >
          Keep going
        </button>
      )}
    </div>
  );
}
