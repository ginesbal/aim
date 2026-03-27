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
import CalendarSidebar from "@/components/dashboard/CalendarSidebar";
import { useRouter } from "next/navigation";

// Circular progress ring
function FocusRing({
  minutes,
  goal,
}: {
  minutes: number;
  goal: number;
}) {
  const size = 96;
  const stroke = 6;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(minutes / goal, 1);
  const offset = circumference * (1 - progress);
  const pct = Math.min(Math.round(progress * 100), 100);

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-baltic-200 dark:text-baltic-700"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="text-baltic-500 dark:text-baltic-400 transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold text-baltic-700 dark:text-baltic-200 leading-none">
          {pct}%
        </span>
        {minutes > 0 && (
          <span className="text-[10px] text-steel-400 leading-none mt-1">
            {formatTime(minutes)}
          </span>
        )}
      </div>
    </div>
  );
}


export default function DashboardPage() {
  const { name, isFirstVisit, setName } = usePreferences();
  const { tasks, toggleComplete } = useTasks();
  const { todayMinutes, streak, sessions } = useFocus();
  const { getSubject } = useSubjects();
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

  const upcomingTasks = useMemo(() => {
    if (selectedDate) {
      return pendingTasks.filter((t) => t.dueDate === selectedDate);
    }
    return pendingTasks.slice(0, 4);
  }, [pendingTasks, selectedDate]);

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

  const subjectCards = useMemo(() => {
    const subjectMap: Record<
      string,
      { total: number; completed: number; label: string; color: string }
    > = {};

    for (const task of tasks) {
      const subKey = task.subject;
      if (!subjectMap[subKey]) {
        const sub = getSubject(subKey);
        subjectMap[subKey] = {
          total: 0,
          completed: 0,
          label: sub?.label || subKey,
          color: sub?.color || "#60729f",
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
  }, [tasks, getSubject]);

  function handleWelcomeSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!welcomeName.trim()) return;
    setName(welcomeName.trim());
    setShowWelcome(false);
  }

  return (
    <div className="flex gap-6">
      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Welcome modal */}
        <Modal
          open={showWelcome}
          onClose={() => {}}
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

        {/* Header card with focus ring + stats */}
        <div className="rounded-xl bg-white dark:bg-lavender-900 border border-lavender-200 dark:border-lavender-700 shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-baltic-800 dark:text-baltic-100">
                {getGreeting()}, {firstName}
              </h1>
              <p className="text-sm text-steel-400 mt-1">
                {getWeekday()}, {getFormattedDate()}
              </p>

              {/* Stats row */}
              <div className="flex items-center gap-6 mt-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-lg bg-cream-100 dark:bg-cream-900/30 flex items-center justify-center">
                    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-cream-600 dark:text-cream-400">
                      <path d="M10 2v3M10 15v3M4.93 4.93l2.12 2.12M12.95 12.95l2.12 2.12M2 10h3M15 10h3M4.93 15.07l2.12-2.12M12.95 7.05l2.12-2.12" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-3xl font-extrabold text-baltic-800 dark:text-baltic-100 leading-none tracking-tight">
                      {streak}
                    </p>
                    <p className="text-xs font-medium text-steel-400 mt-0.5">
                      day streak
                    </p>
                  </div>
                </div>
                <div className="w-px h-10 bg-lavender-200 dark:bg-lavender-700" />
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-lg bg-ash-100 dark:bg-ash-900/30 flex items-center justify-center">
                    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-ash-600 dark:text-ash-400">
                      <rect x="3" y="4" width="14" height="14" rx="2" />
                      <path d="M7 9h6M7 13h4" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-3xl font-extrabold text-baltic-800 dark:text-baltic-100 leading-none tracking-tight">
                      {pendingTasks.length}
                    </p>
                    <p className="text-xs font-medium text-steel-400 mt-0.5">
                      task{pendingTasks.length !== 1 ? "s" : ""} left
                    </p>
                  </div>
                </div>
                <div className="w-px h-10 bg-lavender-200 dark:bg-lavender-700" />
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-lg bg-lavender-100 dark:bg-lavender-800/40 flex items-center justify-center">
                    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-lavender-500 dark:text-lavender-400">
                      <circle cx="10" cy="10" r="8" />
                      <path d="M10 6v4l2.5 2.5" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-3xl font-extrabold text-baltic-800 dark:text-baltic-100 leading-none tracking-tight">
                      {formatTime(todayMinutes)}
                    </p>
                    <p className="text-xs font-medium text-steel-400 mt-0.5">
                      focused today
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center">
              <FocusRing minutes={todayMinutes} goal={dailyGoal} />
              <p className="text-[11px] font-medium text-steel-400 mt-1.5">
                Daily focus
              </p>
            </div>
          </div>
        </div>

        {/* Subject progress */}
        {subjectCards.length > 0 && (
          <div className="mt-6 mb-2">
            <h2 className="text-title text-baltic-800 dark:text-baltic-100 mb-4">
              Subjects
            </h2>
            <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(subjectCards.length, 4)}, minmax(0, 1fr))` }}>
              {subjectCards.map((subject) => {
                const s = 44;
                const cx = s / 2;
                const outerR = s / 2 - 1;
                const innerR = 8;
                const progress = subject.progress / 100;

                // Build a filled arc path (like the "a" in the aim logo)
                // Full circle when 100%, arc + lines to center otherwise
                const startAngle = -Math.PI / 2;
                const endAngle = startAngle + 2 * Math.PI * Math.min(progress, 0.999);
                const largeArc = progress > 0.5 ? 1 : 0;
                const sx = cx + outerR * Math.cos(startAngle);
                const sy = cx + outerR * Math.sin(startAngle);
                const ex = cx + outerR * Math.cos(endAngle);
                const ey = cx + outerR * Math.sin(endAngle);

                const arcPath =
                  progress >= 1
                    ? `M${cx},${cx - outerR} A${outerR},${outerR} 0 1,1 ${cx - 0.01},${cx - outerR} A${outerR},${outerR} 0 0,1 ${cx},${cx - outerR}Z`
                    : `M${cx},${cx} L${sx},${sy} A${outerR},${outerR} 0 ${largeArc},1 ${ex},${ey} Z`;

                return (
                  <div
                    key={subject.key}
                    className="rounded-xl bg-white dark:bg-lavender-900 border border-lavender-200 dark:border-lavender-700 p-4 flex items-center gap-3"
                  >
                    {/* Filled arc with counter dot — aim logo style */}
                    <div className="flex-shrink-0" style={{ width: s, height: s }}>
                      <svg width={s} height={s}>
                        {/* Track circle */}
                        <circle
                          cx={cx}
                          cy={cx}
                          r={outerR}
                          className="fill-lavender-100 dark:fill-lavender-800"
                        />
                        {/* Filled progress arc */}
                        {progress > 0 && (
                          <path
                            d={arcPath}
                            fill={subject.color}
                            style={{ opacity: 0.8 }}
                            className="transition-all duration-500"
                          />
                        )}
                        {/* White counter dot (like the "a" in aim) */}
                        <circle
                          cx={cx}
                          cy={cx}
                          r={innerR}
                          className="fill-white dark:fill-lavender-900"
                        />
                      </svg>
                    </div>

                    {/* Label + count */}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-baltic-800 dark:text-baltic-100 truncate">
                        {subject.label}
                      </p>
                      <p className="text-xs text-steel-400">
                        {subject.completed}/{subject.total} done
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Up next — timeline-style task cards */}
        <div className="mt-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-title text-baltic-800 dark:text-baltic-100">
              {selectedDate ? `Tasks for ${formatDate(selectedDate)}` : "Up next"}
            </h2>
            <button
              onClick={() => router.push("/tasks")}
              className="text-xs text-baltic-500 hover:text-baltic-700 dark:hover:text-baltic-300 font-medium transition-smooth"
            >
              View all
            </button>
          </div>

          {upcomingTasks.length > 0 ? (
            <div className="relative">
              {/* Timeline connector line */}
              <div className="absolute left-[15px] top-4 bottom-4 w-px bg-lavender-200 dark:bg-lavender-700" />

              <div className="space-y-2">
                {upcomingTasks.map((task, i) => {
                  const subject = getSubject(task.subject);
                  const overdue = isOverdue(task.dueDate);
                  const color = subject?.color || "#60729f";
                  return (
                    <div
                      key={task.id}
                      className={cn(
                        "group relative flex items-start gap-4 rounded-xl p-3.5 pl-10 transition-smooth",
                        "bg-white dark:bg-lavender-900 border border-lavender-200 dark:border-lavender-700",
                        "hover:shadow-sm hover:border-lavender-300 dark:hover:border-lavender-600",
                        i === 0 && "ring-1 ring-baltic-200 dark:ring-baltic-700"
                      )}
                    >
                      {/* Timeline dot / check circle */}
                      <button
                        onClick={() => toggleComplete(task.id)}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center transition-smooth hover:scale-110 bg-white dark:bg-lavender-900"
                        style={{ borderColor: color }}
                        title="Mark complete"
                      >
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 12 12"
                          fill="none"
                          stroke={color}
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <path d="M2 6l3 3 5-5" />
                        </svg>
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={cn(
                            "text-sm font-semibold truncate",
                            i === 0
                              ? "text-baltic-800 dark:text-baltic-100"
                              : "text-baltic-700 dark:text-baltic-200"
                          )}>
                            {task.title}
                          </p>
                          {i === 0 && (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-baltic-500 bg-baltic-100 dark:bg-baltic-800 dark:text-baltic-400 px-1.5 py-0.5 rounded flex-shrink-0">
                              Next
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: color }}
                          />
                          <span className="text-xs text-steel-400 truncate">
                            {subject?.label || task.subject}
                          </span>
                          <span className="text-xs text-steel-300 dark:text-steel-600">
                            ·
                          </span>
                          <span
                            className={cn(
                              "text-xs",
                              overdue
                                ? "text-red-500 font-medium"
                                : "text-steel-400"
                            )}
                          >
                            {formatDate(task.dueDate)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-lavender-300 dark:border-lavender-600 py-10 text-center">
              <div className="flex justify-center mb-3">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-lavender-300 dark:text-lavender-600">
                  <circle cx="16" cy="16" r="12" />
                  <path d="M11 16l3 3 7-7" />
                </svg>
              </div>
              <p className="text-sm font-medium text-baltic-700 dark:text-baltic-300">
                {selectedDate ? "Nothing scheduled" : "All caught up!"}
              </p>
              <p className="text-xs text-steel-400 mt-0.5">
                {selectedDate
                  ? "Pick a date or add new tasks."
                  : "Enjoy the calm. You've earned it."}
              </p>
            </div>
          )}
        </div>

        {/* Recent sessions — compact strip */}
        {recentSessions.length > 0 && (
          <div className="mt-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-title text-baltic-800 dark:text-baltic-100">
                Recent sessions
              </h2>
              <button
                onClick={() => router.push("/journal")}
                className="text-xs text-baltic-500 hover:text-baltic-700 dark:hover:text-baltic-300 font-medium transition-smooth"
              >
                View all
              </button>
            </div>
            <div className="flex gap-3">
              {recentSessions.map((session) => {
                const sub = getSubject(session.subject);
                return (
                  <div
                    key={session.id}
                    className="flex-1 rounded-lg bg-white dark:bg-lavender-900 border border-lavender-200 dark:border-lavender-700 p-3"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
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
                    <p className="text-lg font-bold text-baltic-800 dark:text-baltic-100 leading-none">
                      {formatTime(session.duration)}
                    </p>
                    {session.reflection?.note && (
                      <p className="text-[11px] text-steel-400 mt-1 italic truncate">
                        &ldquo;{session.reflection.note}&rdquo;
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Calendar sidebar */}
      <CalendarSidebar
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
      />

      {/* Sticky focus bar */}
      <div className="fixed bottom-0 left-[220px] right-0 z-40 pointer-events-none">
        <div className="px-8 pb-4 pt-6 bg-gradient-to-t from-baltic-50 via-baltic-50/80 to-transparent dark:from-baltic-950 dark:via-baltic-950/80">
          <div className="max-w-xl pointer-events-auto">
            <button
              onClick={() => router.push("/focus")}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-baltic-600 hover:bg-baltic-700 dark:bg-baltic-500 dark:hover:bg-baltic-400 text-white text-sm font-semibold shadow-sm transition-smooth"
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="10" cy="10" r="8" />
                <path d="M10 5v5l3 3" />
              </svg>
              Start focus session
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
