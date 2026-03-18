"use client";

import { useMemo } from "react";
import { useAuth, useTasks, useFocus } from "@/lib/contexts";
import { getGreeting, getWeekday, getFormattedDate, formatTime, formatDate, isOverdue } from "@/lib/utils";
import { SUBJECTS, PRIORITIES } from "@/lib/types";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import ProgressRing from "@/components/ui/ProgressRing";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const { user } = useAuth();
  const { tasks, toggleComplete } = useTasks();
  const { todayMinutes, weekMinutes, streak, sessions } = useFocus();
  const router = useRouter();

  const firstName = user?.name?.split(" ")[0] || "there";

  const pendingTasks = useMemo(
    () => tasks.filter((t) => !t.completed).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()),
    [tasks]
  );

  const completedToday = useMemo(
    () => tasks.filter((t) => t.completed).length,
    [tasks]
  );

  const upcomingTasks = pendingTasks.slice(0, 4);

  // Daily goal: 2 hours
  const dailyGoal = 120;
  const dailyProgress = Math.min((todayMinutes / dailyGoal) * 100, 100);

  // Subject breakdown for this week
  const subjectBreakdown = useMemo(() => {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const map: Record<string, number> = {};
    sessions
      .filter((s) => new Date(s.completedAt) >= weekStart)
      .forEach((s) => {
        map[s.subject] = (map[s.subject] || 0) + s.duration;
      });

    return Object.entries(map)
      .map(([subject, minutes]) => ({
        subject,
        minutes,
        label: SUBJECTS[subject as keyof typeof SUBJECTS]?.label || subject,
        color: SUBJECTS[subject as keyof typeof SUBJECTS]?.color || "#60729f",
      }))
      .sort((a, b) => b.minutes - a.minutes);
  }, [sessions]);

  const totalWeekMinutes = subjectBreakdown.reduce((s, b) => s + b.minutes, 0) || 1;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-display text-baltic-800 dark:text-baltic-100">
          {getGreeting()}, {firstName}
        </h1>
        <p className="text-body text-steel-500 dark:text-steel-400 mt-1">
          {getWeekday()}, {getFormattedDate()}
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4">
        {[
          {
            label: "Today's focus",
            value: formatTime(todayMinutes),
            sub: `of ${formatTime(dailyGoal)} goal`,
            accent: "bg-baltic-500",
          },
          {
            label: "This week",
            value: formatTime(weekMinutes),
            sub: `across ${subjectBreakdown.length} subjects`,
            accent: "bg-ash-500",
          },
          {
            label: "Streak",
            value: `${streak} day${streak !== 1 ? "s" : ""}`,
            sub: streak > 0 ? "Keep it going" : "Start today",
            accent: "bg-cream-500",
          },
          {
            label: "Tasks done",
            value: `${completedToday}`,
            sub: `of ${tasks.length} total`,
            accent: "bg-lavender-500",
          },
        ].map((stat) => (
          <Card key={stat.label} padding="sm">
            <div className="flex items-start gap-3">
              <div className={`w-1 h-10 rounded-full ${stat.accent} flex-shrink-0 mt-0.5`} />
              <div>
                <p className="text-caption">{stat.label}</p>
                <p className="text-xl font-semibold text-baltic-800 dark:text-baltic-100 mt-0.5 tracking-tight">
                  {stat.value}
                </p>
                <p className="text-xs text-steel-400 mt-0.5">{stat.sub}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Focus progress — left 2 cols */}
        <div className="col-span-2 space-y-6">
          {/* Daily Focus Card */}
          <Card>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-title text-baltic-800 dark:text-baltic-100">Daily focus</h2>
                <p className="text-caption mt-0.5">Your study time today</p>
              </div>
              <button
                onClick={() => router.push("/focus")}
                className="text-sm text-baltic-500 hover:text-baltic-700 dark:hover:text-baltic-300 font-medium transition-smooth"
              >
                Start session →
              </button>
            </div>

            <div className="flex items-center gap-8">
              <ProgressRing
                progress={dailyProgress}
                size={130}
                strokeWidth={10}
                color="#60729f"
                trackColor="#eff1f5"
              >
                <div className="text-center">
                  <p className="text-2xl font-semibold text-baltic-800 dark:text-baltic-100 tracking-tight">
                    {Math.round(dailyProgress)}%
                  </p>
                  <p className="text-[10px] text-steel-400 uppercase tracking-wider font-medium">
                    of goal
                  </p>
                </div>
              </ProgressRing>

              {/* Subject breakdown bars */}
              <div className="flex-1 space-y-3">
                {subjectBreakdown.length > 0 ? (
                  subjectBreakdown.slice(0, 4).map((item) => (
                    <div key={item.subject}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-baltic-700 dark:text-baltic-300">
                          {item.label}
                        </span>
                        <span className="text-xs text-steel-400">{formatTime(item.minutes)}</span>
                      </div>
                      <div className="h-1.5 bg-lavender-100 dark:bg-lavender-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${(item.minutes / totalWeekMinutes) * 100}%`,
                            backgroundColor: item.color,
                          }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-steel-400">No sessions yet today. Start one to see your breakdown.</p>
                )}
              </div>
            </div>
          </Card>

          {/* Upcoming tasks */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-title text-baltic-800 dark:text-baltic-100">Upcoming tasks</h2>
              <button
                onClick={() => router.push("/tasks")}
                className="text-sm text-baltic-500 hover:text-baltic-700 dark:hover:text-baltic-300 font-medium transition-smooth"
              >
                View all →
              </button>
            </div>

            {upcomingTasks.length > 0 ? (
              <div className="space-y-1">
                {upcomingTasks.map((task) => {
                  const subject = SUBJECTS[task.subject as keyof typeof SUBJECTS];
                  const overdue = isOverdue(task.dueDate);
                  return (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 py-3 border-b border-lavender-50 dark:border-lavender-800 last:border-0 group"
                    >
                      {/* Checkbox */}
                      <button
                        onClick={() => toggleComplete(task.id)}
                        className="w-[18px] h-[18px] rounded-full border-2 border-lavender-300 dark:border-lavender-600 flex-shrink-0 hover:border-baltic-400 transition-smooth flex items-center justify-center"
                      >
                        <span className="w-2 h-2 rounded-full bg-transparent group-hover:bg-baltic-400/30 transition-smooth" />
                      </button>

                      {/* Subject color dot */}
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: subject?.color || "#60729f" }}
                      />

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-baltic-800 dark:text-baltic-100 truncate">
                          {task.title}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge color={PRIORITIES[task.priority].color}>
                          {PRIORITIES[task.priority].label}
                        </Badge>
                        <span className={`text-xs font-medium ${overdue ? "text-red-500" : "text-steel-400"}`}>
                          {formatDate(task.dueDate)}
                        </span>
                      </div>
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
        </div>

        {/* Right column — weekly rhythm */}
        <div className="space-y-6">
          {/* Week rhythm visualization */}
          <Card>
            <h3 className="text-title text-baltic-800 dark:text-baltic-100 mb-4">This week</h3>
            <WeekRhythm sessions={sessions} />
          </Card>

          {/* Quick actions */}
          <Card>
            <h3 className="text-title text-baltic-800 dark:text-baltic-100 mb-3">Quick actions</h3>
            <div className="space-y-2">
              <button
                onClick={() => router.push("/tasks")}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-baltic-700 dark:text-baltic-300 hover:bg-lavender-50 dark:hover:bg-lavender-900 transition-smooth text-left"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <circle cx="8" cy="8" r="6" />
                  <path d="M8 5v6M5 8h6" />
                </svg>
                Add new task
              </button>
              <button
                onClick={() => router.push("/focus")}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-baltic-700 dark:text-baltic-300 hover:bg-lavender-50 dark:hover:bg-lavender-900 transition-smooth text-left"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <polygon points="5,3 13,8 5,13" />
                </svg>
                Start focus session
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* Week rhythm — shows study activity per day as a heatmap row */
function WeekRhythm({ sessions }: { sessions: { completedAt: string; duration: number }[] }) {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const dayMinutes = days.map((_, i) => {
    const dayDate = new Date(weekStart);
    dayDate.setDate(weekStart.getDate() + i);
    const dayStr = dayDate.toDateString();
    return sessions
      .filter((s) => new Date(s.completedAt).toDateString() === dayStr)
      .reduce((sum, s) => sum + s.duration, 0);
  });

  const maxMinutes = Math.max(...dayMinutes, 30);

  return (
    <div className="space-y-2">
      {days.map((day, i) => {
        const isToday = i === now.getDay();
        const pct = (dayMinutes[i] / maxMinutes) * 100;
        return (
          <div key={day} className="flex items-center gap-3">
            <span className={`w-8 text-xs font-medium ${isToday ? "text-baltic-600 dark:text-baltic-400" : "text-steel-400"}`}>
              {day}
            </span>
            <div className="flex-1 h-2 bg-lavender-100 dark:bg-lavender-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${pct}%`,
                  backgroundColor: isToday ? "#60729f" : "#91a989",
                }}
              />
            </div>
            {dayMinutes[i] > 0 && (
              <span className="text-xs text-steel-400 w-8 text-right">{formatTime(dayMinutes[i])}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
