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
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import QualityIndicator from "@/components/ui/QualityIndicator";
import AimLogo from "@/components/layout/AimLogo";
import CalendarSidebar from "@/components/dashboard/CalendarSidebar";
import { useRouter } from "next/navigation";

// Collapsible section wrapper
function Section({
  title,
  action,
  collapsible = false,
  defaultOpen = true,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {collapsible && (
            <button
              onClick={() => setOpen(!open)}
              className="text-steel-400 hover:text-baltic-600 dark:hover:text-baltic-300 transition-smooth"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={cn(
                  "transition-transform duration-200",
                  open ? "rotate-90" : "rotate-0"
                )}
              >
                <path d="M5 3l4 4-4 4" />
              </svg>
            </button>
          )}
          <h2 className="text-title text-baltic-800 dark:text-baltic-100">
            {title}
          </h2>
        </div>
        {action}
      </div>
      {open && children}
    </div>
  );
}

export default function DashboardPage() {
  const { name, isFirstVisit, setName } = usePreferences();
  const { tasks, toggleComplete } = useTasks();
  const { todayMinutes, streak, sessions } = useFocus();
  const { subjects: userSubjects } = useSubjects();
  const router = useRouter();

  const [showWelcome, setShowWelcome] = useState(isFirstVisit);
  const [welcomeName, setWelcomeName] = useState("");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

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

  // When a date is selected in the calendar, filter to that date; otherwise show all upcoming
  const upcomingTasks = useMemo(() => {
    if (selectedDate) {
      return pendingTasks.filter((t) => t.dueDate === selectedDate);
    }
    return pendingTasks.slice(0, 4);
  }, [pendingTasks, selectedDate]);

  const recentReflections = useMemo(
    () =>
      [...sessions]
        .filter((s) => s.reflection)
        .sort(
          (a, b) =>
            new Date(b.completedAt).getTime() -
            new Date(a.completedAt).getTime()
        )
        .slice(0, 3),
    [sessions]
  );

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
      .map(([key, val]) => ({
        key,
        ...val,
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
      <div className="flex-1 min-w-0">
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

        {/* Header */}
        <div className="pb-6">
          <h1 className="text-display text-baltic-800 dark:text-baltic-100">
            {getGreeting()}, {firstName}
          </h1>
          <p className="text-sm text-steel-400 mt-1">
            {getWeekday()}, {getFormattedDate()}
          </p>
        </div>

        {/* Divider */}
        <div className="border-t border-lavender-100 dark:border-lavender-800" />

        {/* Stats row */}
        <div className="py-6">
          <div className="grid grid-cols-3 gap-4">
            <Card color="lavender" padding="md">
              <p className="text-label text-lavender-500 dark:text-lavender-400">
                Today&apos;s focus
              </p>
              <p className="text-stat text-baltic-700 dark:text-baltic-200 mt-1">
                {formatTime(todayMinutes)}
              </p>
              <p className="text-xs text-steel-400 mt-1">
                of {formatTime(dailyGoal)} goal
              </p>
            </Card>

            <Card color="cream" padding="md">
              <p className="text-label text-cream-600 dark:text-cream-400">
                Study streak
              </p>
              <p className="text-stat text-cream-800 dark:text-cream-200 mt-1">
                {streak} day{streak !== 1 ? "s" : ""}
              </p>
              <p className="text-xs text-steel-400 mt-1">
                {streak > 0 ? "Keep it going" : "Start today"}
              </p>
            </Card>

            <Card color="ash" padding="md">
              <p className="text-label text-ash-500 dark:text-ash-400">
                Tasks remaining
              </p>
              <p className="text-stat text-ash-700 dark:text-ash-200 mt-1">
                {pendingTasks.length}
              </p>
              <p className="text-xs text-steel-400 mt-1">
                of {tasks.length} total
              </p>
            </Card>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-lavender-100 dark:border-lavender-800" />

        {/* Subject progress — collapsible */}
        {subjectCards.length > 0 && (
          <div className="py-6">
            <Section title="Subject progress" collapsible defaultOpen>
              <div className="grid grid-cols-4 gap-3">
                {subjectCards.map((subject) => (
                  <div
                    key={subject.key}
                    className="rounded-xl p-4 bg-white dark:bg-lavender-900 border border-lavender-100 dark:border-lavender-800"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: subject.color }}
                      />
                      <p className="text-sm font-semibold text-baltic-800 dark:text-baltic-100 truncate">
                        {subject.label}
                      </p>
                    </div>
                    <div className="flex items-baseline gap-1.5 mb-2">
                      <span className="text-lg font-bold text-baltic-700 dark:text-baltic-200">
                        {subject.progress}%
                      </span>
                      <span className="text-xs text-steel-400">
                        {subject.completed}/{subject.total}
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-baltic-100 dark:bg-baltic-800">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${subject.progress}%`,
                          backgroundColor: subject.color,
                          opacity: 0.7,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-lavender-100 dark:border-lavender-800" />

        {/* Two columns: Tasks + Recent sessions */}
        <div className="py-6 grid grid-cols-2 gap-5">
          {/* Up next */}
          <Section
            title={selectedDate ? `Tasks for ${formatDate(selectedDate)}` : "Up next"}
            action={
              <button
                onClick={() => router.push("/tasks")}
                className="text-xs text-baltic-500 hover:text-baltic-700 dark:hover:text-baltic-300 font-medium transition-smooth"
              >
                View all
              </button>
            }
          >
            {upcomingTasks.length > 0 ? (
              <div className="space-y-1">
                {upcomingTasks.map((task) => {
                  const subject = SUBJECTS[task.subject as SubjectKey];
                  const overdue = isOverdue(task.dueDate);
                  return (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 py-2.5 border-l-2 pl-3 rounded-r-lg hover:bg-baltic-50/50 dark:hover:bg-baltic-900/30 transition-smooth"
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
                          <span
                            className={cn("ml-2", overdue && "text-red-500")}
                          >
                            {formatDate(task.dueDate)}
                          </span>
                        </p>
                      </div>
                      <button
                        onClick={() => toggleComplete(task.id)}
                        className="w-4 h-4 rounded border border-lavender-300 dark:border-lavender-600 flex-shrink-0 hover:border-baltic-400 transition-smooth"
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-steel-400 py-6 text-center">
                {selectedDate ? "No tasks for this date." : "All caught up."}
              </p>
            )}
          </Section>

          {/* Recent sessions — collapsible */}
          <Section
            title="Recent sessions"
            collapsible
            action={
              recentReflections.length > 0 ? (
                <button
                  onClick={() => router.push("/journal")}
                  className="text-xs text-baltic-500 hover:text-baltic-700 dark:hover:text-baltic-300 font-medium transition-smooth"
                >
                  View all
                </button>
              ) : undefined
            }
          >
            {recentReflections.length > 0 ? (
              <div className="space-y-1">
                {recentReflections.map((session) => {
                  const sub = SUBJECTS[session.subject as SubjectKey];
                  return (
                    <div
                      key={session.id}
                      className="flex items-start gap-3 py-2.5 border-l-2 pl-3 rounded-r-lg hover:bg-baltic-50/50 dark:hover:bg-baltic-900/30 transition-smooth"
                      style={{
                        borderLeftColor: sub?.color || "#60729f",
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-baltic-700 dark:text-baltic-300">
                            {sub?.label || session.subject}
                          </span>
                          <span className="text-xs text-steel-400">
                            {formatTime(session.duration)}
                          </span>
                          {session.reflection && (
                            <QualityIndicator
                              quality={session.reflection.quality}
                              size={14}
                            />
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
          </Section>
        </div>
      </div>

      {/* Calendar sidebar — full height */}
      <CalendarSidebar
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
      />

      {/* Floating focus button */}
      <button
        onClick={() => router.push("/focus")}
        className="fixed bottom-8 right-8 w-14 h-14 rounded-full bg-baltic-600 hover:bg-baltic-700 dark:bg-baltic-500 dark:hover:bg-baltic-400 text-white shadow-lg hover:shadow-xl transition-smooth flex items-center justify-center z-50"
        title="Start Focus Session"
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 22 22"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polygon points="6,3 20,11 6,19" fill="currentColor" stroke="none" />
        </svg>
      </button>
    </div>
  );
}
