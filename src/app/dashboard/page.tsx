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
    <div className="relative">
      {/* ─── Decorative blobs ─── */}
      <div className="absolute -top-12 -right-20 w-64 h-64 blob-1 bg-baltic-200/20 dark:bg-baltic-700/10 float-slow pointer-events-none" />
      <div className="absolute top-60 -left-24 w-40 h-40 blob-2 bg-cream-200/25 dark:bg-cream-800/10 float-medium pointer-events-none" />

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

      {/* ─── Hero greeting ─── */}
      <div className="relative mb-8">
        <p className="inline-block px-3 py-1 rounded-full bg-lavender-100 dark:bg-lavender-800/40 text-xs font-semibold text-steel-500 dark:text-steel-400 mb-3">
          {getWeekday()}, {getFormattedDate()}
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-baltic-800 dark:text-baltic-100">
          {getGreeting()}, {firstName}
        </h1>
      </div>

      {/* ─── Stats cards — 3 colored cards ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {/* Today's focus */}
        <div className="card-baltic rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-baltic-200/30 dark:bg-baltic-700/20" />
          <div className="absolute -bottom-6 -right-6 w-14 h-14 rounded-full bg-baltic-300/20 dark:bg-baltic-600/15" />
          <p className="text-xs font-semibold text-baltic-500 dark:text-baltic-400 uppercase tracking-wider mb-2">
            Today&apos;s focus
          </p>
          <p className="text-4xl font-bold text-baltic-700 dark:text-baltic-200 tracking-tight">
            {formatTime(todayMinutes)}
          </p>
          <div className="mt-3 h-2 rounded-full bg-baltic-200/60 dark:bg-baltic-700/40 overflow-hidden">
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
        <div className="card-cream rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute -top-3 -right-3 w-16 h-16 blob-2 bg-cream-300/30 dark:bg-cream-700/20" />
          <p className="text-xs font-semibold text-cream-600 dark:text-cream-400 uppercase tracking-wider mb-2">
            Study streak
          </p>
          <p className="text-4xl font-bold text-cream-700 dark:text-cream-200 tracking-tight">
            {streak}
          </p>
          <p className="text-sm text-cream-500 dark:text-cream-400 mt-1">
            day{streak !== 1 ? "s" : ""} in a row
          </p>
        </div>

        {/* Tasks remaining */}
        <div className="card-ash rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute -top-5 -right-5 w-18 h-18 blob-3 bg-ash-200/30 dark:bg-ash-700/15" />
          <p className="text-xs font-semibold text-ash-500 dark:text-ash-400 uppercase tracking-wider mb-2">
            Tasks remaining
          </p>
          <p className="text-4xl font-bold text-ash-700 dark:text-ash-200 tracking-tight">
            {pendingTasks.length}
          </p>
          <p className="text-sm text-ash-500 dark:text-ash-400 mt-1">
            task{pendingTasks.length !== 1 ? "s" : ""} to go
          </p>
        </div>
      </div>

      {/* ─── Two-column content ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Up next */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-title text-baltic-800 dark:text-baltic-100">
              Up next
            </h2>
            <button
              onClick={() => router.push("/tasks")}
              className="text-xs text-baltic-500 hover:text-baltic-700 dark:hover:text-baltic-300 font-medium transition-smooth"
            >
              View all &rarr;
            </button>
          </div>

          {upcomingTasks.length > 0 ? (
            <div className="space-y-3">
              {upcomingTasks.map((task) => {
                const subject = getSubject(task.subject);
                const overdue = isOverdue(task.dueDate);
                const color = subject?.color || "#60729f";
                return (
                  <div
                    key={task.id}
                    className="group flex items-center gap-4 rounded-2xl bg-white dark:bg-lavender-900 p-4 shadow-sm hover:shadow-md transition-all duration-200"
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
            <div className="rounded-2xl bg-white dark:bg-lavender-900 shadow-sm p-8 text-center">
              {/* Decorative circles */}
              <div className="flex justify-center gap-2 mb-4">
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
        </div>

        {/* Right: Recent sessions */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-title text-baltic-800 dark:text-baltic-100">
              Recent sessions
            </h2>
            <button
              onClick={() => router.push("/journal")}
              className="text-xs text-baltic-500 hover:text-baltic-700 dark:hover:text-baltic-300 font-medium transition-smooth"
            >
              View all &rarr;
            </button>
          </div>

          {recentSessions.length > 0 ? (
            <div className="space-y-3">
              {recentSessions.map((session) => {
                const sub = getSubject(session.subject);
                return (
                  <div
                    key={session.id}
                    className="rounded-2xl bg-white dark:bg-lavender-900 p-4 shadow-sm"
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
            <div className="rounded-2xl bg-white dark:bg-lavender-900 shadow-sm p-8 text-center">
              <div className="flex justify-center gap-2 mb-4">
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
        </div>
      </div>
    </div>
  );
}
