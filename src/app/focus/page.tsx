"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useFocus } from "@/lib/contexts";
import { SUBJECTS, type SubjectKey } from "@/lib/types";
import { cn, formatTime } from "@/lib/utils";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import ProgressRing from "@/components/ui/ProgressRing";

const PRESETS = [
  { label: "25 min", minutes: 25 },
  { label: "45 min", minutes: 45 },
  { label: "60 min", minutes: 60 },
];

type TimerState = "idle" | "running" | "paused" | "done";

export default function FocusPage() {
  const { sessions, addSession, todayMinutes, streak } = useFocus();
  const [duration, setDuration] = useState(25);
  const [subject, setSubject] = useState<SubjectKey>("mathematics");
  const [timerState, setTimerState] = useState<TimerState>("idle");
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
  }, [clearTimer, duration]);

  const completeSession = useCallback(() => {
    const elapsed = Math.round((totalSeconds - secondsLeft) / 60);
    if (elapsed > 0) {
      addSession(subject, elapsed);
    }
    resetTimer();
  }, [totalSeconds, secondsLeft, subject, addSession, resetTimer]);

  // Cleanup
  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  // Update seconds when duration changes (only in idle)
  useEffect(() => {
    if (timerState === "idle") {
      setSecondsLeft(duration * 60);
    }
  }, [duration, timerState]);

  // Today's sessions
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
        {/* Timer — main focus area */}
        <div className="col-span-2">
          <Card padding="lg">
            <div className="flex flex-col items-center py-6">
              {/* Timer display */}
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
                    <Button variant="secondary" onClick={pauseTimer} size="lg">
                      Pause
                    </Button>
                    <Button variant="ghost" onClick={resetTimer} size="lg">
                      Reset
                    </Button>
                  </>
                )}
                {timerState === "paused" && (
                  <>
                    <Button onClick={startTimer} size="lg">
                      Resume
                    </Button>
                    <Button variant="ghost" onClick={resetTimer} size="lg">
                      Reset
                    </Button>
                  </>
                )}
                {timerState === "done" && (
                  <Button onClick={completeSession} size="lg" className="min-w-[140px]">
                    Save session
                  </Button>
                )}
              </div>

              {/* Duration presets — only in idle */}
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

              {/* Subject selector — only in idle */}
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
          </Card>
        </div>

        {/* Sidebar — today's sessions */}
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
                      <div className="flex-1">
                        <p className="text-sm font-medium text-baltic-700 dark:text-baltic-300">
                          {sub?.label || session.subject}
                        </p>
                      </div>
                      <span className="text-xs text-steel-400">{formatTime(session.duration)}</span>
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

          {/* Focus tip */}
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
                  Focus tip
                </p>
                <p className="text-xs text-steel-500 dark:text-steel-400 leading-relaxed">
                  The most effective study sessions are 25–50 minutes long. Take a
                  5-minute break between sessions to maintain focus quality.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
