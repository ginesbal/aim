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

    const sortedKeys = Object.keys(groups).sort();
    const limited: typeof groups = {};
    for (const key of sortedKeys.slice(0, 5)) {
      limited[key] = groups[key];
    }
    return limited;
  }, [tasks]);

  const dateKeys = Object.keys(groupedTasks).sort();

  return (
    <aside className="w-[280px] flex-shrink-0 bg-white dark:bg-lavender-900 rounded-2xl p-6 border border-lavender-100 dark:border-lavender-800 self-stretch">
      {/* Header */}
      <h2 className="text-lg font-semibold text-baltic-800 dark:text-baltic-100 mb-6">
        Calendar
      </h2>

      {/* Divider */}
      <div className="border-t border-lavender-100 dark:border-lavender-800 mb-6" />

      {/* Date groups */}
      <div className="space-y-0">
        {dateKeys.length > 0 ? (
          dateKeys.map((dateKey, groupIndex) => (
            <div key={dateKey}>
              {/* Divider between groups */}
              {groupIndex > 0 && (
                <div className="border-t border-lavender-100 dark:border-lavender-800 my-5" />
              )}

              {/* Date header */}
              <p className="text-sm font-semibold text-baltic-700 dark:text-baltic-200 mb-3">
                {formatCalendarDate(dateKey)}
              </p>

              {/* Tasks in this date */}
              <div className="space-y-3">
                {groupedTasks[dateKey].map((task, i) => {
                  const subject = SUBJECTS[task.subject as SubjectKey];
                  return (
                    <div key={task.id} className="flex items-start gap-3">
                      <span className="text-xs font-semibold text-steel-400 w-10 pt-0.5 flex-shrink-0">
                        {getTimeSlot(i)}
                      </span>
                      <div
                        className="w-0.5 rounded-full self-stretch flex-shrink-0"
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
