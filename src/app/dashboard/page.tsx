"use client";

import { useMemo, useState } from "react";
import { usePreferences, useTasks, useFocus } from "@/lib/contexts";
import { getGreeting, getWeekday, getFormattedDate, formatTime, formatDate, isOverdue } from "@/lib/utils";
import { SUBJECTS, type SubjectKey } from "@/lib/types";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import QualityIndicator from "@/components/ui/QualityIndicator";
import AimLogo from "@/components/layout/AimLogo";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const { name, isFirstVisit, setName } = usePreferences();
  const { tasks, toggleComplete } = useTasks();
  const { todayMinutes, streak, sessions } = useFocus();
  const router = useRouter();

  const [showWelcome, setShowWelcome] = useState(isFirstVisit);
  const [welcomeName, setWelcomeName] = useState("");

  const firstName = name ? name.split(" ")[0] : "there";
  const dailyGoal = 120;

  const pendingTasks = useMemo(
    () => tasks.filter((t) => !t.completed).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()),
    [tasks]
  );

  const upcomingTasks = pendingTasks.slice(0, 3);

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
    <div className="space-y-8">
      {/* Welcome modal */}
      <Modal open={showWelcome} onClose={() => setShowWelcome(false)} width="sm">
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

      {/* Header */}
      <div>
        <h1 className="text-display text-baltic-800 dark:text-baltic-100">
          {getGreeting()}, {firstName}
        </h1>
        <p className="text-sm text-steel-400 mt-1">
          {getWeekday()}, {getFormattedDate()}
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <Card color="baltic" padding="md">
          <p className="text-label text-baltic-500 dark:text-baltic-400">Today&apos;s focus</p>
          <p className="text-stat text-baltic-700 dark:text-baltic-200 mt-1">
            {formatTime(todayMinutes)}
          </p>
          <p className="text-xs text-steel-400 mt-1">of {formatTime(dailyGoal)} goal</p>
        </Card>

        <Card color="cream" padding="md">
          <p className="text-label text-cream-600 dark:text-cream-400">Study streak</p>
          <p className="text-stat text-cream-800 dark:text-cream-200 mt-1">
            {streak} day{streak !== 1 ? "s" : ""}
          </p>
          <p className="text-xs text-steel-400 mt-1">
            {streak > 0 ? "Keep it going" : "Start today"}
          </p>
        </Card>

        <Card color="ash" padding="md">
          <p className="text-label text-ash-500 dark:text-ash-400">Tasks remaining</p>
          <p className="text-stat text-ash-700 dark:text-ash-200 mt-1">
            {pendingTasks.length}
          </p>
          <p className="text-xs text-steel-400 mt-1">of {tasks.length} total</p>
        </Card>
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-2 gap-5">
        {/* Up next */}
        <Card padding="md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-title text-baltic-800 dark:text-baltic-100">Up next</h2>
            <button
              onClick={() => router.push("/tasks")}
              className="text-xs text-baltic-500 hover:text-baltic-700 dark:hover:text-baltic-300 font-medium transition-smooth"
            >
              View all
            </button>
          </div>

          {upcomingTasks.length > 0 ? (
            <div className="space-y-2">
              {upcomingTasks.map((task) => {
                const subject = SUBJECTS[task.subject as keyof typeof SUBJECTS];
                const overdue = isOverdue(task.dueDate);
                return (
                  <div key={task.id} className="flex items-center gap-3 py-2">
                    <button
                      onClick={() => toggleComplete(task.id)}
                      className="w-4 h-4 rounded border border-lavender-300 dark:border-lavender-600 flex-shrink-0 hover:border-baltic-400 transition-smooth"
                    />
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: subject?.color || "#60729f" }}
                    />
                    <p className="text-sm text-baltic-800 dark:text-baltic-100 truncate flex-1">
                      {task.title}
                    </p>
                    <span className={`text-xs ${overdue ? "text-red-500" : "text-steel-400"}`}>
                      {formatDate(task.dueDate)}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-steel-400 py-6 text-center">All caught up.</p>
          )}
        </Card>

        {/* Recent sessions */}
        <Card padding="md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-title text-baltic-800 dark:text-baltic-100">Recent sessions</h2>
            {recentReflections.length > 0 && (
              <button
                onClick={() => router.push("/journal")}
                className="text-xs text-baltic-500 hover:text-baltic-700 dark:hover:text-baltic-300 font-medium transition-smooth"
              >
                View all
              </button>
            )}
          </div>

          {recentReflections.length > 0 ? (
            <div className="space-y-2">
              {recentReflections.map((session) => {
                const sub = SUBJECTS[session.subject as SubjectKey];
                return (
                  <div key={session.id} className="flex items-start gap-3 py-2">
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
                      style={{ backgroundColor: sub?.color || "#60729f" }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-baltic-700 dark:text-baltic-300">
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
            <div className="py-6 text-center">
              <p className="text-sm text-steel-400">
                Complete a focus session to see reflections here.
              </p>
              <Button
                variant="secondary"
                size="sm"
                className="mt-2"
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
