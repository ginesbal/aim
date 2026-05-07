"use client";

import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
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
  isOverdue,
  dayLabel,
  projectedFinishTime,
  cn,
} from "@/lib/utils";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import AimLogo from "@/components/layout/AimLogo";
import { useRouter } from "next/navigation";
import type { Task, FocusSession, UserSubject } from "@/lib/types";

const FOCUS_BLOCK_MIN = 25;

export default function DashboardPage() {
  const { name, isFirstVisit, dailyGoal, setName } = usePreferences();
  const { tasks, toggleComplete } = useTasks();
  const { todayMinutes, streak, sessions } = useFocus();
  const { getSubject } = useSubjects();
  const router = useRouter();

  const [showWelcome, setShowWelcome] = useState(isFirstVisit);
  const [welcomeName, setWelcomeName] = useState("");

  const firstName = name ? name.split(" ")[0] : "there";

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

  const nextTask = pendingTasks[0];
  const focusPct = Math.min(Math.round((todayMinutes / dailyGoal) * 100), 100);
  const minutesToGoal = Math.max(dailyGoal - todayMinutes, 0);

  // Sessions completed today, recent first — surfaces in the week card so the
  // user sees their effort logged, not as a separate "history" panel.
  const todaySessions = useMemo(() => {
    const todayKey = new Date().toDateString();
    return sessions
      .filter((s) => new Date(s.completedAt).toDateString() === todayKey)
      .sort(
        (a, b) =>
          new Date(b.completedAt).getTime() -
          new Date(a.completedAt).getTime()
      );
  }, [sessions]);

  // Pending tasks grouped by day for the next 7 days. Overdue items collapse
  // into a single "Overdue" group at the top so they never get lost.
  const weekGroups = useMemo(() => {
    const ordered: { label: string; tasks: Task[] }[] = [];
    const byLabel = new Map<string, Task[]>();
    const cap = new Date();
    cap.setDate(cap.getDate() + 7);
    cap.setHours(23, 59, 59);

    for (const t of pendingTasks) {
      const due = new Date(t.dueDate);
      if (due > cap) continue;
      const label = dayLabel(t.dueDate);
      if (!byLabel.has(label)) {
        byLabel.set(label, []);
        ordered.push({ label, tasks: byLabel.get(label)! });
      }
      byLabel.get(label)!.push(t);
    }
    return ordered;
  }, [pendingTasks]);

  // Last 7 days of session activity → small dot trail on the streak chip.
  // Index 6 is today; earlier indexes are days ago.
  const last7 = useMemo(() => {
    const dates = new Set(
      sessions.map((s) => new Date(s.completedAt).toDateString())
    );
    const out: boolean[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      out.push(dates.has(d.toDateString()));
    }
    return out;
  }, [sessions]);

  function handleWelcomeSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!welcomeName.trim()) return;
    setName(welcomeName.trim());
    setShowWelcome(false);
  }

  return (
    <div className="desk-surface relative -mx-8 px-8 -mt-2 pt-2 pb-4">
      <Modal open={showWelcome} onClose={() => {}} width="sm">
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
            <Button type="submit" className="w-full press">
              Get started
            </Button>
          </form>
        </div>
      </Modal>

      {/* Two restrained desk-surface blobs — atmosphere, no work to do */}
      <div
        aria-hidden
        className="absolute top-32 right-[-80px] w-72 h-72 blob-1 bg-baltic-200/25 dark:bg-baltic-700/15 float-slow pointer-events-none -z-10"
      />
      <div
        aria-hidden
        className="absolute bottom-20 right-[8%] w-32 h-32 blob-2 bg-ash-200/30 dark:bg-ash-800/15 float-slow pointer-events-none -z-10"
      />

      {/* ── HEADER — orient + ambient streak ── */}
      <header
        className="mb-8 sticky-enter"
        style={{ "--delay": "0ms" } as CSSProperties}
      >
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-cream-100 dark:bg-cream-900/40 border border-cream-200 dark:border-cream-800/60">
            <span className="w-1.5 h-1.5 rounded-full bg-cream-500" />
            <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-cream-700 dark:text-cream-300">
              {getWeekday()}
            </span>
          </span>
          <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-steel-400">
            {getFormattedDate()}
          </span>
          {streak > 0 && <StreakChip streak={streak} last7={last7} />}
        </div>
        <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-baltic-800 dark:text-baltic-100 leading-[1.1]">
          {getGreeting()},{" "}
          <span className="font-script text-baltic-600 dark:text-baltic-300 text-[1.25em] inline-block translate-y-[2px]">
            {firstName}
          </span>
          <span className="text-baltic-600 dark:text-baltic-300">.</span>
        </h1>
      </header>

      {/* ── HERO — "Right now" — single dominant CTA ── */}
      <StickyCard
        tackColor="cream"
        tilt={-0.6}
        delay={80}
        className="mb-6"
      >
        <HeroBody
          focusPct={focusPct}
          todayMinutes={todayMinutes}
          dailyGoal={dailyGoal}
          minutesToGoal={minutesToGoal}
          nextTask={nextTask}
          subject={nextTask ? getSubject(nextTask.subject) : undefined}
          hasAnySessions={sessions.length > 0}
          onFocus={() => router.push("/focus")}
          onPlanStep={() => router.push("/tasks")}
          onComplete={() => nextTask && toggleComplete(nextTask.id)}
        />
      </StickyCard>

      {/* ── THIS WEEK — look-ahead, with today's completed sessions inline ── */}
      <StickyCard tackColor="baltic" tilt={0.5} delay={160}>
        <WeekBody
          groups={weekGroups}
          todaySessions={todaySessions}
          getSubject={getSubject}
          onOpenAll={() => router.push("/tasks")}
        />
      </StickyCard>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   STREAK CHIP — 7-dot trail + count. Replaces the streak card.
   Today's dot has an outline so the user can read "did I focus
   today yet?" without counting.
   ───────────────────────────────────────────────────────────── */

function StreakChip({ streak, last7 }: { streak: number; last7: boolean[] }) {
  return (
    <span
      className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-baltic-50 dark:bg-baltic-900/40 border border-baltic-200/60 dark:border-baltic-800/60"
      title={`${streak}-day focus streak`}
    >
      <span className="flex items-center gap-[3px]">
        {last7.map((hit, i) => {
          const isToday = i === 6;
          return (
            <span
              key={i}
              className={cn(
                "block w-1 h-1 rounded-full",
                hit
                  ? "bg-baltic-600 dark:bg-baltic-300"
                  : "bg-baltic-200 dark:bg-baltic-800",
                isToday &&
                  "outline outline-1 outline-offset-[1px] outline-cream-500/70 dark:outline-cream-500/50"
              )}
            />
          );
        })}
      </span>
      <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-baltic-700 dark:text-baltic-300 tabular-nums">
        {streak}d streak
      </span>
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────
   HERO — focus widget on the left, named CTA on the right.
   One headline, one highlighter phrase, one button. Branches by
   user state so the empty path teaches instead of apologizing.
   ───────────────────────────────────────────────────────────── */

function HeroBody({
  focusPct,
  todayMinutes,
  dailyGoal,
  minutesToGoal,
  nextTask,
  subject,
  hasAnySessions,
  onFocus,
  onPlanStep,
  onComplete,
}: {
  focusPct: number;
  todayMinutes: number;
  dailyGoal: number;
  minutesToGoal: number;
  nextTask: Task | undefined;
  subject: UserSubject | undefined;
  hasAnySessions: boolean;
  onFocus: () => void;
  onPlanStep: () => void;
  onComplete: () => void;
}) {
  const isDone = focusPct >= 100;
  const subjectLabel = subject?.label ?? nextTask?.subject ?? "study";
  const subjectColor = subject?.color ?? "#60729f";

  // ── Branch the headline + CTA by what the student actually needs ──
  let headline: ReactNode;
  let sub: ReactNode = null;
  let ctaLabel: string;
  let ctaAction: () => void;

  if (!nextTask && !hasAnySessions) {
    // Truly fresh — never touched the app
    headline = (
      <>
        Set your <span className="highlighter">first aim</span>.
      </>
    );
    sub = "Add a task and your study plan starts taking shape.";
    ctaLabel = "Add your first task";
    ctaAction = onPlanStep;
  } else if (!nextTask) {
    // Caught up but has a history
    headline = (
      <>
        <span className="highlighter">All caught up</span>.
      </>
    );
    sub = "Plan something to keep momentum.";
    ctaLabel = "Plan a study step";
    ctaAction = onPlanStep;
  } else if (isDone) {
    headline = (
      <>
        <span className="highlighter">Goal hit</span>. Anything more is bonus.
      </>
    );
    sub = `${formatTime(dailyGoal)} of focus locked in today.`;
    ctaLabel = `Start another ${FOCUS_BLOCK_MIN} min on ${subjectLabel}`;
    ctaAction = onFocus;
  } else if (todayMinutes === 0) {
    const finish = projectedFinishTime(FOCUS_BLOCK_MIN);
    headline = (
      <>
        Aim for <span className="highlighter">{formatTime(dailyGoal)}</span>{" "}
        today.
      </>
    );
    sub = finish ? (
      <>
        First {FOCUS_BLOCK_MIN} min ends at{" "}
        <span className="font-semibold tabular-nums text-baltic-700 dark:text-baltic-300">
          {finish}
        </span>
        .
      </>
    ) : null;
    ctaLabel = `Start ${FOCUS_BLOCK_MIN} min on ${subjectLabel}`;
    ctaAction = onFocus;
  } else {
    const finish = projectedFinishTime(minutesToGoal);
    headline = (
      <>
        <span className="highlighter">{formatTime(minutesToGoal)} to go</span>.
      </>
    );
    sub = finish ? (
      <>
        Hit your goal by{" "}
        <span className="font-semibold tabular-nums text-baltic-700 dark:text-baltic-300">
          {finish}
        </span>
        .
      </>
    ) : null;
    ctaLabel = `Start ${FOCUS_BLOCK_MIN} min on ${subjectLabel}`;
    ctaAction = onFocus;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-[minmax(13rem,16rem)_1fr] gap-6 md:gap-10 items-center">
      <FocusTarget
        focusPct={focusPct}
        todayMinutes={todayMinutes}
        dailyGoal={dailyGoal}
      />

      <div className="text-center md:text-left">
        <CardEyebrow>Right now</CardEyebrow>
        <h2 className="mt-2 text-2xl font-bold text-baltic-800 dark:text-baltic-100 leading-snug">
          {headline}
        </h2>
        {sub && (
          <p className="mt-2 text-sm text-steel-500 dark:text-steel-400">
            {sub}
          </p>
        )}

        {nextTask && (
          <NextTaskPullIn
            task={nextTask}
            subjectLabel={subjectLabel}
            subjectColor={subjectColor}
            onPickAnother={onPlanStep}
          />
        )}

        <div className="mt-5 flex items-center gap-3 flex-wrap justify-center md:justify-start">
          <button
            onClick={ctaAction}
            className="press inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-baltic-700 dark:bg-baltic-500 text-white text-sm font-semibold hover:bg-baltic-800 dark:hover:bg-baltic-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-baltic-400 focus:ring-offset-2 dark:focus:ring-offset-baltic-950"
            style={{
              transition:
                "transform 160ms var(--ease-out), background-color 160ms ease",
            }}
          >
            {ctaLabel}
            <span className="text-base leading-none">→</span>
          </button>

          {nextTask && (
            <button
              onClick={onComplete}
              className="press text-xs font-semibold text-steel-500 dark:text-steel-400 hover:text-baltic-700 dark:hover:text-baltic-300 transition-colors px-1"
            >
              Mark done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* Compact pull-in inside the hero — surfaces the next task with subject
   color so the CTA's "Start 25 min on X" has visual context. */
function NextTaskPullIn({
  task,
  subjectLabel,
  subjectColor,
  onPickAnother,
}: {
  task: Task;
  subjectLabel: string;
  subjectColor: string;
  onPickAnother: () => void;
}) {
  const overdue = isOverdue(task.dueDate);
  const due = overdue ? "Overdue" : dayLabel(task.dueDate);

  return (
    <div className="mt-4 flex items-start gap-3 max-w-md mx-auto md:mx-0">
      <span
        className="w-1 self-stretch rounded-full flex-shrink-0 mt-1"
        style={{ backgroundColor: subjectColor }}
        aria-hidden
      />
      <div className="flex-1 min-w-0 text-left">
        <p className="text-sm font-bold text-baltic-800 dark:text-baltic-100 leading-snug">
          {task.title}
        </p>
        <p className="text-xs text-steel-500 dark:text-steel-400 mt-0.5">
          <span
            className={cn(
              "font-medium",
              overdue && "text-red-500 dark:text-red-400"
            )}
          >
            {due}
          </span>
          <span className="mx-1.5 text-steel-300 dark:text-steel-600">·</span>
          <span>{subjectLabel}</span>
          <span className="mx-1.5 text-steel-300 dark:text-steel-600">·</span>
          <button
            onClick={onPickAnother}
            className="press underline-offset-2 hover:underline hover:text-baltic-700 dark:hover:text-baltic-300 transition-colors"
          >
            pick another
          </button>
        </p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   THIS WEEK — day-grouped pending tasks. Today's row also lists
   completed sessions as quiet ash chips at the top, so a
   student's morning effort is visible alongside what's still due.
   ───────────────────────────────────────────────────────────── */

function WeekBody({
  groups,
  todaySessions,
  getSubject,
  onOpenAll,
}: {
  groups: { label: string; tasks: Task[] }[];
  todaySessions: FocusSession[];
  getSubject: (idOrLabel: string) => UserSubject | undefined;
  onOpenAll: () => void;
}) {
  const totalPending = groups.reduce((sum, g) => sum + g.tasks.length, 0);
  const isEmpty = totalPending === 0 && todaySessions.length === 0;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <CardEyebrow>This week</CardEyebrow>
        {totalPending > 0 && (
          <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-steel-400 tabular-nums">
            {totalPending} pending
          </span>
        )}
      </div>

      {isEmpty ? (
        <WeekEmpty onAdd={onOpenAll} />
      ) : (
        <div className="mt-4 space-y-5">
          {/* Today's completed sessions — only shown if today exists in groups
              we'd render the chips inside that group; otherwise prepend a
              today section so the user's done work is acknowledged. */}
          {todaySessions.length > 0 &&
            !groups.some((g) => g.label === "Today") && (
              <DayGroup
                label="Today"
                tasks={[]}
                completedSessions={todaySessions}
                getSubject={getSubject}
                onOpenTask={onOpenAll}
                rowDelayBase={220}
              />
            )}

          {groups.map((group, i) => (
            <DayGroup
              key={group.label}
              label={group.label}
              tasks={group.tasks}
              completedSessions={
                group.label === "Today" ? todaySessions : []
              }
              getSubject={getSubject}
              onOpenTask={onOpenAll}
              rowDelayBase={220 + i * 30}
            />
          ))}

          <div className="pt-3 border-t border-dashed border-lavender-200 dark:border-lavender-800">
            <button
              onClick={onOpenAll}
              className="press text-xs font-semibold text-steel-500 dark:text-steel-400 hover:text-baltic-700 dark:hover:text-baltic-300 transition-colors"
            >
              Open the full wall →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function DayGroup({
  label,
  tasks,
  completedSessions,
  getSubject,
  onOpenTask,
  rowDelayBase,
}: {
  label: string;
  tasks: Task[];
  completedSessions: FocusSession[];
  getSubject: (idOrLabel: string) => UserSubject | undefined;
  onOpenTask: () => void;
  rowDelayBase: number;
}) {
  const isOverdueGroup = label === "Overdue";
  return (
    <div>
      <div className="flex items-baseline gap-2 mb-2">
        <h3
          className={cn(
            "text-[10px] font-bold uppercase tracking-[0.2em]",
            isOverdueGroup
              ? "text-red-500 dark:text-red-400"
              : "text-baltic-700 dark:text-baltic-300"
          )}
        >
          {label}
        </h3>
        {tasks.length > 0 && (
          <span className="text-[10px] font-mono text-steel-400 tabular-nums">
            · {tasks.length}
          </span>
        )}
      </div>

      <ul className="space-y-1">
        {completedSessions.map((s, i) => (
          <li
            key={s.id}
            className="sticky-enter"
            style={{ "--delay": `${rowDelayBase + i * 30}ms` } as CSSProperties}
          >
            <CompletedSessionRow
              session={s}
              subject={getSubject(s.subject)}
            />
          </li>
        ))}
        {tasks.map((t, i) => (
          <li
            key={t.id}
            className="sticky-enter"
            style={
              {
                "--delay": `${
                  rowDelayBase + (completedSessions.length + i) * 30
                }ms`,
              } as CSSProperties
            }
          >
            <TaskRow
              task={t}
              subject={getSubject(t.subject)}
              onOpen={onOpenTask}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

function CompletedSessionRow({
  session,
  subject,
}: {
  session: FocusSession;
  subject: UserSubject | undefined;
}) {
  const date = new Date(session.completedAt);
  const time = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  const label = subject?.label ?? session.subject;
  return (
    <div className="flex items-center gap-2.5 py-1.5 px-2 -mx-2 rounded-md text-xs text-ash-700 dark:text-ash-300">
      <svg
        width="11"
        height="11"
        viewBox="0 0 12 12"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-ash-600 dark:text-ash-400 flex-shrink-0"
      >
        <path d="M2.5 6.5l2.5 2.5L9.5 4" />
      </svg>
      <span className="font-semibold">{label}</span>
      <span className="text-steel-400">·</span>
      <span className="tabular-nums">{formatTime(session.duration)}</span>
      <span className="text-steel-400">·</span>
      <span className="tabular-nums text-steel-500 dark:text-steel-400">
        {time}
      </span>
    </div>
  );
}

function TaskRow({
  task,
  subject,
  onOpen,
}: {
  task: Task;
  subject: UserSubject | undefined;
  onOpen: () => void;
}) {
  const color = subject?.color ?? "#60729f";
  const label = subject?.label ?? task.subject;
  return (
    <button
      onClick={onOpen}
      className="press group w-full flex items-center gap-3 py-2 px-2 -mx-2 rounded-md text-left hover:bg-baltic-50/60 dark:hover:bg-baltic-900/30 transition-colors focus:outline-none focus:ring-2 focus:ring-baltic-400/50"
    >
      <span
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: color }}
        aria-hidden
      />
      <span className="flex-1 min-w-0 text-sm text-baltic-800 dark:text-baltic-100 truncate">
        {task.title}
      </span>
      <span className="text-[11px] text-steel-500 dark:text-steel-400 flex-shrink-0 hidden sm:inline">
        {label}
      </span>
      <span className="text-steel-300 dark:text-steel-600 flex-shrink-0 transition-transform group-hover:translate-x-0.5">
        →
      </span>
    </button>
  );
}

function WeekEmpty({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="mt-4">
      <p className="text-sm text-steel-500 dark:text-steel-400">
        Nothing on the wall yet. Add what's next so you have a place to start.
      </p>
      <button
        onClick={onAdd}
        className="press mt-3 text-xs font-semibold text-baltic-700 dark:text-baltic-300 hover:text-baltic-900 dark:hover:text-baltic-100 transition-colors"
      >
        Plan a study step →
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   STICKY CARD — pinboard treatment: micro-tilted panel pinned at
   the top with a single thumbtack. One accessory family for the
   whole board so the visual vocabulary stays consistent.
   The entry animation runs on an outer wrapper so it doesn't fight
   the inner tilt transform.
   ───────────────────────────────────────────────────────────── */

type TackColor = "cream" | "baltic" | "ash";

function StickyCard({
  children,
  tackColor = "cream",
  tilt = 0,
  delay = 0,
  className,
}: {
  children: ReactNode;
  tackColor?: TackColor;
  tilt?: number;
  delay?: number;
  className?: string;
}) {
  return (
    <div
      className={cn("sticky-enter", className)}
      style={{ "--delay": `${delay}ms` } as CSSProperties}
    >
      <div
        className="paper-card pinboard-tilt relative px-6 pt-9 pb-6 border border-lavender-200/60 dark:border-lavender-800/60"
        style={{ "--tilt": `${tilt}deg` } as CSSProperties}
      >
        <Thumbtack
          color={tackColor}
          className="absolute left-1/2 -translate-x-1/2"
          style={{ top: "-19px" }}
        />
        <div className="relative z-10">{children}</div>
      </div>
    </div>
  );
}

function CardEyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-steel-500 dark:text-steel-400">
      {children}
    </p>
  );
}

/* ─────────────────────────────────────────────────────────────
   THUMBTACK — colored dome with darker rim, soft right-side
   shading, two catch-lights, visible pin shaft hint, drop shadow.
   Sits at the top-center of every card, pin embedded into the
   paper so the dome stands proud above the card edge.
   ───────────────────────────────────────────────────────────── */

const TACK_FILLS: Record<TackColor, { dome: string; rim: string }> = {
  cream: { dome: "#c7ce64", rim: "#8a8f3f" },
  baltic: { dome: "#60729f", rim: "#3e4c70" },
  ash: { dome: "#7a9477", rim: "#4f644f" },
};

function Thumbtack({
  className,
  color = "cream",
  style,
}: {
  className?: string;
  color?: TackColor;
  style?: CSSProperties;
}) {
  const fill = TACK_FILLS[color];
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none", className)}
      style={{
        ...style,
        filter:
          "drop-shadow(0 2px 2px rgba(38, 45, 64, 0.28)) drop-shadow(0 0.5px 0 rgba(38, 45, 64, 0.12))",
      }}
    >
      <svg width="26" height="30" viewBox="0 0 26 30" fill="none">
        {/* Pin shaft — hint of the pin going into the paper */}
        <path d="M11.6 17 L13 23 L14.4 17 Z" fill="#9ba3b3" />
        <path
          d="M11.6 17 L13 23 L14.4 17 Z"
          stroke="#6b7488"
          strokeWidth="0.4"
          fill="none"
        />
        {/* Dome — main body */}
        <ellipse cx="13" cy="11" rx="9" ry="8" fill={fill.dome} />
        {/* Darker bottom rim for volume */}
        <path
          d="M4.5 11 A9 8 0 0 0 21.5 11 A9 5 0 0 1 4.5 11 Z"
          fill={fill.rim}
          opacity="0.45"
        />
        {/* Soft right-side shading */}
        <ellipse cx="16.5" cy="12.5" rx="4" ry="5" fill="black" opacity="0.10" />
        {/* Primary catch-light */}
        <ellipse cx="9.4" cy="7.6" rx="3.2" ry="1.9" fill="white" opacity="0.6" />
        {/* Secondary tiny glint */}
        <circle cx="15.2" cy="8.4" r="0.8" fill="white" opacity="0.75" />
      </svg>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   FOCUS TARGET — the full "a" of aim. Bowl + tail silhouette
   pulled directly from the AimLogo paths; baltic translates up
   from below as focus minutes accrue. White counter dot sits in
   the bowl with the percentage centered.
   ───────────────────────────────────────────────────────────── */

const A_BOWL_CX = 241.5;
const A_BOWL_CY = 293.5;
const A_BOWL_R = 64.5;
const A_TAIL_PATH =
  "M305.782 288.417L306 290V356H233V279H302.256L305.782 288.417Z";
const A_COUNTER_CX = 242;
const A_COUNTER_CY = 294.5;
const A_COUNTER_R = 20;

const A_VB_X = 170;
const A_VB_Y = 222;
const A_VB_SIZE = 142;
const A_TOP = A_BOWL_CY - A_BOWL_R;
const A_HEIGHT = 2 * A_BOWL_R;

function FocusTarget({
  focusPct,
  todayMinutes,
  dailyGoal,
}: {
  focusPct: number;
  todayMinutes: number;
  dailyGoal: number;
}) {
  return (
    <div className="mx-auto w-full max-w-[15rem] text-center">
      <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-steel-500 dark:text-steel-400 mb-3">
        Focus
      </span>

      <div className="relative mx-auto w-44 h-44">
        <svg
          aria-hidden
          viewBox={`${A_VB_X} ${A_VB_Y} ${A_VB_SIZE} ${A_VB_SIZE}`}
          className="absolute inset-0 w-full h-full"
        >
          <defs>
            <clipPath id="aim-a-silhouette">
              <circle cx={A_BOWL_CX} cy={A_BOWL_CY} r={A_BOWL_R} />
              <path d={A_TAIL_PATH} />
            </clipPath>
          </defs>

          <g clipPath="url(#aim-a-silhouette)">
            <rect
              x={A_VB_X}
              y={A_VB_Y}
              width={A_VB_SIZE}
              height={A_VB_SIZE}
              className="fill-lavender-200/55 dark:fill-lavender-800/40"
            />
            <rect
              x={A_VB_X}
              y={A_TOP}
              width={A_VB_SIZE}
              height={A_HEIGHT}
              className="fill-baltic-700 dark:fill-baltic-400"
              style={{
                transform: `translateY(${
                  100 - Math.max(0, Math.min(100, focusPct))
                }%)`,
                transformBox: "fill-box",
                transition: "transform 800ms var(--ease-out)",
              }}
            />
          </g>

          <circle
            cx={A_COUNTER_CX}
            cy={A_COUNTER_CY}
            r={A_COUNTER_R}
            className="fill-white dark:fill-baltic-900"
          />
        </svg>

        <div
          className="absolute pointer-events-none -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `${((A_COUNTER_CX - A_VB_X) / A_VB_SIZE) * 100}%`,
            top: `${((A_COUNTER_CY - A_VB_Y) / A_VB_SIZE) * 100}%`,
          }}
        >
          <span className="text-base font-bold tabular-nums tracking-tight text-baltic-800 dark:text-baltic-100 leading-none">
            {focusPct}
            <span className="text-[0.65em] ml-px text-baltic-600 dark:text-baltic-400">
              %
            </span>
          </span>
        </div>
      </div>

      <p className="mt-4 text-xs text-steel-500 dark:text-steel-400">
        <span className="font-semibold tabular-nums text-baltic-700 dark:text-baltic-300">
          {formatTime(todayMinutes)}
        </span>{" "}
        of{" "}
        <span className="font-semibold tabular-nums text-baltic-700 dark:text-baltic-300">
          {formatTime(dailyGoal)}
        </span>
      </p>
    </div>
  );
}
