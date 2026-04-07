"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { useFocus, useSubjects } from "@/lib/contexts";
import { SUBJECTS, type SubjectKey, type FocusQuality } from "@/lib/types";
import { cn, formatTime } from "@/lib/utils";
import Button from "@/components/ui/Button";
import ProgressRing from "@/components/ui/ProgressRing";
import { QualitySelector } from "@/components/ui/QualityIndicator";
import DurationPicker from "@/components/ui/DurationPicker";
import SubjectSelector from "@/components/ui/SubjectSelector";

const TopologyBg = dynamic(() => import("@/components/ui/TopologyBg"), { ssr: false });

const TOPO_STATES = {
  idle:       { color: 0x808eb3, bg: 0xeff1f5 },
  running:    { color: 0x808eb3, bg: 0xeff1f5 },
  paused:     { color: 0xa8aebd, bg: 0xeff1f5 },
  done:       { color: 0x76946b, bg: 0xf1f4f0 },
  reflecting: { color: 0x808eb3, bg: 0xeff1f5 },
} as const;

type TimerState = "idle" | "running" | "paused" | "done" | "reflecting";

export default function FocusPage() {
  const { addSession, sessions } = useFocus();
  const { getSubject } = useSubjects();
  const [duration, setDuration] = useState(25);

  // Default subject = most recently used (falls back to null until user picks)
  const lastUsedSubject = useMemo(() => {
    if (sessions.length === 0) return null;
    const latest = [...sessions].sort(
      (a, b) =>
        new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
    )[0];
    return latest?.subject ?? null;
  }, [sessions]);

  const [subject, setSubject] = useState<string | null>(null);

  // Seed subject from the most recent session once it's available
  useEffect(() => {
    if (subject === null && lastUsedSubject) {
      setSubject(lastUsedSubject);
    }
  }, [lastUsedSubject, subject]);
  const [timerState, setTimerState] = useState<TimerState>("idle");
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [reflectionQuality, setReflectionQuality] = useState<FocusQuality | null>(null);
  const [reflectionNote, setReflectionNote] = useState("");
  const [elapsedMinutes, setElapsedMinutes] = useState(0);

  const totalSeconds = duration * 60;
  const progress = ((totalSeconds - secondsLeft) / totalSeconds) * 100;

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  const isFullscreen = timerState === "running" || timerState === "paused" || timerState === "done" || timerState === "reflecting";
  const topoColors = TOPO_STATES[timerState];

  const subjectColor = (() => {
    if (!subject) return "#60729f";
    const userSub = getSubject(subject);
    if (userSub) return userSub.color;
    const legacySub = SUBJECTS[subject as SubjectKey];
    return legacySub?.color || "#60729f";
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

  const exitFocus = useCallback(() => {
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

  // Final fallback so a saved session always carries a subject string
  const defaultSubject = subject || lastUsedSubject || "general";

  const saveWithReflection = useCallback(() => {
    addSession(
      defaultSubject,
      elapsedMinutes,
      reflectionQuality ? { quality: reflectionQuality, ...(reflectionNote.trim() ? { note: reflectionNote.trim() } : {}) } : undefined
    );
    resetTimer();
  }, [defaultSubject, elapsedMinutes, reflectionQuality, reflectionNote, addSession, resetTimer]);

  const skipReflection = useCallback(() => {
    addSession(defaultSubject, elapsedMinutes);
    resetTimer();
  }, [defaultSubject, elapsedMinutes, addSession, resetTimer]);

  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  useEffect(() => {
    if (timerState === "idle") {
      setSecondsLeft(duration * 60);
    }
  }, [duration, timerState]);

  return (
    <>
      {/* Fullscreen focus overlay */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0">
            <TopologyBg
              color={topoColors.color}
              backgroundColor={topoColors.bg}
            />
          </div>

          {/* Exit button */}
          <button
            onClick={exitFocus}
            className="absolute top-6 right-6 z-10 flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium text-baltic-600 dark:text-baltic-300 bg-white/80 dark:bg-lavender-900/80 backdrop-blur-sm shadow-sm hover:bg-white dark:hover:bg-lavender-900 transition-smooth"
          >
            <svg width={14} height={14} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
              <path d="M10.5 3.5L3.5 10.5M3.5 3.5l7 7" />
            </svg>
            Exit
          </button>

          {/* Timer + controls — centered */}
          <div className="relative z-10 flex flex-col items-center">
            {timerState === "reflecting" ? (
              <div className="flex flex-col items-center reflection-enter bg-white/80 dark:bg-lavender-900/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg">
                <div className="flex items-center gap-2 mb-6">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: subjectColor }}
                  />
                  <span className="text-sm text-baltic-700 dark:text-baltic-300">
                    {formatTime(elapsedMinutes)}{subjectLabel ? ` · ${subjectLabel}` : ""}
                  </span>
                </div>

                <h2 className="text-title text-baltic-800 dark:text-baltic-100 mb-5">
                  How focused were you?
                </h2>

                <QualitySelector
                  value={reflectionQuality}
                  onChange={setReflectionQuality}
                  size={36}
                />

                <div className="w-full max-w-sm mt-6">
                  <input
                    type="text"
                    value={reflectionNote}
                    onChange={(e) => setReflectionNote(e.target.value)}
                    maxLength={80}
                    placeholder="What clicked? (optional)"
                    className="w-full px-3 py-2 text-sm text-center rounded-xl border border-lavender-200 dark:border-lavender-700 bg-white dark:bg-lavender-900 text-baltic-800 dark:text-baltic-100 placeholder:text-steel-400 outline-none focus:ring-2 focus:ring-baltic-400/30 focus:border-baltic-400 transition-smooth"
                  />
                </div>

                <div className="flex items-center gap-4 mt-7">
                  <Button onClick={saveWithReflection} disabled={!reflectionQuality}>
                    Save reflection
                  </Button>
                  <Button variant="ghost" onClick={skipReflection}>
                    Skip
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {/* Timer face */}
                <div className="relative" style={{ width: 280, height: 280 }}>
                  <svg
                    width={280}
                    height={280}
                    viewBox="0 0 280 280"
                    className="absolute inset-0"
                  >
                    {Array.from({ length: 60 }).map((_, i) => {
                      const angle = (i * 6 - 90) * (Math.PI / 180);
                      const isMajor = i % 5 === 0;
                      const outerR = 138;
                      const innerR = isMajor ? 129 : 132;
                      const x1 = 140 + innerR * Math.cos(angle);
                      const y1 = 140 + innerR * Math.sin(angle);
                      const x2 = 140 + outerR * Math.cos(angle);
                      const y2 = 140 + outerR * Math.sin(angle);
                      const isActive = timerState === "running" || timerState === "paused";
                      return (
                        <line
                          key={i}
                          x1={x1} y1={y1} x2={x2} y2={y2}
                          stroke="currentColor"
                          strokeWidth={isMajor ? 1.5 : 0.75}
                          strokeLinecap="round"
                          className={cn(
                            isMajor
                              ? "text-baltic-300 dark:text-baltic-600"
                              : "text-lavender-200 dark:text-lavender-700",
                            isActive && "tick-enter"
                          )}
                          style={isActive ? { animationDelay: `${i * 10}ms` } : undefined}
                        />
                      );
                    })}
                  </svg>

                  {/* Sweep hand — driven from React state so it stays in sync after blur */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      opacity: timerState === "running" || timerState === "paused" ? 1 : 0,
                      transform: `rotate(${((totalSeconds - secondsLeft) % 60) * 6}deg)`,
                      transformOrigin: "center",
                      transition:
                        timerState === "running"
                          ? "transform 0.95s linear, opacity 0.3s ease"
                          : "opacity 0.3s ease",
                    }}
                  >
                    <svg width={280} height={280} viewBox="0 0 280 280">
                      <line x1={140} y1={140} x2={140} y2={16} stroke="#60729f" strokeWidth={1} strokeLinecap="round" opacity={0.5} />
                      <circle cx={140} cy={140} r={2} fill="#60729f" opacity={0.5} />
                    </svg>
                  </div>

                  {/* Progress ring */}
                  <div
                    className="absolute inset-[12px]"
                    role="timer"
                    aria-live="off"
                    aria-valuemin={0}
                    aria-valuemax={totalSeconds}
                    aria-valuenow={secondsLeft}
                    aria-valuetext={`${minutes} minute${minutes === 1 ? "" : "s"} ${seconds} second${seconds === 1 ? "" : "s"} remaining`}
                  >
                    <ProgressRing
                      progress={progress}
                      size={256}
                      strokeWidth={10}
                      color={timerState === "done" ? "#76946b" : "#60729f"}
                      trackColor={timerState === "done" ? "#c8d4c4" : "#e2e4e9"}
                    >
                      <div className="text-center">
                        <p className={cn(
                          "text-5xl font-light tracking-tight tabular-nums",
                          timerState === "done"
                            ? "text-ash-600 dark:text-ash-400"
                            : "text-baltic-800 dark:text-baltic-100",
                        )}>
                          {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
                        </p>
                        {timerState === "done" ? (
                          <p className="text-xs text-ash-500 font-medium mt-1">Complete</p>
                        ) : (
                          <p className="text-xs text-steel-400 mt-1">
                            {timerState === "paused" ? "Paused" : "Focusing"}
                          </p>
                        )}
                      </div>
                    </ProgressRing>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-3 mt-6">
                  {timerState === "running" && (
                    <>
                      <Button variant="secondary" onClick={pauseTimer}>Pause</Button>
                      <Button variant="ghost" onClick={resetTimer}>Reset</Button>
                    </>
                  )}
                  {timerState === "paused" && (
                    <>
                      <Button onClick={startTimer}>Resume</Button>
                      <Button variant="ghost" onClick={resetTimer}>Reset</Button>
                    </>
                  )}
                  {timerState === "done" && (
                    <Button onClick={beginReflection}>Reflect on session</Button>
                  )}
                </div>

                {subjectLabel && (
                  <div className="flex items-center gap-2 mt-4">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: subjectColor }}
                    />
                    <span className="text-xs text-steel-400">
                      {subjectLabel}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Normal page content — visible when idle */}
      <div className={cn("relative", isFullscreen && "hidden")}>
        {/* Decorative blobs */}
        <div aria-hidden className="hidden sm:block absolute -top-8 -left-16 w-32 h-32 lg:w-40 lg:h-40 blob-3 bg-lavender-200/25 dark:bg-lavender-700/20 float-medium pointer-events-none -z-10" />
        <div aria-hidden className="hidden md:block absolute top-48 -right-20 w-28 h-28 lg:w-32 lg:h-32 blob-1 bg-baltic-200/25 dark:bg-baltic-700/20 float-slow pointer-events-none -z-10" />

        <div className="max-w-lg mx-4 sm:mx-auto">
          {/* Timer setup */}
          <div className="card-base rounded-2xl p-8 flex flex-col items-center">
            {/* Decorative ring with tick marks */}
            <div className="relative" style={{ width: 300, height: 300 }}>
              <svg width={300} height={300} viewBox="0 0 300 300" className="absolute inset-0">
                <circle cx="150" cy="150" r="146" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-lavender-200 dark:text-lavender-700" />
                {Array.from({ length: 60 }).map((_, i) => {
                  const angle = (i * 6 - 90) * (Math.PI / 180);
                  const isMajor = i % 5 === 0;
                  const outerR = 146;
                  const innerR = isMajor ? 136 : 140;
                  const x1 = 150 + innerR * Math.cos(angle);
                  const y1 = 150 + innerR * Math.sin(angle);
                  const x2 = 150 + outerR * Math.cos(angle);
                  const y2 = 150 + outerR * Math.sin(angle);
                  return (
                    <line
                      key={i}
                      x1={x1} y1={y1} x2={x2} y2={y2}
                      stroke="currentColor"
                      strokeWidth={isMajor ? 1.5 : 0.5}
                      strokeLinecap="round"
                      className={isMajor
                        ? "text-baltic-300 dark:text-baltic-600"
                        : "text-lavender-200 dark:text-lavender-700"
                      }
                    />
                  );
                })}
                {(() => {
                  const pct = Math.min(duration / 120, 1);
                  const r = 126;
                  const circumference = 2 * Math.PI * r;
                  const offset = circumference * (1 - pct);
                  return (
                    <circle
                      cx="150" cy="150" r={r}
                      fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round"
                      strokeDasharray={circumference} strokeDashoffset={offset}
                      className="text-baltic-400/30 dark:text-baltic-500/30 -rotate-90 origin-center transition-all duration-500"
                    />
                  );
                })()}
                <circle cx="150" cy="150" r="105" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-lavender-200 dark:text-lavender-700" />
              </svg>

              <div className="absolute inset-0 flex items-center justify-center">
                <DurationPicker value={duration} onChange={setDuration} />
              </div>
            </div>

            <div className="w-16 border-t border-lavender-100 dark:border-lavender-800 my-5" />

            <SubjectSelector value={subject} onChange={setSubject} />

            <button
              onClick={startTimer}
              className="mt-6 w-full py-3.5 rounded-2xl bg-baltic-600 hover:bg-baltic-700 dark:bg-baltic-500 dark:hover:bg-baltic-400 text-white font-semibold text-sm shadow-[0_4px_20px_rgba(38,45,64,0.25)] hover:shadow-[0_6px_28px_rgba(38,45,64,0.35)] transition-smooth flex items-center justify-center gap-2"
            >
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="10" cy="10" r="8" />
                <path d="M10 6v4l2.5 2.5" />
              </svg>
              Start focusing
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
