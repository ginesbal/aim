"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useFocus } from "@/lib/contexts";
import { SUBJECTS, type SubjectKey, type FocusQuality } from "@/lib/types";
import { cn, formatTime } from "@/lib/utils";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import ProgressRing from "@/components/ui/ProgressRing";
import QualityIndicator, { QualitySelector } from "@/components/ui/QualityIndicator";

const PRESETS = [
  { label: "25 min", minutes: 25 },
  { label: "45 min", minutes: 45 },
  { label: "60 min", minutes: 60 },
];

type TimerState = "idle" | "running" | "paused" | "done" | "reflecting";

export default function FocusPage() {
  const { sessions, addSession, todayMinutes, streak } = useFocus();
  const [duration, setDuration] = useState(25);
  const [subject, setSubject] = useState<SubjectKey>("mathematics");
  const [timerState, setTimerState] = useState<TimerState>("idle");
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reflection state
  const [reflectionQuality, setReflectionQuality] = useState<FocusQuality | null>(null);
  const [reflectionNote, setReflectionNote] = useState("");
  const [elapsedMinutes, setElapsedMinutes] = useState(0);

  const totalSeconds = duration * 60;
  const progress = ((totalSeconds - secondsLeft) / totalSeconds) * 100;

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    clearTimer();
    setTimerState("running");
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearTimer();
          setTimerState("done");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [clearTimer]);

  const pauseTimer = useCallback(() => {
    clearTimer();
    setTimerState("paused");
  }, [clearTimer]);

  const resetTimer = useCallback(() => {
    clearTimer();
    setTimerState("idle");
    setSecondsLeft(duration * 60);
    setReflectionQuality(null);
    setReflectionNote("");
  }, [clearTimer, duration]);

  const beginReflection = useCallback(() => {
    const elapsed = Math.max(Math.round((totalSeconds - secondsLeft) / 60), 1);
    setElapsedMinutes(elapsed);
    setTimerState("reflecting");
  }, [totalSeconds, secondsLeft]);

  const saveWithReflection = useCallback(() => {
    addSession(
      subject,
      elapsedMinutes,
      reflectionQuality ? { quality: reflectionQuality, ...(reflectionNote.trim() ? { note: reflectionNote.trim() } : {}) } : undefined
    );
    resetTimer();
  }, [subject, elapsedMinutes, reflectionQuality, reflectionNote, addSession, resetTimer]);

  const skipReflection = useCallback(() => {
    addSession(subject, elapsedMinutes);
    resetTimer();
  }, [subject, elapsedMinutes, addSession, resetTimer]);

  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  useEffect(() => {
    if (timerState === "idle") {
      setSecondsLeft(duration * 60);
    }
  }, [duration, timerState]);

  const todaySessions = sessions.filter(
    (s) => new Date(s.completedAt).toDateString() === new Date().toDateString()
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-display text-baltic-800 dark:text-baltic-100">Focus</h1>
        <p className="text-body text-steel-500 dark:text-steel-400 mt-1">
          {todayMinutes > 0 ? `${formatTime(todayMinutes)} studied today` : "Ready to begin a session"}
          {streak > 0 && ` · ${streak} day streak`}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Timer / Reflection — main area */}
        <div className="col-span-2">
          <Card padding="lg">
            {timerState === "reflecting" ? (
              /* ─── Reflection Panel ─── */
              <div className="flex flex-col items-center py-8 reflection-enter">
                {/* Session summary */}
                <div className="flex items-center gap-2.5 mb-8">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: SUBJECTS[subject]?.color || "#60729f" }}
                  />
                  <span className="text-sm font-medium text-baltic-700 dark:text-baltic-300">
                    {formatTime(elapsedMinutes)} · {SUBJECTS[subject]?.label || subject}
                  </span>
                </div>

                <h2 className="text-title text-baltic-800 dark:text-baltic-100 mb-6">
                  How focused were you?
                </h2>

                {/* Quality selector — 4 abstract circles */}
                <QualitySelector
                  value={reflectionQuality}
                  onChange={setReflectionQuality}
                  size={36}
                />

                {/* Optional note */}
                <div className="w-full max-w-sm mt-8">
                  <input
                    type="text"
                    value={reflectionNote}
                    onChange={(e) => setReflectionNote(e.target.value)}
                    maxLength={80}
                    placeholder="What clicked?"
                    className="w-full px-4 py-3 text-sm text-center rounded-lg border border-lavender-200 dark:border-lavender-700 bg-white dark:bg-lavender-900 text-baltic-800 dark:text-baltic-100 placeholder:text-steel-400 outline-none focus:ring-2 focus:ring-baltic-400/30 focus:border-baltic-400 transition-smooth"
                  />
                  <p className="text-[10px] text-steel-400 text-center mt-1.5">
                    {reflectionNote.length}/80 · optional
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 mt-8">
                  <Button onClick={saveWithReflection} size="lg" disabled={!reflectionQuality}>
                    Save reflection
                  </Button>
                  <Button variant="ghost" onClick={skipReflection} size="lg">
                    Skip
                  </Button>
                </div>
              </div>
            ) : (
              /* ─── Timer Display ─── */
              <div className="flex flex-col items-center py-6">
                <ProgressRing
                  progress={timerState === "idle" ? 0 : progress}
                  size={240}
                  strokeWidth={12}
                  color={timerState === "done" ? "#76946b" : "#60729f"}
                  trackColor={timerState === "done" ? "#c8d4c4" : "#e2e4e9"}
                >
                  <div className="text-center">
                    <p className={cn(
                      "text-5xl font-light tracking-tight tabular-nums",
                      timerState === "done"
                        ? "text-ash-600 dark:text-ash-400"
                        : "text-baltic-800 dark:text-baltic-100",
                      timerState === "running" && "timer-pulse"
                    )}>
                      {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
                    </p>
                    {timerState === "done" ? (
                      <p className="text-xs text-ash-500 font-medium mt-1">Session complete</p>
                    ) : timerState !== "idle" ? (
                      <p className="text-xs text-steel-400 mt-1">
                        {timerState === "paused" ? "Paused" : "Focusing"}
                      </p>
                    ) : null}
                  </div>
                </ProgressRing>

                {/* Controls */}
                <div className="flex items-center gap-3 mt-8">
                  {timerState === "idle" && (
                    <Button onClick={startTimer} size="lg" className="min-w-[140px]">
                      Start focusing
                    </Button>
                  )}
                  {timerState === "running" && (
                    <>
                      <Button variant="secondary" onClick={pauseTimer} size="lg">Pause</Button>
                      <Button variant="ghost" onClick={resetTimer} size="lg">Reset</Button>
                    </>
                  )}
                  {timerState === "paused" && (
                    <>
                      <Button onClick={startTimer} size="lg">Resume</Button>
                      <Button variant="ghost" onClick={resetTimer} size="lg">Reset</Button>
                    </>
                  )}
                  {timerState === "done" && (
                    <Button onClick={beginReflection} size="lg" className="min-w-[160px]">
                      Reflect on session
                    </Button>
                  )}
                </div>

                {/* Duration presets */}
                {timerState === "idle" && (
                  <div className="flex items-center gap-2 mt-6">
                    {PRESETS.map((p) => (
                      <button
                        key={p.minutes}
                        onClick={() => setDuration(p.minutes)}
                        className={cn(
                          "px-4 py-2 rounded-lg text-sm font-medium transition-smooth",
                          duration === p.minutes
                            ? "bg-baltic-100 text-baltic-700 dark:bg-baltic-800 dark:text-baltic-300"
                            : "text-steel-400 hover:text-baltic-600 hover:bg-lavender-50 dark:hover:bg-lavender-900"
                        )}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Subject selector */}
                {timerState === "idle" && (
                  <div className="mt-6 w-full max-w-xs">
                    <p className="text-label text-center mb-2">Subject</p>
                    <div className="flex flex-wrap justify-center gap-1.5">
                      {Object.entries(SUBJECTS).map(([key, { label, color }]) => (
                        <button
                          key={key}
                          onClick={() => setSubject(key as SubjectKey)}
                          className={cn(
                            "px-2.5 py-1 rounded-md text-xs font-medium transition-smooth",
                            subject === key
                              ? "text-white"
                              : "text-steel-500 hover:text-baltic-600 bg-lavender-50 dark:bg-lavender-800 dark:text-lavender-400"
                          )}
                          style={subject === key ? { backgroundColor: color } : undefined}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <h3 className="text-title text-baltic-800 dark:text-baltic-100 mb-4">
              Today&apos;s sessions
            </h3>
            {todaySessions.length > 0 ? (
              <div className="space-y-3">
                {todaySessions.map((session) => {
                  const sub = SUBJECTS[session.subject as SubjectKey];
                  return (
                    <div key={session.id} className="flex items-center gap-3">
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: sub?.color || "#60729f" }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-baltic-700 dark:text-baltic-300 truncate">
                          {sub?.label || session.subject}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {session.reflection && (
                          <QualityIndicator quality={session.reflection.quality} size={14} />
                        )}
                        <span className="text-xs text-steel-400">{formatTime(session.duration)}</span>
                      </div>
                    </div>
                  );
                })}
                <div className="pt-3 border-t border-lavender-100 dark:border-lavender-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-steel-500">Total</span>
                    <span className="text-sm font-semibold text-baltic-700 dark:text-baltic-300">
                      {formatTime(todayMinutes)}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-steel-400">No sessions yet today.</p>
            )}
          </Card>

          <Card className="bg-baltic-50 dark:bg-baltic-900/30 border-baltic-100 dark:border-baltic-800">
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-baltic-100 dark:bg-baltic-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#60729f" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M6 3v3.5l2 1.5" />
                  <circle cx="6" cy="6" r="5" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold text-baltic-700 dark:text-baltic-300 mb-1">
                  Why reflect?
                </p>
                <p className="text-xs text-steel-500 dark:text-steel-400 leading-relaxed">
                  Noting how focused you felt after each session builds self-awareness
                  over time. Even a quick note helps you identify what study
                  conditions work best for you.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
