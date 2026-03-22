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
import { SUBJECTS, type SubjectKey } from "@/lib/types";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import AimLogo from "@/components/layout/AimLogo";
import CalendarSidebar from "@/components/dashboard/CalendarSidebar";
import { useRouter } from "next/navigation";

// Soft card colors for subject cards
const CARD_COLORS = [
  { bg: "#e8f5e9", text: "#2e7d32" },
  { bg: "#e3f2fd", text: "#1565c0" },
  { bg: "#fff3e0", text: "#e65100" },
  { bg: "#f3e5f5", text: "#7b1fa2" },
  { bg: "#e0f2f1", text: "#00695c" },
  { bg: "#fce4ec", text: "#c62828" },
  { bg: "#fff8e1", text: "#f57f17" },
  { bg: "#e8eaf6", text: "#283593" },
];

export default function DashboardPage() {
  const { name, isFirstVisit, setName } = usePreferences();
  const { tasks, toggleComplete } = useTasks();
  const { todayMinutes, streak, sessions } = useFocus();
  const { subjects: userSubjects } = useSubjects();
  const router = useRouter();

  const [showWelcome, setShowWelcome] = useState(isFirstVisit);
  const [welcomeName, setWelcomeName] = useState("");

  const firstName = name ? name.split(" ")[0] : "there";
  const dailyGoal = 120;

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

  const todayTasks = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return tasks.filter((t) => {
      const due = t.dueDate;
      return due <= today && !t.completed;
    });
  }, [tasks]);

  const completedCount = useMemo(
    () => tasks.filter((t) => t.completed).length,
    [tasks]
  );

  // Subject card data: show subjects that have tasks
  const subjectCards = useMemo(() => {
    const subjectMap: Record<
      string,
      { total: number; completed: number; label: string; color: string }
    > = {};

    for (const task of tasks) {
      const subKey = task.subject;
      if (!subjectMap[subKey]) {
        const sub = SUBJECTS[subKey as SubjectKey];
        const userSub = userSubjects.find(
          (s) => s.id === subKey || s.label === subKey
        );
        subjectMap[subKey] = {
          total: 0,
          completed: 0,
          label: sub?.label || userSub?.label || subKey,
          color: sub?.color || userSub?.color || "#60729f",
        };
      }
      subjectMap[subKey].total++;
      if (task.completed) subjectMap[subKey].completed++;
    }

    return Object.entries(subjectMap)
      .filter(([, v]) => v.total > 0)
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 4)
      .map(([key, val], i) => ({
        key,
        ...val,
        cardColor: CARD_COLORS[i % CARD_COLORS.length],
        progress: Math.round((val.completed / val.total) * 100),
      }));
  }, [tasks, userSubjects]);

  function handleWelcomeSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (welcomeName.trim()) {
      setName(welcomeName.trim());
    }
    setShowWelcome(false);
  }

  return (
    <div className="flex gap-6">
      {/* Main content */}
      <div className="flex-1 min-w-0 space-y-6">
        {/* Welcome modal */}
        <Modal
          open={showWelcome}
          onClose={() => setShowWelcome(false)}
          width="sm"
        >
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

        {/* Header row */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-baltic-800 dark:text-baltic-100">
              Hello, {firstName}
            </h1>
            <p className="text-sm text-steel-400 mt-0.5">
              Today is {getWeekday()}, {getFormattedDate()}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="w-10 h-10 rounded-xl bg-white dark:bg-lavender-800 border border-lavender-100 dark:border-lavender-700 flex items-center justify-center hover:bg-lavender-50 dark:hover:bg-lavender-700 transition-smooth">
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-baltic-600 dark:text-baltic-300"
              >
                <circle cx="8" cy="8" r="5.5" />
                <path d="M12 12l4 4" />
              </svg>
            </button>
            <Button onClick={() => router.push("/focus")}>
              Start Focus Session
            </Button>
          </div>
        </div>

        {/* Subject cards */}
        {subjectCards.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            {subjectCards.map((subject) => (
              <div
                key={subject.key}
                className="rounded-xl p-5 relative overflow-hidden"
                style={{ backgroundColor: subject.cardColor.bg }}
              >
                <div className="flex items-center justify-between mb-8">
                  <div className="flex -space-x-2">
                    <div
                      className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold"
                      style={{
                        backgroundColor: subject.color,
                        color: "white",
                      }}
                    >
                      {subject.label.charAt(0)}
                    </div>
                  </div>
                  <button className="text-steel-400 hover:text-steel-600">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="currentColor"
                    >
                      <circle cx="7" cy="3" r="1.2" />
                      <circle cx="7" cy="7" r="1.2" />
                      <circle cx="7" cy="11" r="1.2" />
                    </svg>
                  </button>
                </div>
                <h3
                  className="text-base font-bold mb-3"
                  style={{ color: subject.cardColor.text }}
                >
                  {subject.label}
                </h3>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="text-xs font-medium"
                    style={{ color: subject.cardColor.text, opacity: 0.7 }}
                  >
                    {subject.total} tasks
                  </span>
                  <span
                    className="text-xs"
                    style={{ color: subject.cardColor.text, opacity: 0.5 }}
                  >
                    |
                  </span>
                  <span
                    className="text-xs font-medium"
                    style={{ color: subject.cardColor.text, opacity: 0.7 }}
                  >
                    {subject.progress}%
                  </span>
                </div>
                {/* Progress bar */}
                <div className="w-full h-1.5 rounded-full bg-white/50">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${subject.progress}%`,
                      backgroundColor: subject.cardColor.text,
                      opacity: 0.6,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bottom two columns: Tasks + Statistics */}
        <div className="grid grid-cols-2 gap-5">
          {/* Tasks for today */}
          <div className="bg-white dark:bg-lavender-900 rounded-xl border border-lavender-100 dark:border-lavender-800 p-5">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-baltic-800 dark:text-baltic-100">
                Tasks for today
              </h2>
              <button
                onClick={() => router.push("/tasks")}
                className="text-xs text-baltic-500 hover:text-baltic-700 dark:hover:text-baltic-300 font-medium transition-smooth"
              >
                View all
              </button>
            </div>

            {todayTasks.length > 0 ? (
              <div className="space-y-1">
                {todayTasks.slice(0, 4).map((task) => {
                  const subject = SUBJECTS[task.subject as SubjectKey];
                  return (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 py-3 border-l-2 pl-3 rounded-r-lg hover:bg-baltic-50/50 dark:hover:bg-baltic-900/30 transition-smooth"
                      style={{
                        borderLeftColor: subject?.color || "#60729f",
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-baltic-800 dark:text-baltic-100 truncate">
                          {task.title}
                        </p>
                        <p className="text-xs text-steel-400 truncate mt-0.5">
                          {task.description || subject?.label || task.subject}
                        </p>
                      </div>
                      <button
                        onClick={() => toggleComplete(task.id)}
                        className="w-5 h-5 rounded-full border-2 border-lavender-300 dark:border-lavender-600 flex-shrink-0 hover:border-baltic-400 transition-smooth flex items-center justify-center"
                      />
                    </div>
                  );
                })}
              </div>
            ) : pendingTasks.length > 0 ? (
              <div className="space-y-1">
                {pendingTasks.slice(0, 4).map((task) => {
                  const subject = SUBJECTS[task.subject as SubjectKey];
                  const overdue = isOverdue(task.dueDate);
                  return (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 py-3 border-l-2 pl-3 rounded-r-lg hover:bg-baltic-50/50 dark:hover:bg-baltic-900/30 transition-smooth"
                      style={{
                        borderLeftColor: subject?.color || "#60729f",
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-baltic-800 dark:text-baltic-100 truncate">
                          {task.title}
                        </p>
                        <p className="text-xs text-steel-400 truncate mt-0.5">
                          {subject?.label || task.subject}
                          <span className={cn("ml-2", overdue && "text-red-500")}>
                            {formatDate(task.dueDate)}
                          </span>
                        </p>
                      </div>
                      <button
                        onClick={() => toggleComplete(task.id)}
                        className="w-5 h-5 rounded-full border-2 border-lavender-300 dark:border-lavender-600 flex-shrink-0 hover:border-baltic-400 transition-smooth flex items-center justify-center"
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-steel-400 py-6 text-center">
                All caught up for today.
              </p>
            )}
          </div>

          {/* Statistics */}
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-baltic-800 dark:text-baltic-100">
              Statistics
            </h2>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white dark:bg-lavender-900 rounded-xl border border-lavender-100 dark:border-lavender-800 p-4 text-center">
                <p className="text-2xl font-bold text-baltic-700 dark:text-baltic-200">
                  {formatTime(todayMinutes)}
                </p>
                <p className="text-xs text-steel-400 mt-1">Focus today</p>
              </div>
              <div className="bg-white dark:bg-lavender-900 rounded-xl border border-lavender-100 dark:border-lavender-800 p-4 text-center">
                <p className="text-2xl font-bold text-baltic-700 dark:text-baltic-200">
                  {completedCount}
                </p>
                <p className="text-xs text-steel-400 mt-1">Finished tasks</p>
              </div>
              <div className="bg-white dark:bg-lavender-900 rounded-xl border border-lavender-100 dark:border-lavender-800 p-4 text-center">
                <p className="text-2xl font-bold text-baltic-700 dark:text-baltic-200">
                  {streak}
                </p>
                <p className="text-xs text-steel-400 mt-1">Day streak</p>
              </div>
            </div>

            {/* Focus goal progress */}
            <div className="bg-white dark:bg-lavender-900 rounded-xl border border-lavender-100 dark:border-lavender-800 p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold text-baltic-800 dark:text-baltic-100">
                    Daily Focus Goal
                  </p>
                  <p className="text-xs text-steel-400 mt-0.5">
                    {formatTime(todayMinutes)} of {formatTime(dailyGoal)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-baltic-700 dark:text-baltic-200">
                    {Math.min(Math.round((todayMinutes / dailyGoal) * 100), 100)}%
                  </p>
                </div>
              </div>
              <div className="w-full h-2 rounded-full bg-baltic-100 dark:bg-baltic-800">
                <div
                  className="h-full rounded-full bg-baltic-500 transition-all duration-700"
                  style={{
                    width: `${Math.min((todayMinutes / dailyGoal) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>

            {/* Quick action */}
            <div
              className="rounded-xl p-5 relative overflow-hidden"
              style={{
                background: "linear-gradient(135deg, #394460 0%, #262d40 100%)",
              }}
            >
              <p className="text-lg font-bold text-white">Start studying</p>
              <p className="text-sm text-baltic-300 mt-1 mb-3">
                Stay on track with focused sessions
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => router.push("/focus")}
                className="!bg-white !text-baltic-800 hover:!bg-baltic-50"
              >
                Begin session
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar sidebar */}
      <CalendarSidebar />
    </div>
  );
}
