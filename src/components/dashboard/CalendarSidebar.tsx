"use client";

import { useMemo } from "react";
import { useTasks } from "@/lib/contexts";
import { SUBJECTS, type SubjectKey } from "@/lib/types";

function formatCalendarDate(dateStr: string) {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getTimeSlot(index: number) {
  const hours = [9, 10, 11, 13, 14, 15, 16];
  const hour = hours[index % hours.length];
  return `${hour}:00`;
}

export default function CalendarSidebar() {
  const { tasks } = useTasks();

  const groupedTasks = useMemo(() => {
    const pending = tasks
      .filter((t) => !t.completed)
      .sort(
        (a, b) =>
          new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      );

    const groups: Record<string, typeof pending> = {};
    for (const task of pending) {
      const key = task.dueDate;
      if (!groups[key]) groups[key] = [];
      groups[key].push(task);
    }

    // Show at most 3 date groups
    const sortedKeys = Object.keys(groups).sort();
    const limited: typeof groups = {};
    for (const key of sortedKeys.slice(0, 3)) {
      limited[key] = groups[key];
    }
    return limited;
  }, [tasks]);

  const dateKeys = Object.keys(groupedTasks).sort();

  return (
    <aside className="w-[280px] flex-shrink-0 bg-white dark:bg-lavender-900 rounded-2xl p-6 h-fit sticky top-8 border border-lavender-100 dark:border-lavender-800">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-baltic-800 dark:text-baltic-100">
          Calendar
        </h2>
        <button className="w-8 h-8 rounded-lg bg-baltic-50 dark:bg-baltic-800 flex items-center justify-center hover:bg-baltic-100 dark:hover:bg-baltic-700 transition-smooth">
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-baltic-600 dark:text-baltic-300"
          >
            <path d="M12.5 4.5v-2a1 1 0 00-1-1h-7a1 1 0 00-1 1v11a1 1 0 001 1h7a1 1 0 001-1v-2" />
            <path d="M5 5.5h5M5 8h3" />
          </svg>
        </button>
      </div>

      {/* Date groups */}
      <div className="space-y-6">
        {dateKeys.length > 0 ? (
          dateKeys.map((dateKey) => (
            <div key={dateKey}>
              {/* Date header */}
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-baltic-700 dark:text-baltic-200">
                  {formatCalendarDate(dateKey)}
                </p>
                <button className="text-steel-400 hover:text-steel-600 dark:hover:text-steel-300">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                    <circle cx="3" cy="7" r="1.2" />
                    <circle cx="7" cy="7" r="1.2" />
                    <circle cx="11" cy="7" r="1.2" />
                  </svg>
                </button>
              </div>

              {/* Tasks in this date */}
              <div className="space-y-3">
                {groupedTasks[dateKey].map((task, i) => {
                  const subject =
                    SUBJECTS[task.subject as SubjectKey];
                  return (
                    <div key={task.id} className="flex items-start gap-3">
                      <span className="text-xs font-semibold text-steel-400 w-10 pt-0.5 flex-shrink-0">
                        {getTimeSlot(i)}
                      </span>
                      <div
                        className="w-0.5 rounded-full self-stretch flex-shrink-0"
                        style={{
                          backgroundColor:
                            subject?.color || "#60729f",
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
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-steel-400 text-center py-4">
            No upcoming tasks
          </p>
        )}
      </div>
    </aside>
  );
}
