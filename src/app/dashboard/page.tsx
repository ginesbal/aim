"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  usePreferences,
  useTasks,
  useFocus,
  useSubjects,
} from "@/lib/contexts";
import {
  getGreeting,
  getWeekday,
  getFormattedDate,
  formatTime,
  formatDate,
  isOverdue,
  isDueToday,
  cn,
} from "@/lib/utils";
import { PRIORITIES, type Task, type FocusSession } from "@/lib/types";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import AimLogo from "@/components/layout/AimLogo";
import { useRouter } from "next/navigation";

/**
 * Re-render the component at the next local midnight so greeting, streak,
 * and "due today" stay accurate if the tab is left open overnight. Each tick
 * schedules the next one, so it keeps working across multiple midnights.
 */
function useMidnightTick() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const now = new Date();
    const next = new Date(now);
    next.setHours(24, 0, 0, 0);
    const ms = next.getTime() - now.getTime();
    const id = setTimeout(() => setTick((n) => n + 1), ms + 500);
    return () => clearTimeout(id);
  }, [tick]);
}

export default function DashboardPage() {
  const { name, isFirstVisit, dailyGoal, setName } = usePreferences();
  const { tasks, toggleComplete } = useTasks();
  const { todayMinutes, streak, sessions } = useFocus();
  const { getSubject } = useSubjects();
  const router = useRouter();
  useMidnightTick();

  const [showWelcome, setShowWelcome] = useState(isFirstVisit);
  const [welcomeName, setWelcomeName] = useState("");

  const firstName = name ? name.split(" ")[0] : "there";

  const pendingTasks = useMemo(
    () =>
      tasks
        .filter((t) => !t.completed)
        .sort(
          (a, b) =>
            new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        ),
    [tasks]
  );

  const nextTask = pendingTasks[0];
  const remainingCount = Math.max(pendingTasks.length - 1, 0);

  const lastSession = useMemo(
    () =>
      [...sessions].sort(
        (a, b) =>
          new Date(b.completedAt).getTime() -
          new Date(a.completedAt).getTime()
      )[0],
    [sessions]
  );

  const focusPct = Math.min(Math.round((todayMinutes / dailyGoal) * 100), 100);
  const minutesToGoal = Math.max(dailyGoal - todayMinutes, 0);

  // SVG ring math
  const ringRadius = 54;
  const ringCircumference = 2 * Math.PI * ringRadius;

  // Today's minutes split by subject, colored by user subjects.
  // Used to render the hero ring as a stacked arc (1.1).
  const subjectSlices = useMemo(() => {
    const today = new Date().toDateString();
    const todaysSessions = sessions.filter(
      (s) => new Date(s.completedAt).toDateString() === today
    );
    const byKey = new Map<string, number>();
    for (const s of todaysSessions) {
      byKey.set(s.subject, (byKey.get(s.subject) ?? 0) + s.duration);
    }
    return Array.from(byKey.entries()).map(([key, minutes]) => {
      const sub = getSubject(key);
      return {
        key,
        label: sub?.label ?? key,
        color: sub?.color ?? "#60729f",
        minutes,
      };
    });
  }, [sessions, getSubject]);

  // Seven-dot streak row: one entry per day, oldest → newest (1.2).
  const last7Days = useMemo(() => {
    const out: {
      key: string;
      dayLetter: string;
      hadSession: boolean;
      isToday: boolean;
    }[] = [];
    const keySet = new Set(
      sessions.map((s) => new Date(s.completedAt).toDateString())
    );
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toDateString();
      out.push({
        key,
        dayLetter: d.toLocaleDateString("en-US", { weekday: "narrow" }),
        hadSession: keySet.has(key),
        isToday: i === 0,
      });
    }
    return out;
  }, [sessions]);

  // Plain-language guidance copy that adapts to current state
  const aimGuidance = useMemo(() => {
    if (todayMinutes === 0) {
      return `Your goal is ${formatTime(dailyGoal)}. Start whenever you're ready.`;
    }
    if (focusPct >= 100) {
      return "You've hit today's goal — anything more is bonus time.";
    }
    if (focusPct >= 75) {
      return `Almost there — just ${formatTime(minutesToGoal)} left.`;
    }
    return `${formatTime(minutesToGoal)} to go to reach your goal.`;
  }, [todayMinutes, dailyGoal, focusPct, minutesToGoal]);

  function handleWelcomeSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!welcomeName.trim()) return;
    setName(welcomeName.trim());
    setShowWelcome(false);
  }

  function handleWelcomeDismiss() {
    // ESC / backdrop dismissal: accept the default "there" so the user isn't
    // trapped in a keyboard dead-end. They can still set their name in Settings.
    if (welcomeName.trim()) {
      setName(welcomeName.trim());
    } else if (!name) {
      setName("there");
    }
    setShowWelcome(false);
  }

  return (
    <div className="relative">
      {/* Welcome modal */}
      <Modal open={showWelcome} onClose={handleWelcomeDismiss} width="sm">
        <div className="text-center py-2">
          <div className="flex justify-center mb-4">
            <AimLogo size="md" />
          </div>
          <h2 className="text-display text-baltic-800 dark:text-baltic-100 mb-1">
            Welcome to aim
          </h2>
          <p className="text-body text-steel-500 dark:text-steel-400 mb-5">
            A calm space to plan your studies and build focus habits.
          </p>
          <form onSubmit={handleWelcomeSubmit} className="space-y-3">
            <Input
              id="welcome-name"
              placeholder="What should we call you?"
              value={welcomeName}
              onChange={(e) => setWelcomeName(e.target.value)}
              autoFocus
              className="text-center"
            />
            <Button type="submit" className="w-full">
              Get started
            </Button>
            <button
              type="button"
              onClick={handleWelcomeDismiss}
              className="text-xs text-steel-500 dark:text-steel-400 hover:text-baltic-700 dark:hover:text-baltic-300 transition-colors"
            >
              Skip for now
            </button>
          </form>
        </div>
      </Modal>

      {/* ─── Decorative blobs (subtle, behind everything) ─── */}
      <div
        aria-hidden
        className="hidden sm:block absolute top-32 right-[-80px] w-56 h-56 lg:w-72 lg:h-72 blob-1 bg-baltic-200/25 dark:bg-baltic-700/20 float-slow pointer-events-none -z-10"
      />
      <div
        aria-hidden
        className="hidden sm:block absolute top-[520px] left-[-60px] w-32 h-32 lg:w-40 lg:h-40 blob-3 bg-cream-200/30 dark:bg-cream-800/20 float-medium pointer-events-none -z-10"
      />
      <div
        aria-hidden
        className="hidden md:block absolute bottom-20 right-[8%] w-32 h-32 blob-2 bg-ash-200/30 dark:bg-ash-800/20 float-slow pointer-events-none -z-10"
      />

      {/* ─── 1. Greeting (plain, sets the room) ─── */}
      <header className="mb-8">
        <p className="text-xs font-mono uppercase tracking-[0.2em] text-steel-400 mb-2">
          {getWeekday()} · {getFormattedDate()}
        </p>
        <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-baltic-800 dark:text-baltic-100 leading-tight">
          {getGreeting()},{" "}
          <span className="italic font-light text-baltic-600 dark:text-baltic-300">
            {firstName}.
          </span>
        </h1>
      </header>

      {/* ─── 2. Your aim today — primary card ─── */}
      <TapeCard tapeColor="cream" className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6 md:gap-8 items-center">
          {/* Target ring */}
          <div className="relative mx-auto md:mx-0">
            <div className="absolute inset-0 -m-4 rounded-full bg-baltic-100/50 dark:bg-baltic-800/30 blur-xl" />
            <svg
              viewBox="0 0 130 130"
              className="relative w-36 h-36 sm:w-44 sm:h-44"
              role="img"
              aria-labelledby="aim-ring-title aim-ring-desc"
            >
              <title id="aim-ring-title">Daily focus progress</title>
              <desc id="aim-ring-desc">
                {`${formatTime(todayMinutes)} of ${formatTime(dailyGoal)} focused today (${focusPct}% of goal)${subjectSlices.length > 1 ? `, across ${subjectSlices.length} subjects.` : "."}`}
              </desc>
              {/* Concentric target rings */}
              <circle
                cx="65"
                cy="65"
                r={ringRadius}
                stroke="currentColor"
                className="text-lavender-200 dark:text-lavender-800"
                strokeWidth="3"
                fill="none"
              />
              <circle
                cx="65"
                cy="65"
                r={ringRadius - 10}
                stroke="currentColor"
                className="text-lavender-200/60 dark:text-lavender-800/60"
                strokeWidth="1"
                fill="none"
              />
              <circle
                cx="65"
                cy="65"
                r={ringRadius - 20}
                stroke="currentColor"
                className="text-lavender-200/40 dark:text-lavender-800/40"
                strokeWidth="1"
                fill="none"
              />
              <circle
                cx="65"
                cy="65"
                r="3"
                className="fill-baltic-700 dark:fill-baltic-300"
              />
              {/* Progress arc — stacked by subject */}
              {(() => {
                let cumulative = 0;
                return subjectSlices.map((slice) => {
                  const remainingBudget = Math.max(dailyGoal - cumulative, 0);
                  const sliceMinutes = Math.min(slice.minutes, remainingBudget);
                  if (sliceMinutes <= 0) return null;
                  const sliceLen = (sliceMinutes / dailyGoal) * ringCircumference;
                  const offsetLen = (cumulative / dailyGoal) * ringCircumference;
                  cumulative += sliceMinutes;
                  return (
                    <circle
                      key={slice.key}
                      cx="65"
                      cy="65"
                      r={ringRadius}
                      stroke={slice.color}
                      strokeWidth="6"
                      fill="none"
                      strokeLinecap={subjectSlices.length === 1 ? "round" : "butt"}
                      strokeDasharray={`${sliceLen} ${ringCircumference}`}
                      strokeDashoffset={-offsetLen}
                      transform="rotate(-90 65 65)"
                      style={{
                        transition:
                          "stroke-dashoffset 1s ease-out, stroke-dasharray 1s ease-out",
                      }}
                    />
                  );
                });
              })()}
              {/* Center text */}
              <text
                x="65"
                y="62"
                textAnchor="middle"
                className="fill-baltic-800 dark:fill-baltic-100"
                style={{ fontSize: "20px", fontWeight: 700 }}
              >
                {formatTime(todayMinutes)}
              </text>
              <text
                x="65"
                y="80"
                textAnchor="middle"
                className="fill-steel-400"
                style={{ fontSize: "10px", letterSpacing: "1px", textTransform: "uppercase" }}
              >
                of {formatTime(dailyGoal)}
              </text>
            </svg>

            {/* Subject legend — only when ≥2 subjects contributed today */}
            {subjectSlices.length >= 2 && (
              <ul className="mt-3 flex flex-wrap justify-center md:justify-start gap-x-3 gap-y-1 max-w-[12rem]">
                {subjectSlices.map((slice) => (
                  <li
                    key={slice.key}
                    className="flex items-center gap-1.5 text-[11px] text-steel-500 dark:text-steel-400"
                  >
                    <span
                      aria-hidden
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: slice.color }}
                    />
                    <span className="font-medium text-baltic-700 dark:text-baltic-200">
                      {slice.label}
                    </span>
                    <span className="tabular-nums">{formatTime(slice.minutes)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Title + guidance + CTA */}
          <div className="text-center md:text-left">
            <CardEyebrow>Your aim today</CardEyebrow>
            <p className="mt-2 text-2xl font-bold text-baltic-800 dark:text-baltic-100 leading-snug">
              {aimGuidance}
            </p>

            {/* Progress bar with anchors */}
            <div className="mt-4">
              <div className="h-2 rounded-full bg-lavender-100 dark:bg-lavender-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-baltic-600 dark:bg-baltic-400 transition-all duration-700"
                  style={{ width: `${focusPct}%` }}
                />
              </div>
              <div className="flex items-center justify-between gap-2 mt-1.5 flex-nowrap">
                <span className="text-[10px] font-mono uppercase tracking-wider text-steel-400">
                  Start
                </span>
                <span className="text-[10px] font-bold text-baltic-600 dark:text-baltic-400 tabular-nums">
                  {focusPct}%
                </span>
                <span className="text-[10px] font-mono uppercase tracking-wider text-steel-400">
                  Goal
                </span>
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={() =>
                router.push(
                  lastSession
                    ? `/focus?subject=${encodeURIComponent(lastSession.subject)}`
                    : "/focus"
                )
              }
              className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-baltic-700 dark:bg-baltic-500 text-white text-sm font-semibold hover:bg-baltic-800 dark:hover:bg-baltic-400 transition-colors shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-baltic-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-lavender-900"
            >
              <span aria-hidden className="w-1.5 h-1.5 rounded-full bg-cream-300 motion-safe:animate-pulse" />
              {todayMinutes === 0 ? "Begin a focus session" : "Continue focusing"}
              <span className="text-base leading-none">→</span>
            </button>
          </div>
        </div>
      </TapeCard>

      {/* ─── Pointer arrow ─── */}
      <div className="flex justify-center mb-3">
        <div className="flex flex-col items-center text-steel-400">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em]">
            Start here
          </span>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 2v10M3 8l4 4 4-4" />
          </svg>
        </div>
      </div>

      {/* ─── 3. Next up — guided task card ─── */}
      <TapeCard tapeColor="baltic" className="mb-6">
        <CardEyebrow>Next up</CardEyebrow>

        {nextTask ? (
          <NextTaskBlock
            task={nextTask}
            subject={getSubject(nextTask.subject)}
            onComplete={() => toggleComplete(nextTask.id)}
            onFocus={() => router.push(`/focus?subject=${encodeURIComponent(nextTask.subject)}`)}
            onViewAll={() => router.push("/tasks")}
            onOpen={() => router.push(`/tasks?task=${encodeURIComponent(nextTask.id)}`)}
            remainingCount={remainingCount}
          />
        ) : (
          <EmptyBlock
            title="Nothing on your plate."
            subtitle="No tasks yet. Add one to get started."
            actionLabel="Add your first task"
            onAction={() => router.push("/tasks")}
          />
        )}
      </TapeCard>

      {/* ─── 4. Two side-by-side context cards ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Streak card */}
        <TapeCard tapeColor="ash">
          <CardEyebrow>Your streak</CardEyebrow>
          <div className="mt-3 flex items-center gap-4">
            {/* Flame */}
            <div className="w-14 h-14 rounded-2xl bg-cream-100 dark:bg-cream-900/40 flex items-center justify-center flex-shrink-0">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-cream-600 dark:text-cream-400">
                <path d="M12 2c2.5 4 5 7 5 11a5 5 0 1 1-10 0c0-4 2.5-7 5-11Z" />
                <path d="M12 16a2 2 0 0 0 2-2c0-1.5-1-2-2-3.5-1 1.5-2 2-2 3.5a2 2 0 0 0 2 2Z" />
              </svg>
            </div>
            <div>
              <p className="text-3xl font-bold text-baltic-800 dark:text-baltic-100 leading-none tabular-nums">
                {streak}
              </p>
              <p className="text-xs text-steel-500 dark:text-steel-400 mt-1">
                {streak === 0
                  ? "Start one today."
                  : streak === 1
                  ? "day in a row — keep going."
                  : `days and counting.`}
              </p>
            </div>
          </div>

          {/* Seven-day rhythm */}
          <div
            className="mt-4 pt-4 border-t border-dashed border-lavender-200 dark:border-lavender-800"
            role="group"
            aria-label="Last seven days of sessions"
          >
            <ul className="flex items-center justify-between gap-1">
              {last7Days.map((d) => (
                <li
                  key={d.key}
                  className="flex flex-col items-center gap-1.5"
                  title={`${d.key}${d.hadSession ? " — session" : ""}`}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "w-2.5 h-2.5 rounded-full transition-colors",
                      d.hadSession
                        ? "bg-baltic-600 dark:bg-baltic-400"
                        : "bg-transparent border border-lavender-300 dark:border-lavender-700",
                      d.isToday &&
                        "ring-2 ring-offset-2 ring-offset-white dark:ring-offset-lavender-900 ring-cream-500 dark:ring-cream-400"
                    )}
                  />
                  <span
                    className={cn(
                      "text-[9px] font-mono uppercase tracking-wider",
                      d.isToday
                        ? "text-baltic-700 dark:text-baltic-300 font-bold"
                        : "text-steel-400"
                    )}
                  >
                    {d.dayLetter}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </TapeCard>

        {/* Pick up where you left off */}
        <TapeCard tapeColor="lavender">
          <CardEyebrow>Pick up where you left off</CardEyebrow>
          {lastSession ? (
            <LastSessionBlock
              session={lastSession}
              subject={getSubject(lastSession.subject)}
              onContinue={() =>
                router.push(`/focus?subject=${encodeURIComponent(lastSession.subject)}`)
              }
              onViewJournal={() => router.push("/journal")}
            />
          ) : (
            <div className="mt-3">
              <p className="text-sm text-steel-500 dark:text-steel-400">
                No sessions yet. Your first one will live here.
              </p>
              <button
                onClick={() => router.push("/focus")}
                className="mt-3 text-xs font-semibold text-baltic-600 dark:text-baltic-400 hover:text-baltic-800 dark:hover:text-baltic-200 transition-colors"
              >
                Start your first session →
              </button>
            </div>
          )}
        </TapeCard>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   REUSABLE PIECES — single design language across the page
   ───────────────────────────────────────────────────────────── */

/* Tape strip color variants */
const TAPE_VARIANTS = {
  cream: "bg-cream-300/70 dark:bg-cream-600/50",
  baltic: "bg-baltic-300/60 dark:bg-baltic-600/50",
  ash: "bg-ash-300/60 dark:bg-ash-600/50",
  lavender: "bg-lavender-300/70 dark:bg-lavender-600/50",
} as const;

type TapeColor = keyof typeof TAPE_VARIANTS;

/* Unified card with tape strip — used for every section */
function TapeCard({
  children,
  tapeColor = "cream",
  className,
}: {
  children: ReactNode;
  tapeColor?: TapeColor;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative rounded-2xl bg-white dark:bg-lavender-900 border border-lavender-200 dark:border-lavender-800 px-6 pt-8 pb-6 shadow-sm",
        className
      )}
    >
      {/* Tape strip */}
      <div
        aria-hidden
        className={cn(
          "absolute -top-2 left-8 w-16 h-4 rounded-sm shadow-sm",
          TAPE_VARIANTS[tapeColor]
        )}
        style={{ clipPath: "polygon(5% 0, 95% 0, 100% 100%, 0 100%)" }}
      />
      {children}
    </div>
  );
}

/* Small uppercase eyebrow used at the top of every card */
function CardEyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-steel-500 dark:text-steel-400">
      {children}
    </p>
  );
}

/* Next task block — guided action */
function NextTaskBlock({
  task,
  subject,
  onComplete,
  onFocus,
  onViewAll,
  onOpen,
  remainingCount,
}: {
  task: Pick<Task, "id" | "title" | "subject" | "dueDate" | "priority">;
  subject: { label: string; color: string } | undefined;
  onComplete: () => void;
  onFocus: () => void;
  onViewAll: () => void;
  onOpen: () => void;
  remainingCount: number;
}) {
  const color = subject?.color || "#60729f";
  const overdue = isOverdue(task.dueDate);
  const dueToday = !overdue && isDueToday(task.dueDate);
  const priority = PRIORITIES[task.priority];

  return (
    <div className="mt-3">
      {/* Task headline */}
      <div className="flex items-start gap-4">
        <div
          className="w-1 self-stretch rounded-full flex-shrink-0 mt-1"
          style={{ backgroundColor: color }}
        />
        <div className="flex-1 min-w-0">
          <button
            type="button"
            onClick={onOpen}
            className="text-left rounded-sm text-xl font-bold text-baltic-800 dark:text-baltic-100 leading-snug hover:text-baltic-600 dark:hover:text-baltic-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-baltic-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-lavender-900"
          >
            {task.title}
          </button>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1.5 text-xs text-steel-500 dark:text-steel-400">
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: color }}
              />
              {subject?.label || task.subject}
            </span>
            <span className="text-steel-300 dark:text-steel-600">·</span>
            {overdue ? (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-red-50 dark:bg-red-950/40 text-red-700/90 dark:text-red-300/90 text-[10px] font-bold uppercase tracking-wider">
                Overdue
              </span>
            ) : dueToday ? (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-cream-100 dark:bg-cream-900/40 text-cream-800 dark:text-cream-200 text-[10px] font-bold uppercase tracking-wider">
                Due today
              </span>
            ) : (
              <span className="text-xs font-medium text-steel-500 dark:text-steel-400">
                Due {formatDate(task.dueDate)}
              </span>
            )}
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider"
              style={{
                backgroundColor: `${priority.color}1a`,
                color: priority.color,
              }}
            >
              <span
                aria-hidden
                className="w-1 h-1 rounded-full"
                style={{ backgroundColor: priority.color }}
              />
              {priority.label}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-5 flex items-center gap-2 flex-wrap">
        <button
          onClick={onFocus}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-baltic-700 dark:bg-baltic-500 text-white text-xs font-semibold hover:bg-baltic-800 dark:hover:bg-baltic-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-baltic-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-lavender-900"
        >
          Focus on this
          <span className="text-sm leading-none">→</span>
        </button>
        <button
          onClick={onComplete}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-lavender-200 dark:border-lavender-700 text-baltic-700 dark:text-baltic-300 text-xs font-semibold hover:bg-baltic-50 dark:hover:bg-baltic-900/40 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-baltic-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-lavender-900"
        >
          <svg width="11" height="11" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 5l2.5 2.5L8 3" />
          </svg>
          Mark done
        </button>
      </div>

      {/* More tasks footer */}
      {remainingCount > 0 && (
        <div className="mt-5 pt-4 border-t border-dashed border-lavender-200 dark:border-lavender-800">
          <button
            onClick={onViewAll}
            className="rounded-sm text-xs text-steel-500 dark:text-steel-400 hover:text-baltic-700 dark:hover:text-baltic-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-baltic-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-lavender-900"
          >
            <span className="font-semibold tabular-nums">{remainingCount}</span>{" "}
            more on your list →
          </button>
        </div>
      )}
    </div>
  );
}

/* Last session block */
function LastSessionBlock({
  session,
  subject,
  onContinue,
  onViewJournal,
}: {
  session: Pick<FocusSession, "id" | "subject" | "duration" | "completedAt">;
  subject: { label: string; color: string } | undefined;
  onContinue: () => void;
  onViewJournal: () => void;
}) {
  const color = subject?.color || "#60729f";
  const date = new Date(session.completedAt);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  const whenLabel = isToday
    ? "Earlier today"
    : isYesterday
    ? "Yesterday"
    : date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const timeLabel = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className="mt-3">
      <div className="flex items-center gap-3">
        <div
          className="w-1 self-stretch rounded-full flex-shrink-0"
          style={{ backgroundColor: color }}
        />
        <div className="flex-1 min-w-0">
          <p className="text-base font-bold text-baltic-800 dark:text-baltic-100 truncate">
            {subject?.label || session.subject}
          </p>
          <p className="text-xs text-steel-500 dark:text-steel-400 mt-0.5">
            {formatTime(session.duration)} · {whenLabel} at {timeLabel}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <button
          onClick={onContinue}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-baltic-700 dark:bg-baltic-500 text-white text-xs font-semibold hover:bg-baltic-800 dark:hover:bg-baltic-400 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-baltic-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-lavender-900"
        >
          Continue
          <span className="text-sm leading-none">→</span>
        </button>
        <button
          onClick={onViewJournal}
          className="rounded-sm text-xs font-semibold text-steel-500 dark:text-steel-400 hover:text-baltic-700 dark:hover:text-baltic-300 transition-colors px-2 py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-baltic-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-lavender-900"
        >
          See journal
        </button>
      </div>
    </div>
  );
}

/* Empty state for next-up */
function EmptyBlock({
  title,
  subtitle,
  actionLabel,
  onAction,
}: {
  title: string;
  subtitle: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="mt-3 py-2">
      <p className="text-xl font-bold text-baltic-800 dark:text-baltic-100">
        {title}
      </p>
      <p className="text-xs text-steel-500 dark:text-steel-400 italic mt-1">
        {subtitle}
      </p>
      <button
        onClick={onAction}
        className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-baltic-700 dark:bg-baltic-500 text-white text-xs font-semibold hover:bg-baltic-800 dark:hover:bg-baltic-400 transition-colors"
      >
        {actionLabel}
        <span className="text-sm leading-none">→</span>
      </button>
    </div>
  );
}
