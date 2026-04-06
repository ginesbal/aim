"use client";

import { useMemo, useState } from "react";
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
  cn,
} from "@/lib/utils";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import QualityIndicator from "@/components/ui/QualityIndicator";
import AimLogo from "@/components/layout/AimLogo";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const { name, isFirstVisit, dailyGoal, setName } = usePreferences();
  const { tasks, toggleComplete } = useTasks();
  const { todayMinutes, streak, sessions } = useFocus();
  const { getSubject } = useSubjects();
  const router = useRouter();

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

  const upcomingTasks = useMemo(() => pendingTasks.slice(0, 4), [pendingTasks]);

  const lastSession = useMemo(
    () =>
      [...sessions].sort(
        (a, b) =>
          new Date(b.completedAt).getTime() -
          new Date(a.completedAt).getTime()
      )[0],
    [sessions]
  );

  const weekMinutes = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    return sessions
      .filter((s) => new Date(s.completedAt) >= weekAgo)
      .reduce((sum, s) => sum + s.duration, 0);
  }, [sessions]);

  const focusPct = Math.min(Math.round((todayMinutes / dailyGoal) * 100), 100);

  // SVG ring math
  const ringRadius = 58;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference * (1 - focusPct / 100);

  function handleWelcomeSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!welcomeName.trim()) return;
    setName(welcomeName.trim());
    setShowWelcome(false);
  }

  // Editorial intention copy that adapts to time of day
  const intention = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "Where will you point your attention today?";
    if (h < 17) return "Pick the thing that matters and start there.";
    if (h < 21) return "A little more focus before the day folds up.";
    return "Wind down. Tomorrow is another aim.";
  }, []);

  return (
    <div className="relative">
      {/* Welcome modal */}
      <Modal open={showWelcome} onClose={() => {}} width="sm">
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
          </form>
        </div>
      </Modal>

      {/* ─── Decorative blobs (creatively placed, low opacity) ─── */}
      <div
        aria-hidden
        className="absolute top-20 right-[-60px] w-72 h-72 blob-1 bg-baltic-200/25 dark:bg-baltic-700/15 float-slow pointer-events-none -z-10"
      />
      <div
        aria-hidden
        className="absolute top-[480px] left-[-80px] w-44 h-44 blob-3 bg-cream-200/30 dark:bg-cream-800/15 float-medium pointer-events-none -z-10"
      />
      <div
        aria-hidden
        className="absolute bottom-20 right-[10%] w-32 h-32 blob-2 bg-ash-200/30 dark:bg-ash-800/15 float-slow pointer-events-none -z-10"
      />

      {/* ─── Editorial masthead ─── */}
      <div className="flex items-baseline justify-between mb-2 pb-3 border-b border-baltic-800/15 dark:border-baltic-200/15">
        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-baltic-700 dark:text-baltic-300">
          Today&apos;s Brief
        </p>
        <p className="text-[10px] font-mono uppercase tracking-wider text-steel-400">
          {getWeekday()} · {getFormattedDate()}
        </p>
      </div>

      {/* ─── 01 — The aim (asymmetric hero) ─── */}
      <section className="relative mb-14 mt-6">
        <SectionLabel num="01" title="The aim" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left: greeting + intention */}
          <div className="lg:col-span-7">
            <h1 className="text-5xl lg:text-6xl font-bold tracking-tight text-baltic-800 dark:text-baltic-100 leading-[1.05]">
              {getGreeting()},
              <br />
              <span className="italic font-light text-baltic-600 dark:text-baltic-300">
                {firstName}.
              </span>
            </h1>
            <p className="mt-5 text-base text-steel-500 dark:text-steel-400 italic max-w-md leading-relaxed">
              &ldquo;{intention}&rdquo;
            </p>

            {/* Quick action chips */}
            <div className="mt-6 flex items-center gap-2 flex-wrap">
              <button
                onClick={() => router.push("/focus")}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-baltic-700 dark:bg-baltic-500 text-white text-sm font-semibold hover:bg-baltic-800 dark:hover:bg-baltic-400 transition-colors shadow-sm"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-cream-300 animate-pulse" />
                Begin a focus session
              </button>
              <button
                onClick={() => router.push("/tasks")}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-baltic-200 dark:border-baltic-700 text-baltic-700 dark:text-baltic-300 text-sm font-semibold hover:bg-baltic-50 dark:hover:bg-baltic-900/40 transition-colors"
              >
                Plan tasks
              </button>
            </div>
          </div>

          {/* Right: target ring */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="relative">
              {/* Soft halo behind ring */}
              <div className="absolute inset-0 -m-6 rounded-full bg-baltic-100/40 dark:bg-baltic-800/30 blur-2xl" />

              <svg
                viewBox="0 0 140 140"
                className="relative w-56 h-56 lg:w-64 lg:h-64"
              >
                {/* Outer ring (track) */}
                <circle
                  cx="70"
                  cy="70"
                  r={ringRadius}
                  stroke="currentColor"
                  className="text-lavender-200 dark:text-lavender-800"
                  strokeWidth="3"
                  fill="none"
                />
                {/* Inner concentric — like an actual target */}
                <circle
                  cx="70"
                  cy="70"
                  r={ringRadius - 10}
                  stroke="currentColor"
                  className="text-lavender-200/60 dark:text-lavender-800/60"
                  strokeWidth="1"
                  fill="none"
                />
                <circle
                  cx="70"
                  cy="70"
                  r={ringRadius - 20}
                  stroke="currentColor"
                  className="text-lavender-200/40 dark:text-lavender-800/40"
                  strokeWidth="1"
                  fill="none"
                />
                {/* Bullseye */}
                <circle
                  cx="70"
                  cy="70"
                  r="3"
                  className="fill-baltic-700 dark:fill-baltic-300"
                />
                {/* Progress arc */}
                <circle
                  cx="70"
                  cy="70"
                  r={ringRadius}
                  stroke="currentColor"
                  className="text-baltic-600 dark:text-baltic-400"
                  strokeWidth="6"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={ringCircumference}
                  strokeDashoffset={ringOffset}
                  transform="rotate(-90 70 70)"
                  style={{ transition: "stroke-dashoffset 1s ease-out" }}
                />

                {/* Center text */}
                <text
                  x="70"
                  y="64"
                  textAnchor="middle"
                  className="fill-baltic-800 dark:fill-baltic-100"
                  style={{ fontSize: "22px", fontWeight: 700 }}
                >
                  {formatTime(todayMinutes)}
                </text>
                <text
                  x="70"
                  y="82"
                  textAnchor="middle"
                  className="fill-steel-400"
                  style={{ fontSize: "9px", letterSpacing: "1.5px", textTransform: "uppercase" }}
                >
                  of {formatTime(dailyGoal)}
                </text>
                <text
                  x="70"
                  y="96"
                  textAnchor="middle"
                  className="fill-baltic-500 dark:fill-baltic-400"
                  style={{ fontSize: "10px", fontWeight: 600 }}
                >
                  {focusPct}% to goal
                </text>
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 02 — By the numbers (editorial stat strip) ─── */}
      <section className="mb-14">
        <SectionLabel num="02" title="By the numbers" />

        <div className="grid grid-cols-2 sm:grid-cols-3 divide-x divide-baltic-800/10 dark:divide-baltic-200/10 border-y border-baltic-800/10 dark:border-baltic-200/10 py-6">
          <Stat
            label="Day streak"
            value={String(streak)}
            sub={streak === 1 ? "day in a row" : "days in a row"}
            accent="cream"
          />
          <Stat
            label="On your plate"
            value={String(pendingTasks.length)}
            sub={pendingTasks.length === 1 ? "task pending" : "tasks pending"}
            accent="ash"
          />
          <Stat
            label="This week"
            value={formatTime(weekMinutes)}
            sub="time invested"
            accent="baltic"
          />
        </div>
      </section>

      {/* ─── 03 — On the horizon (asymmetric: tasks + last entry) ─── */}
      <section className="mb-10">
        <SectionLabel num="03" title="On the horizon" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Tasks — wider */}
          <div className="lg:col-span-7">
            <div className="flex items-baseline justify-between mb-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-steel-500 dark:text-steel-400">
                What&apos;s next
              </p>
              <button
                onClick={() => router.push("/tasks")}
                className="text-xs text-baltic-600 hover:text-baltic-800 dark:text-baltic-400 dark:hover:text-baltic-200 font-semibold transition-smooth"
              >
                All tasks &rarr;
              </button>
            </div>

            {upcomingTasks.length > 0 ? (
              <ol className="space-y-1">
                {upcomingTasks.map((task, idx) => {
                  const subject = getSubject(task.subject);
                  const overdue = isOverdue(task.dueDate);
                  const color = subject?.color || "#60729f";
                  return (
                    <li
                      key={task.id}
                      className="group flex items-center gap-4 py-3 border-b border-dashed border-lavender-200 dark:border-lavender-800 hover:border-baltic-300 dark:hover:border-baltic-600 transition-colors"
                    >
                      {/* Numeral */}
                      <span className="text-[11px] font-mono font-bold text-steel-300 dark:text-steel-600 tabular-nums w-5">
                        {String(idx + 1).padStart(2, "0")}
                      </span>

                      {/* Check */}
                      <button
                        onClick={() => toggleComplete(task.id)}
                        className="w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-smooth hover:scale-110"
                        style={{ borderColor: color }}
                      >
                        <svg
                          width="9"
                          height="9"
                          viewBox="0 0 10 10"
                          fill="none"
                          stroke={color}
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <path d="M2 5l2.5 2.5L8 3" />
                        </svg>
                      </button>

                      {/* Title */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-baltic-800 dark:text-baltic-100 truncate">
                          {task.title}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span
                            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: color }}
                          />
                          <span className="text-[11px] text-steel-400 truncate">
                            {subject?.label || task.subject}
                          </span>
                        </div>
                      </div>

                      {/* Date chip */}
                      <span
                        className={cn(
                          "text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full border whitespace-nowrap",
                          overdue
                            ? "border-red-200 text-red-500 bg-red-50 dark:bg-red-900/20 dark:border-red-800"
                            : "border-lavender-200 dark:border-lavender-700 text-steel-500 dark:text-steel-400"
                        )}
                      >
                        {overdue ? "Overdue" : formatDate(task.dueDate)}
                      </span>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <div className="py-12 text-center border-y border-dashed border-lavender-200 dark:border-lavender-800">
                <p className="text-sm font-medium text-baltic-700 dark:text-baltic-300">
                  Nothing on the horizon.
                </p>
                <p className="text-xs text-steel-400 mt-1 italic">
                  A clear plate is a fine place to begin.
                </p>
              </div>
            )}
          </div>

          {/* Last entry — narrower, journal-style nod */}
          <div className="lg:col-span-5">
            <div className="flex items-baseline justify-between mb-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-steel-500 dark:text-steel-400">
                Latest entry
              </p>
              <button
                onClick={() => router.push("/journal")}
                className="text-xs text-baltic-600 hover:text-baltic-800 dark:text-baltic-400 dark:hover:text-baltic-200 font-semibold transition-smooth"
              >
                Journal &rarr;
              </button>
            </div>

            {lastSession ? (
              <LastEntryCard
                session={lastSession}
                subject={getSubject(lastSession.subject)}
              />
            ) : (
              <div className="py-12 text-center border border-dashed border-lavender-200 dark:border-lavender-800 rounded-2xl">
                <p className="text-sm font-medium text-baltic-700 dark:text-baltic-300">
                  No entries yet.
                </p>
                <p className="text-xs text-steel-400 mt-1 italic">
                  Your first session writes itself here.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

/* ─── Section label (editorial numbered header) ─── */
function SectionLabel({ num, title }: { num: string; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <span className="text-[10px] font-mono font-bold text-baltic-500 dark:text-baltic-400 tabular-nums">
        {num}
      </span>
      <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-baltic-800 dark:text-baltic-200">
        {title}
      </span>
      <div className="flex-1 h-px bg-baltic-800/15 dark:bg-baltic-200/15" />
    </div>
  );
}

/* ─── Editorial stat ─── */
function Stat({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  accent: "baltic" | "cream" | "ash";
}) {
  const accentColor = {
    baltic: "text-baltic-700 dark:text-baltic-200",
    cream: "text-cream-700 dark:text-cream-300",
    ash: "text-ash-700 dark:text-ash-300",
  }[accent];

  return (
    <div className="px-4 first:pl-0">
      <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-steel-400 mb-2">
        {label}
      </p>
      <p className={cn("text-3xl font-bold tracking-tight tabular-nums", accentColor)}>
        {value}
      </p>
      <p className="text-[11px] text-steel-400 mt-0.5 italic">{sub}</p>
    </div>
  );
}

/* ─── Last entry card (small journal-style nod) ─── */
function LastEntryCard({
  session,
  subject,
}: {
  session: { id: string; subject: string; duration: number; completedAt: string; reflection?: { quality: 1 | 2 | 3 | 4; note?: string } };
  subject: { label: string; color: string } | undefined;
}) {
  const color = subject?.color || "#60729f";
  const date = new Date(session.completedAt);
  const dateStr = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const timeStr = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className="relative rounded-xl bg-white dark:bg-lavender-900 border border-lavender-200 dark:border-lavender-800 p-5 pt-6 shadow-sm">
      {/* Tape strip — tying to journal aesthetic */}
      <div
        className="absolute -top-2 left-6 w-12 h-3.5 rounded-sm shadow-sm bg-cream-300/70 dark:bg-cream-600/50"
        style={{ clipPath: "polygon(5% 0, 95% 0, 100% 100%, 0 100%)" }}
      />

      {/* Date stamp */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-mono uppercase tracking-wider text-steel-400">
          {dateStr} · {timeStr}
        </p>
        {session.reflection && (
          <QualityIndicator quality={session.reflection.quality} size={12} />
        )}
      </div>

      {/* Subject + duration */}
      <div className="flex items-center gap-2 mb-1">
        <span
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: color }}
        />
        <span className="text-[11px] font-bold uppercase tracking-wider text-baltic-700 dark:text-baltic-300 truncate">
          {subject?.label || session.subject}
        </span>
      </div>
      <p className="text-3xl font-bold text-baltic-800 dark:text-baltic-100 tracking-tight leading-none">
        {formatTime(session.duration)}
      </p>

      {/* Note excerpt */}
      {session.reflection?.note && (
        <p className="mt-3 pt-3 border-t border-dashed border-lavender-200 dark:border-lavender-700 text-xs text-steel-500 dark:text-steel-400 italic leading-relaxed line-clamp-2">
          &ldquo;{session.reflection.note}&rdquo;
        </p>
      )}
    </div>
  );
}
