"use client";

import { useMemo, useState } from "react";
import { useTasks, useFocus, useSubjects } from "@/lib/contexts";
import { cn, formatTime } from "@/lib/utils";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

// Timezone-safe date key: always uses local date, never UTC
function toDateKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatMonthYear(date: Date) {
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function formatSelectedDate(dateStr: string) {
  const date = new Date(dateStr + "T00:00:00");
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";

  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = firstDay.getDay();
  const totalDays = lastDay.getDate();

  const days: (Date | null)[] = [];

  for (let i = 0; i < startOffset; i++) {
    days.push(null);
  }

  for (let d = 1; d <= totalDays; d++) {
    days.push(new Date(year, month, d));
  }

  return days;
}

interface CalendarSidebarProps {
  selectedDate: string | null;
  onSelectDate: (date: string | null) => void;
}

export default function CalendarSidebar({
  selectedDate,
  onSelectDate,
}: CalendarSidebarProps) {
  const { tasks } = useTasks();
  const { sessions } = useFocus();
  const { getSubject } = useSubjects();

  const today = new Date();
  const todayKey = toDateKey(today);

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [calendarOpen, setCalendarOpen] = useState(true);

  // Dates that have pending tasks
  const taskDateSet = useMemo(() => {
    const set = new Set<string>();
    for (const t of tasks) {
      if (!t.completed) set.add(t.dueDate);
    }
    return set;
  }, [tasks]);

  // Dates that have focus sessions (timezone-safe)
  const sessionDateSet = useMemo(() => {
    const set = new Set<string>();
    for (const s of sessions) {
      set.add(toDateKey(new Date(s.completedAt)));
    }
    return set;
  }, [sessions]);

  // Tasks for the selected date
  const selectedDateTasks = useMemo(() => {
    if (!selectedDate) return [];
    return tasks
      .filter((t) => t.dueDate === selectedDate && !t.completed)
      .sort(
        (a, b) =>
          new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      );
  }, [tasks, selectedDate]);

  // Sessions for the selected date (timezone-safe)
  const selectedDateSessions = useMemo(() => {
    if (!selectedDate) return [];
    return sessions.filter(
      (s) => toDateKey(new Date(s.completedAt)) === selectedDate
    );
  }, [sessions, selectedDate]);

  const calendarDays = useMemo(
    () => getCalendarDays(viewYear, viewMonth),
    [viewYear, viewMonth]
  );

  function prevMonth() {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  function goToToday() {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    onSelectDate(todayKey);
  }

  function handleDayClick(date: Date) {
    const key = toDateKey(date);
    if (selectedDate === key) {
      onSelectDate(null);
    } else {
      onSelectDate(key);
    }
  }

  const hasDetail =
    selectedDateTasks.length > 0 || selectedDateSessions.length > 0;

  return (
    <aside className="w-[280px] flex-shrink-0 bg-white dark:bg-lavender-900 rounded-2xl p-6 border border-lavender-200 dark:border-lavender-700 shadow-sm self-stretch">
      {/* Calendar header with collapse toggle */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setCalendarOpen(!calendarOpen)}
          className="flex items-center gap-2 group"
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
              "text-steel-400 group-hover:text-baltic-600 dark:group-hover:text-baltic-300 transition-transform duration-200",
              calendarOpen ? "rotate-90" : "rotate-0"
            )}
          >
            <path d="M5 3l4 4-4 4" />
          </svg>
          <h2 className="text-title text-baltic-800 dark:text-baltic-100">
            Calendar
          </h2>
        </button>

        {calendarOpen && (
          <div className="flex items-center gap-1">
            <button
              onClick={prevMonth}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-steel-400 hover:text-baltic-600 hover:bg-baltic-50 dark:hover:bg-baltic-800 dark:hover:text-baltic-300 transition-smooth"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M7 2L3 6l4 4" />
              </svg>
            </button>
            <button
              onClick={goToToday}
              className="px-2 h-7 rounded-lg text-[10px] font-semibold text-steel-400 hover:text-baltic-600 hover:bg-baltic-50 dark:hover:bg-baltic-800 dark:hover:text-baltic-300 transition-smooth"
            >
              Today
            </button>
            <button
              onClick={nextMonth}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-steel-400 hover:text-baltic-600 hover:bg-baltic-50 dark:hover:bg-baltic-800 dark:hover:text-baltic-300 transition-smooth"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 2l4 4-4 4" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Collapsible calendar grid */}
      {calendarOpen && (
        <>
          {/* Month label */}
          <p className="text-xs font-semibold text-steel-400 mb-2">
            {formatMonthYear(new Date(viewYear, viewMonth))}
          </p>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 mb-1">
            {WEEKDAYS.map((d) => (
              <div
                key={d}
                className="text-[10px] font-semibold text-steel-400 text-center py-1"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-y-0.5">
            {calendarDays.map((day, i) => {
              if (!day) {
                return <div key={`empty-${i}`} />;
              }

              const key = toDateKey(day);
              const isToday = key === todayKey;
              const isSelected = key === selectedDate;
              const hasTasks = taskDateSet.has(key);
              const hasSessions = sessionDateSet.has(key);

              return (
                <button
                  key={key}
                  onClick={() => handleDayClick(day)}
                  aria-label={`${day.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}${hasTasks ? ", has tasks" : ""}${hasSessions ? ", has sessions" : ""}`}
                  className={cn(
                    "relative w-full aspect-square flex flex-col items-center justify-center rounded-lg text-xs transition-smooth",
                    isSelected
                      ? "bg-baltic-600 text-white dark:bg-baltic-500"
                      : isToday
                        ? "bg-baltic-100 text-baltic-700 dark:bg-baltic-800 dark:text-baltic-200 font-semibold"
                        : "text-baltic-700 dark:text-baltic-300 hover:bg-baltic-50 dark:hover:bg-baltic-800/50"
                  )}
                >
                  <span>{day.getDate()}</span>
                  {(hasTasks || hasSessions) && (
                    <div className="flex gap-0.5 mt-0.5">
                      {hasTasks && (
                        <div
                          className={cn(
                            "w-1 h-1 rounded-full",
                            isSelected
                              ? "bg-white/70"
                              : "bg-baltic-400 dark:bg-baltic-500"
                          )}
                        />
                      )}
                      {hasSessions && (
                        <div
                          className={cn(
                            "w-1 h-1 rounded-full",
                            isSelected
                              ? "bg-white/70"
                              : "bg-ash-400 dark:bg-ash-500"
                          )}
                        />
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Dot legend */}
      <div className="flex items-center gap-4 mt-3 mb-1">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-baltic-400 dark:bg-baltic-500" />
          <span className="text-[10px] text-steel-400">Tasks</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-ash-400 dark:bg-ash-500" />
          <span className="text-[10px] text-steel-400">Sessions</span>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-lavender-200 dark:border-lavender-700 mt-3 mb-4" />

      {/* Selected date detail */}
      {selectedDate ? (
        <div>
          <p className="text-xs font-bold text-baltic-700 dark:text-baltic-200 mb-3">
            {formatSelectedDate(selectedDate)}
          </p>

          {hasDetail ? (
            <div className="space-y-2">
              {selectedDateTasks.map((task) => {
                const subject = getSubject(task.subject);
                return (
                  <div key={task.id} className="flex items-start gap-2.5">
                    <div
                      className="w-0.5 rounded-full self-stretch flex-shrink-0 mt-0.5"
                      style={{
                        backgroundColor: subject?.color || "#60729f",
                      }}
                    />
                    <div className="min-w-0">
                      <p className="text-xs text-steel-500 dark:text-steel-400">
                        {subject?.label || task.subject}
                      </p>
                      <p className="text-sm font-medium text-baltic-800 dark:text-baltic-100 truncate">
                        {task.title}
                      </p>
                    </div>
                  </div>
                );
              })}

              {selectedDateSessions.length > 0 &&
                selectedDateTasks.length > 0 && (
                  <div className="border-t border-lavender-200 dark:border-lavender-700 my-2" />
                )}
              {selectedDateSessions.map((session) => {
                const sub = getSubject(session.subject);
                return (
                  <div key={session.id} className="flex items-start gap-2.5">
                    <div
                      className="w-0.5 rounded-full self-stretch flex-shrink-0 mt-0.5"
                      style={{
                        backgroundColor: sub?.color || "#60729f",
                      }}
                    />
                    <div className="min-w-0">
                      <p className="text-xs text-steel-500 dark:text-steel-400">
                        {sub?.label || session.subject}
                      </p>
                      <p className="text-sm font-medium text-baltic-800 dark:text-baltic-100">
                        {formatTime(session.duration)} focus
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-steel-400 py-2">Nothing scheduled</p>
          )}
        </div>
      ) : (
        <p className="text-xs text-steel-400">Select a date to see details</p>
      )}
    </aside>
  );
}
