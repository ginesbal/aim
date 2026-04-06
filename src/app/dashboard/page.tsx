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

  const upcomingTasks = useMemo(() => pendingTasks.slice(0, 3), [pendingTasks]);

  const recentSessions = useMemo(
    () =>
      [...sessions]
        .sort(
          (a, b) =>
            new Date(b.completedAt).getTime() -
            new Date(a.completedAt).getTime()
        )
        .slice(0, 3),
    [sessions]
  );

  const focusPct = Math.min(Math.round((todayMinutes / dailyGoal) * 100), 100);

  function handleWelcomeSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!welcomeName.trim()) return;
    setName(welcomeName.trim());
    setShowWelcome(false);
  }

  return (
    <div className="relative space-y-10">
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

      {/* ─── SECTION 1: Hero greeting ─── */}
      <section className="rounded-3xl border-2 border-lavender-200 dark:border-lavender-800 bg-white dark:bg-lavender-900 px-8 py-8 shadow-sm">
        <p className="inline-block px-3 py-1 rounded-full bg-lavender-100 dark:bg-lavender-800/60 text-xs font-semibold text-steel-500 dark:text-steel-300 mb-3">
          {getWeekday()}, {getFormattedDate()}
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-baltic-800 dark:text-baltic-100">
          {getGreeting()}, {firstName}
        </h1>
        <p className="text-sm text-steel-500 dark:text-steel-400 mt-2">
          Here&apos;s where things stand today.
        </p>
      </section>

      {/* ─── SECTION 2: Stats ─── */}
      <section>
        <div className="flex items-center gap-3 mb-4 px-1">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-baltic-600 dark:text-baltic-300">
            At a glance
          </h2>
          <div className="flex-1 h-px bg-lavender-200 dark:bg-lavender-800" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Today's focus */}
          <div className="rounded-2xl border-2 border-baltic-200 dark:border-baltic-700/60 bg-baltic-50 dark:bg-baltic-900/30 p-6">
            <p className="text-[11px] font-bold text-baltic-500 dark:text-baltic-400 uppercase tracking-wider mb-2">
              Today&apos;s focus
            </p>
            <p className="text-4xl font-bold text-baltic-700 dark:text-baltic-200 tracking-tight">
              {formatTime(todayMinutes)}
            </p>
            <div className="mt-3 h-2 rounded-full bg-baltic-200/70 dark:bg-baltic-700/40 overflow-hidden">
              <div
                className="h-full rounded-full bg-baltic-500 dark:bg-baltic-400 transition-all duration-700"
                style={{ width: `${focusPct}%` }}
              />
            </div>
            <p className="text-[10px] text-baltic-400 dark:text-baltic-500 mt-1.5">
              {focusPct}% of {formatTime(dailyGoal)} goal
            </p>
          </div>

          {/* Study streak */}
          <div className="rounded-2xl border-2 border-cream-200 dark:border-cream-700/60 bg-cream-50 dark:bg-cream-900/30 p-6">
            <p className="text-[11px] font-bold text-cream-600 dark:text-cream-400 uppercase tracking-wider mb-2">
              Study streak
            </p>
            <p className="text-4xl font-bold text-cream-700 dark:text-cream-200 tracking-tight">
              {streak}
            </p>
            <p className="text-sm text-cream-600/70 dark:text-cream-400 mt-1">
              day{streak !== 1 ? "s" : ""} in a row
            </p>
          </div>

          {/* Tasks remaining */}
          <div className="rounded-2xl border-2 border-ash-200 dark:border-ash-700/60 bg-ash-50 dark:bg-ash-900/30 p-6">
            <p className="text-[11px] font-bold text-ash-600 dark:text-ash-400 uppercase tracking-wider mb-2">
              Tasks remaining
            </p>
            <p className="text-4xl font-bold text-ash-700 dark:text-ash-200 tracking-tight">
              {pendingTasks.length}
            </p>
            <p className="text-sm text-ash-600/70 dark:text-ash-400 mt-1">
              task{pendingTasks.length !== 1 ? "s" : ""} to go
            </p>
          </div>
        </div>
      </section>

      {/* ─── SECTION 3: Up next ─── */}
      <section className="rounded-3xl border-2 border-lavender-200 dark:border-lavender-800 bg-white dark:bg-lavender-900 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <span className="w-1.5 h-6 rounded-full bg-baltic-500 dark:bg-baltic-400" />
            <h2 className="text-lg font-bold text-baltic-800 dark:text-baltic-100">
              Up next
            </h2>
          </div>
          <button
            onClick={() => router.push("/tasks")}
            className="text-xs text-baltic-500 hover:text-baltic-700 dark:hover:text-baltic-300 font-semibold transition-smooth"
          >
            View all &rarr;
          </button>
        </div>

        {upcomingTasks.length > 0 ? (
          <div className="space-y-2">
            {upcomingTasks.map((task) => {
              const subject = getSubject(task.subject);
              const overdue = isOverdue(task.dueDate);
              const color = subject?.color || "#60729f";
              return (
                <div
                  key={task.id}
                  className="group flex items-center gap-4 rounded-xl border border-lavender-100 dark:border-lavender-800 bg-white dark:bg-lavender-900/60 p-3.5 hover:border-lavender-300 dark:hover:border-lavender-700 hover:shadow-sm transition-all duration-150"
                >
                  <button
                    onClick={() => toggleComplete(task.id)}
                    className="w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-smooth hover:scale-110"
                    style={{ borderColor: color }}
                  >
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 10 10"
                      fill="none"
                      stroke={color}
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <path d="M2 5l2.5 2.5L8 3" />
                    </svg>
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-baltic-800 dark:text-baltic-100 truncate">
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-xs text-steel-400 truncate">
                        {subject?.label || task.subject}
                      </span>
                      <span className="text-xs text-steel-300 dark:text-steel-600">·</span>
                      <span className={cn("text-xs", overdue ? "text-red-500 font-medium" : "text-steel-400")}>
                        {formatDate(task.dueDate)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-lavender-200 dark:border-lavender-800 py-10 text-center">
            <div className="flex justify-center gap-2 mb-3">
              <div className="w-4 h-4 rounded-full bg-baltic-200/60 dark:bg-baltic-700/30" />
              <div className="w-6 h-6 rounded-full bg-ash-200/60 dark:bg-ash-700/30 -mt-1" />
              <div className="w-3 h-3 rounded-full bg-cream-200/60 dark:bg-cream-700/30 mt-1" />
            </div>
            <p className="text-sm font-medium text-baltic-700 dark:text-baltic-300">
              All caught up!
            </p>
            <p className="text-xs text-steel-400 mt-0.5">
              Enjoy the calm. You&apos;ve earned it.
            </p>
          </div>
        )}
      </section>

      {/* ─── SECTION 4: Recent sessions ─── */}
      <section className="rounded-3xl border-2 border-lavender-200 dark:border-lavender-800 bg-white dark:bg-lavender-900 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <span className="w-1.5 h-6 rounded-full bg-cream-500" />
            <h2 className="text-lg font-bold text-baltic-800 dark:text-baltic-100">
              Recent sessions
            </h2>
          </div>
          <button
            onClick={() => router.push("/journal")}
            className="text-xs text-baltic-500 hover:text-baltic-700 dark:hover:text-baltic-300 font-semibold transition-smooth"
          >
            View all &rarr;
          </button>
        </div>

        {recentSessions.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {recentSessions.map((session) => {
              const sub = getSubject(session.subject);
              return (
                <div
                  key={session.id}
                  className="rounded-xl border border-lavender-100 dark:border-lavender-800 bg-white dark:bg-lavender-900/60 p-4 hover:border-lavender-300 dark:hover:border-lavender-700 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: sub?.color || "#60729f" }}
                    />
                    <span className="text-xs font-semibold text-baltic-700 dark:text-baltic-300 truncate">
                      {sub?.label || session.subject}
                    </span>
                    {session.reflection && (
                      <QualityIndicator
                        quality={session.reflection.quality}
                        size={12}
                      />
                    )}
                  </div>
                  <p className="text-xl font-bold text-baltic-800 dark:text-baltic-100 leading-none">
                    {formatTime(session.duration)}
                  </p>
                  {session.reflection?.note && (
                    <p className="text-[11px] text-steel-400 mt-1.5 italic truncate">
                      &ldquo;{session.reflection.note}&rdquo;
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-lavender-200 dark:border-lavender-800 py-10 text-center">
            <div className="flex justify-center gap-2 mb-3">
              <div className="w-5 h-5 rounded-full bg-lavender-200/60 dark:bg-lavender-700/30" />
              <div className="w-3 h-3 rounded-full bg-baltic-200/60 dark:bg-baltic-700/30 mt-2" />
            </div>
            <p className="text-sm font-medium text-baltic-700 dark:text-baltic-300">
              No sessions yet
            </p>
            <p className="text-xs text-steel-400 mt-0.5">
              Start a focus session to see your progress here.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
