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
import ProgressRing from "@/components/ui/ProgressRing";
import QualityIndicator from "@/components/ui/QualityIndicator";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const { name, isFirstVisit, setName } = usePreferences();
  const { tasks, toggleComplete } = useTasks();
  const { todayMinutes, weekMinutes, streak, sessions } = useFocus();
  const router = useRouter();

  // Welcome overlay state
  const [showWelcome, setShowWelcome] = useState(isFirstVisit);
  const [welcomeName, setWelcomeName] = useState("");

  const firstName = name ? name.split(" ")[0] : "there";

  const pendingTasks = useMemo(
    () => tasks.filter((t) => !t.completed).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()),
    [tasks]
  );

  const completedToday = useMemo(
    () => tasks.filter((t) => t.completed).length,
    [tasks]
  );

  const upcomingTasks = pendingTasks.slice(0, 4);

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

  // Recent reflections (sessions with reflection data, newest first)
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
      {/* Welcome overlay for first-time visitors */}
      <Modal open={showWelcome} onClose={() => setShowWelcome(false)} width="sm">
        <div className="text-center py-4">
          <div className="w-12 h-12 rounded-xl bg-baltic-500 flex items-center justify-center mx-auto mb-5">
            <svg width="24" height="24" viewBox="0 0 16 16" fill="none">
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
        {/* Left 2 columns */}
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
                      <button
                        onClick={() => toggleComplete(task.id)}
                        className="w-[18px] h-[18px] rounded-full border-2 border-lavender-300 dark:border-lavender-600 flex-shrink-0 hover:border-baltic-400 transition-smooth flex items-center justify-center"
                      >
                        <span className="w-2 h-2 rounded-full bg-transparent group-hover:bg-baltic-400/30 transition-smooth" />
                      </button>
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

        {/* Right column */}
        <div className="space-y-6">
          {/* Week rhythm */}
          <Card>
            <h3 className="text-title text-baltic-800 dark:text-baltic-100 mb-4">This week</h3>
            <WeekRhythm sessions={sessions} />
          </Card>

          {/* Recent reflections */}
          <Card>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-title text-baltic-800 dark:text-baltic-100">Recent reflections</h3>
              {recentReflections.length > 0 && (
                <button
                  onClick={() => router.push("/journal")}
                  className="text-xs text-baltic-500 hover:text-baltic-700 dark:hover:text-baltic-300 font-medium transition-smooth"
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
                    <div key={session.id} className="flex items-start gap-2.5">
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
                        style={{ backgroundColor: sub?.color || "#60729f" }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-baltic-700 dark:text-baltic-300">
                            {sub?.label || session.subject}
                          </span>
                          {session.reflection && (
                            <QualityIndicator quality={session.reflection.quality} size={12} />
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
              <p className="text-xs text-steel-400 leading-relaxed">
                Complete a focus session and reflect on it to see your reflections here.
              </p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

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
