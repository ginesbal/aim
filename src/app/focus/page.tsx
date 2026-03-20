"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { useFocus } from "@/lib/contexts";
import { SUBJECTS, type SubjectKey, type FocusQuality } from "@/lib/types";
import { cn, formatTime } from "@/lib/utils";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import ProgressRing from "@/components/ui/ProgressRing";
import QualityIndicator, { QualitySelector } from "@/components/ui/QualityIndicator";

const Aurora = dynamic(() => import("@/components/ui/Aurora"), { ssr: false });

const PRESETS = [
  { label: "25 min", minutes: 25 },
  { label: "45 min", minutes: 45 },
  { label: "60 min", minutes: 60 },
];

// Aurora configurations per state — muted, calming palette
const AURORA_STATES = {
  idle: { opacity: 0, colorStops: ["#60729f", "#8b97b8", "#60729f"], speed: 0.3, amplitude: 0.6 },
  running: { opacity: 0.35, colorStops: ["#394460", "#60729f", "#8b97b8"], speed: 0.3, amplitude: 0.8 },
  paused: { opacity: 0.15, colorStops: ["#394460", "#60729f", "#8b97b8"], speed: 0.1, amplitude: 0.4 },
  done: { opacity: 0.3, colorStops: ["#4a6348", "#76946b", "#c8d4c4"], speed: 0.2, amplitude: 0.6 },
  reflecting: { opacity: 0, colorStops: ["#60729f", "#8b97b8", "#60729f"], speed: 0.1, amplitude: 0.3 },
} as const;

type TimerState = "idle" | "running" | "paused" | "done" | "reflecting";

export default function FocusPage() {
  const { sessions, addSession, todayMinutes, streak } = useFocus();
  const [duration, setDuration] = useState(25);
  const [subject, setSubject] = useState<SubjectKey>("mathematics");
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

  const aurora = AURORA_STATES[timerState];
  const showAurora = timerState === "running" || timerState === "paused" || timerState === "done";

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
    <div className="space-y-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-display text-baltic-800 dark:text-baltic-100">Focus</h1>
        <p className="text-sm text-steel-400 mt-1">
          {todayMinutes > 0 ? `${formatTime(todayMinutes)} studied today` : "Ready to begin a session"}
          {streak > 0 && ` · ${streak} day streak`}
        </p>
      </div>

      {/* Timer card — with aurora background layer */}
      <div className="relative overflow-hidden rounded-lg">
        {/* Aurora background — fades in/out based on timer state */}
        <div
          className="absolute inset-0 z-0 transition-opacity duration-1000 ease-in-out"
          style={{ opacity: aurora.opacity }}
        >
          {showAurora && (
            <Aurora
              colorStops={[...aurora.colorStops]}
              speed={aurora.speed}
              amplitude={aurora.amplitude}
              blend={0.6}
            />
          )}
        </div>

        {/* Card content — layered above aurora */}
        <div className={cn(
          "relative z-10 border border-lavender-100 dark:border-lavender-800 p-6",
          !showAurora && "bg-white dark:bg-lavender-900",
          showAurora && "bg-white/80 dark:bg-lavender-900/80 backdrop-blur-sm"
        )}>
          {timerState === "reflecting" ? (
            <div className="flex flex-col items-center py-6 reflection-enter">
              <div className="flex items-center gap-2 mb-6">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: SUBJECTS[subject]?.color || "#60729f" }}
                />
                <span className="text-sm text-baltic-700 dark:text-baltic-300">
                  {formatTime(elapsedMinutes)} · {SUBJECTS[subject]?.label || subject}
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
                  className="w-full px-3 py-2 text-sm text-center rounded-md border border-lavender-200 dark:border-lavender-700 bg-white dark:bg-lavender-900 text-baltic-800 dark:text-baltic-100 placeholder:text-steel-400 outline-none focus:ring-2 focus:ring-baltic-400/30 focus:border-baltic-400 transition-smooth"
                />
              </div>

              <div className="flex items-center gap-3 mt-6">
                <Button onClick={saveWithReflection} disabled={!reflectionQuality}>
                  Save reflection
                </Button>
                <Button variant="ghost" onClick={skipReflection}>
                  Skip
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center py-6">
              {/* Timer face with tick marks + sweep */}
              <div className="relative" style={{ width: 264, height: 264 }}>
                {/* Tick marks — 60 minute markers around the ring */}
                <svg
                  width={264}
                  height={264}
                  viewBox="0 0 264 264"
                  className="absolute inset-0"
                >
                  {Array.from({ length: 60 }).map((_, i) => {
                    const angle = (i * 6 - 90) * (Math.PI / 180);
                    const isMajor = i % 5 === 0;
                    const outerR = 130;
                    const innerR = isMajor ? 121 : 124;
                    const x1 = 132 + innerR * Math.cos(angle);
                    const y1 = 132 + innerR * Math.sin(angle);
                    const x2 = 132 + outerR * Math.cos(angle);
                    const y2 = 132 + outerR * Math.sin(angle);
                    const isActive = timerState === "running" || timerState === "paused";
                    return (
                      <line
                        key={i}
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
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

                {/* Sweep hand — thin line, rotates when running */}
                <div
                  className={cn(
                    "absolute inset-0 pointer-events-none",
                    timerState === "running" && "sweep-active",
                  )}
                  style={{
                    opacity: timerState === "running" ? 1 : 0,
                    transition: "opacity 0.3s ease",
                  }}
                >
                  <svg width={264} height={264} viewBox="0 0 264 264">
                    <line
                      x1={132}
                      y1={132}
                      x2={132}
                      y2={16}
                      stroke="#60729f"
                      strokeWidth={1}
                      strokeLinecap="round"
                      opacity={0.5}
                    />
                    <circle cx={132} cy={132} r={2} fill="#60729f" opacity={0.5} />
                  </svg>
                </div>

                {/* Progress ring — centered inside tick marks */}
                <div className="absolute inset-[12px]">
                  <ProgressRing
                    progress={timerState === "idle" ? 0 : progress}
                    size={240}
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
                      ) : timerState !== "idle" ? (
                        <p className="text-xs text-steel-400 mt-1">
                          {timerState === "paused" ? "Paused" : "Focusing"}
                        </p>
                      ) : null}
                    </div>
                  </ProgressRing>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-3 mt-6">
                {timerState === "idle" && (
                  <Button onClick={startTimer}>Start focusing</Button>
                )}
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

              {/* Duration presets */}
              {timerState === "idle" && (
                <div className="flex items-center gap-1 mt-5">
                  {PRESETS.map((p) => (
                    <button
                      key={p.minutes}
                      onClick={() => setDuration(p.minutes)}
                      className={cn(
                        "px-3 py-1.5 rounded-md text-sm font-medium transition-smooth",
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
                <div className="mt-5 w-full max-w-md">
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
                            : "text-steel-500 bg-lavender-50 dark:bg-lavender-800 dark:text-lavender-400 hover:bg-lavender-100"
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
        </div>
      </div>

      {/* Today's sessions */}
      {todaySessions.length > 0 && (
        <Card padding="md">
          <h3 className="text-title text-baltic-800 dark:text-baltic-100 mb-3">
            Today&apos;s sessions
          </h3>
          <div className="space-y-2">
            {todaySessions.map((session) => {
              const sub = SUBJECTS[session.subject as SubjectKey];
              return (
                <div key={session.id} className="flex items-center gap-3 py-1.5">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: sub?.color || "#60729f" }}
                  />
                  <span className="text-sm text-baltic-700 dark:text-baltic-300 flex-1">
                    {sub?.label || session.subject}
                  </span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {session.reflection && (
                      <QualityIndicator quality={session.reflection.quality} size={14} />
                    )}
                    <span className="text-xs text-steel-400">{formatTime(session.duration)}</span>
                  </div>
                </div>
              );
            })}
            <div className="pt-2 border-t border-lavender-100 dark:border-lavender-800 flex items-center justify-between">
              <span className="text-xs font-medium text-steel-400">Total</span>
              <span className="text-sm font-medium text-baltic-700 dark:text-baltic-300">
                {formatTime(todayMinutes)}
              </span>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
