"use client";

import { useMemo, useState } from "react";
import { usePreferences, useTasks, useFocus } from "@/lib/contexts";
import { getGreeting, getWeekday, getFormattedDate, formatTime, formatDate, isOverdue } from "@/lib/utils";
import { SUBJECTS, PRIORITIES, type SubjectKey } from "@/lib/types";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import QualityIndicator from "@/components/ui/QualityIndicator";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const { name, isFirstVisit, setName } = usePreferences();
  const { tasks, toggleComplete } = useTasks();
  const { todayMinutes, weekMinutes, streak, sessions } = useFocus();
  const router = useRouter();

  const [showWelcome, setShowWelcome] = useState(isFirstVisit);
  const [welcomeName, setWelcomeName] = useState("");

  const firstName = name ? name.split(" ")[0] : "there";

  const pendingTasks = useMemo(
    () => tasks.filter((t) => !t.completed).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()),
    [tasks]
  );

  const upcomingTasks = pendingTasks.slice(0, 3);

  const dailyGoal = 120;

  // Recent reflections
  const recentReflections = useMemo(
    () => [...sessions]
      .filter((s) => s.reflection)
      .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
      .slice(0, 3),
    [sessions]
  );

  function handleWelcomeSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (welcomeName.trim()) {
      setName(welcomeName.trim());
    }
    setShowWelcome(false);
  }

  return (
    <div className="space-y-10">
      {/* Welcome overlay */}
      <Modal open={showWelcome} onClose={() => setShowWelcome(false)} width="sm">
        <div className="text-center py-4">
          <div className="w-14 h-14 rounded-2xl bg-baltic-500 flex items-center justify-center mx-auto mb-5">
            <svg width="28" height="28" viewBox="0 0 16 16" fill="none">
              <path d="M8 1L14 5v6l-6 4-6-4V5l6-4z" stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
              <circle cx="8" cy="8" r="2" fill="white" />
            </svg>
          </div>
          <h2 className="text-display text-baltic-800 dark:text-baltic-100 mb-2">
            Welcome to Meridian
          </h2>
          <p className="text-body text-steel-500 dark:text-steel-400 mb-6">
            A calm space to plan your studies and build focus habits.
          </p>
          <form onSubmit={handleWelcomeSubmit} className="space-y-4">
            <Input
              id="welcome-name"
              placeholder="What should we call you?"
              value={welcomeName}
              onChange={(e) => setWelcomeName(e.target.value)}
              autoFocus
              className="text-center"
            />
            <Button type="submit" className="w-full" size="lg">
              Get started
            </Button>
          </form>
        </div>
      </Modal>

      {/* Hero section */}
      <div className="relative">
        {/* Decorative circles */}
        <div className="absolute -top-4 right-12 w-20 h-20 rounded-full bg-cream-200/30 dark:bg-cream-800/10 animate-float" />
        <div className="absolute top-8 right-0 w-10 h-10 rounded-full bg-ash-200/40 dark:bg-ash-800/10 animate-float-delay" />
        <div className="absolute -top-2 right-36 w-6 h-6 rounded-full bg-baltic-200/40 dark:bg-baltic-800/10" />

        <div className="relative">
          <h1 className="text-display text-baltic-800 dark:text-baltic-100" style={{ fontSize: "2rem" }}>
            {getGreeting()}, {firstName}
          </h1>
          <div className="mt-2 inline-flex items-center gap-2 bg-white/60 dark:bg-lavender-900/40 rounded-full px-4 py-1.5">
            <div className="w-2 h-2 rounded-full bg-ash-400" />
            <span className="text-sm text-steel-500 dark:text-steel-400 font-medium">
              {getWeekday()}, {getFormattedDate()}
            </span>
          </div>
        </div>
      </div>

      {/* Stats — 3 colored cards */}
      <div className="grid grid-cols-3 gap-5">
        <Card color="baltic" padding="lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-baltic-600/70 dark:text-baltic-400/70 uppercase tracking-wider">
                Today&apos;s focus
              </p>
              <p className="text-stat text-baltic-700 dark:text-baltic-200 mt-1">
                {formatTime(todayMinutes)}
              </p>
              <p className="text-xs text-baltic-500/70 dark:text-baltic-400/50 mt-1">
                of {formatTime(dailyGoal)} goal
              </p>
            </div>
            {/* Decorative ring */}
            <div className="w-12 h-12 rounded-full border-4 border-baltic-200/60 dark:border-baltic-700/40 flex items-center justify-center">
              <div className="w-5 h-5 rounded-full bg-baltic-400/40 dark:bg-baltic-600/40" />
            </div>
          </div>
        </Card>

        <Card color="cream" padding="lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-cream-700/70 dark:text-cream-400/70 uppercase tracking-wider">
                Study streak
              </p>
              <p className="text-stat text-cream-800 dark:text-cream-200 mt-1">
                {streak} day{streak !== 1 ? "s" : ""}
              </p>
              <p className="text-xs text-cream-600/70 dark:text-cream-400/50 mt-1">
                {streak > 0 ? "Keep it going" : "Start today"}
              </p>
            </div>
            <div className="flex flex-col gap-1.5 items-end">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="w-3 h-3 rounded-full bg-cream-300/60 dark:bg-cream-700/30" />
              ))}
            </div>
          </div>
        </Card>

        <Card color="ash" padding="lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-ash-600/70 dark:text-ash-400/70 uppercase tracking-wider">
                Tasks remaining
              </p>
              <p className="text-stat text-ash-700 dark:text-ash-200 mt-1">
                {pendingTasks.length}
              </p>
              <p className="text-xs text-ash-500/70 dark:text-ash-400/50 mt-1">
                of {tasks.length} total
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-ash-200/40 dark:bg-ash-800/30 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-ash-500/60">
                <path d="M3 5h14M3 10h14M3 15h9" />
              </svg>
            </div>
          </div>
        </Card>
      </div>

      {/* Two-column content */}
      <div className="grid grid-cols-2 gap-6">
        {/* Up next — tasks */}
        <Card padding="lg">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-title text-baltic-800 dark:text-baltic-100">Up next</h2>
            <button
              onClick={() => router.push("/tasks")}
              className="text-sm text-baltic-500 hover:text-baltic-700 dark:hover:text-baltic-300 font-semibold transition-smooth"
            >
              View all →
            </button>
          </div>

          {upcomingTasks.length > 0 ? (
            <div className="space-y-3">
              {upcomingTasks.map((task) => {
                const subject = SUBJECTS[task.subject as keyof typeof SUBJECTS];
                const overdue = isOverdue(task.dueDate);
                return (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-lavender-50/50 dark:bg-lavender-900/30 group"
                  >
                    <button
                      onClick={() => toggleComplete(task.id)}
                      className="w-5 h-5 rounded-full border-2 border-lavender-300 dark:border-lavender-600 flex-shrink-0 hover:border-baltic-400 transition-smooth flex items-center justify-center"
                    >
                      <span className="w-2 h-2 rounded-full bg-transparent group-hover:bg-baltic-400/30 transition-smooth" />
                    </button>
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: subject?.color || "#60729f" }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-baltic-800 dark:text-baltic-100 truncate">
                        {task.title}
                      </p>
                    </div>
                    <span className={`text-xs font-medium ${overdue ? "text-red-500" : "text-steel-400"}`}>
                      {formatDate(task.dueDate)}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-sm text-steel-400">All caught up. Nice work.</p>
            </div>
          )}
        </Card>

        {/* Recent sessions */}
        <Card padding="lg">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-title text-baltic-800 dark:text-baltic-100">Recent sessions</h2>
            {recentReflections.length > 0 && (
              <button
                onClick={() => router.push("/journal")}
                className="text-sm text-baltic-500 hover:text-baltic-700 dark:hover:text-baltic-300 font-semibold transition-smooth"
              >
                View all →
              </button>
            )}
          </div>

          {recentReflections.length > 0 ? (
            <div className="space-y-3">
              {recentReflections.map((session) => {
                const sub = SUBJECTS[session.subject as SubjectKey];
                return (
                  <div key={session.id} className="flex items-start gap-3 p-3 rounded-xl bg-lavender-50/50 dark:bg-lavender-900/30">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0 mt-1"
                      style={{ backgroundColor: sub?.color || "#60729f" }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-baltic-700 dark:text-baltic-300">
                          {sub?.label || session.subject}
                        </span>
                        <span className="text-xs text-steel-400">{formatTime(session.duration)}</span>
                        {session.reflection && (
                          <QualityIndicator quality={session.reflection.quality} size={14} />
                        )}
                      </div>
                      {session.reflection?.note && (
                        <p className="text-xs text-steel-400 mt-0.5 italic truncate">
                          &ldquo;{session.reflection.note}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center">
              <div className="flex justify-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full bg-lavender-200/60" />
                <div className="w-3 h-3 rounded-full bg-baltic-200/60" />
                <div className="w-3 h-3 rounded-full bg-cream-200/60" />
              </div>
              <p className="text-sm text-steel-400">
                Complete a focus session to see your reflections here.
              </p>
              <Button
                variant="pill"
                size="sm"
                className="mt-3"
                onClick={() => router.push("/focus")}
              >
                Start a session
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
