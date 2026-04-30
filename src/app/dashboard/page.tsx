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
  formatDate,
  isOverdue,
  cn,
} from "@/lib/utils";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import AimLogo from "@/components/layout/AimLogo";
import { useRouter } from "next/navigation";

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
  const remainingCount = Math.max(pendingTasks.length - 1, 0);

  const lastSession = useMemo(
    () =>
      [...sessions].sort(
        (a, b) =>
          new Date(b.completedAt).getTime() -
          new Date(a.completedAt).getTime()
      )[0],
    [sessions]
  );

  const focusPct = Math.min(Math.round((todayMinutes / dailyGoal) * 100), 100);
  const minutesToGoal = Math.max(dailyGoal - todayMinutes, 0);

  // Plain-language guidance with the key phrase highlighted separately
  const guidance = useMemo(() => {
    if (todayMinutes === 0) {
      return {
        lead: "Your goal is",
        accent: formatTime(dailyGoal),
        tail: ". Start whenever you're ready.",
      };
    }
    if (focusPct >= 100) {
      return {
        lead: "You ",
        accent: "hit today's goal",
        tail: ". Anything more is a bonus.",
      };
    }
    if (focusPct >= 75) {
      return {
        lead: "Almost there - just ",
        accent: `${formatTime(minutesToGoal)} left`,
        tail: ".",
      };
    }
    return {
      lead: "",
      accent: `${formatTime(minutesToGoal)} to go`,
      tail: " to reach your goal.",
    };
  }, [todayMinutes, dailyGoal, focusPct, minutesToGoal]);

  function handleWelcomeSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!welcomeName.trim()) return;
    setName(welcomeName.trim());
    setShowWelcome(false);
  }

  return (
    <div className="desk-surface relative -mx-8 px-8 -mt-2 pt-2 pb-4">
      {/* Welcome modal */}
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

      {/* ─── Decorative blobs ─── */}
      <div
        aria-hidden
        className="absolute top-32 right-[-80px] w-72 h-72 blob-1 bg-baltic-200/25 dark:bg-baltic-700/15 float-slow pointer-events-none -z-10"
      />
      <div
        aria-hidden
        className="absolute top-[520px] left-[-60px] w-40 h-40 blob-3 bg-cream-200/30 dark:bg-cream-800/15 float-medium pointer-events-none -z-10"
      />
      <div
        aria-hidden
        className="absolute bottom-20 right-[8%] w-32 h-32 blob-2 bg-ash-200/30 dark:bg-ash-800/15 float-slow pointer-events-none -z-10"
      />

      {/* ─── 1. Greeting — class-period header ─── */}
      <header
        className="mb-8 sticky-enter"
        style={{ "--delay": "0ms" } as CSSProperties}
      >
        <div className="inline-flex items-center gap-2 mb-3">
          <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-cream-100 dark:bg-cream-900/40 border border-cream-200 dark:border-cream-800/60">
            <span className="w-1.5 h-1.5 rounded-full bg-cream-500" />
            <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-cream-700 dark:text-cream-300">
              {getWeekday()}
            </span>
          </span>
          <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-steel-400">
            {getFormattedDate()}
          </span>
        </div>
        <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-baltic-800 dark:text-baltic-100 leading-[1.1]">
          {getGreeting()},{" "}
          <span className="font-script text-baltic-600 dark:text-baltic-300 text-[1.25em] inline-block translate-y-[2px]">
            {firstName}
          </span>
          <span className="text-baltic-600 dark:text-baltic-300">.</span>
        </h1>
        {/* Hand-drawn underline beneath the name */}
        <ScribbleUnderline className="ml-[8.5rem] mt-1 text-cream-500/70 dark:text-cream-400/50" />
      </header>

      {/* ─── 2. Your aim today — summary note + guidance card ─── */}
      <div className="mb-7 grid grid-cols-1 lg:grid-cols-[minmax(15rem,18rem)_1fr] gap-5 lg:gap-6 items-stretch">
        <FocusStickyNote delay={60}>
          <FocusSummary
            focusPct={focusPct}
            todayMinutes={todayMinutes}
            dailyGoal={dailyGoal}
            minutesToGoal={minutesToGoal}
          />
        </FocusStickyNote>

        <StickyCard tape="lavender" delay={100} paperclip>
          {/* Title + guidance + CTA */}
          <div className="relative text-center md:text-left">
            <CardEyebrow>Your aim today</CardEyebrow>
            <p className="mt-2 text-2xl font-bold text-baltic-800 dark:text-baltic-100 leading-snug">
              {guidance.lead}
              <span className="highlighter">{guidance.accent}</span>
              {guidance.tail}
            </p>
            <p className="mt-3 text-sm text-steel-500 dark:text-steel-400">
              Keep it simple: one timer, one task, then a real break.
            </p>

            {/* CTA */}
            <button
              onClick={() => router.push("/focus")}
              className="press mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-baltic-700 dark:bg-baltic-500 text-white text-sm font-semibold hover:bg-baltic-800 dark:hover:bg-baltic-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-baltic-400 focus:ring-offset-2 dark:focus:ring-offset-baltic-950"
              style={{ transition: "transform 160ms var(--ease-out), background-color 160ms ease" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-cream-300" />
              {todayMinutes === 0 ? "Begin a focus session" : "Continue focusing"}
              <span className="text-base leading-none">→</span>
            </button>
          </div>
        </StickyCard>
      </div>

      {/* ─── Hand-drawn pointer arrow ─── */}
      <div
        className="flex justify-center mb-4 sticky-enter"
        style={{ "--delay": "180ms" } as CSSProperties}
      >
        <div className="flex flex-col items-center text-steel-400 dark:text-steel-500">
          <span className="font-script text-base text-cream-700 dark:text-cream-300 -mb-0.5">
            choose one next
          </span>
          <DoodleArrow className="text-baltic-400 dark:text-baltic-500" />
        </div>
      </div>

      {/* ─── 3. Next up — guided task sticky note ─── */}
      <StickyCard
        tape="baltic"
        delay={120}
        className="mb-7"
      >
        <CardEyebrow>Next up</CardEyebrow>

        {nextTask ? (
          <NextTaskBlock
            task={nextTask}
            subject={getSubject(nextTask.subject)}
            onComplete={() => toggleComplete(nextTask.id)}
            onFocus={() => router.push("/focus")}
            onViewAll={() => router.push("/tasks")}
            remainingCount={remainingCount}
          />
        ) : (
          <EmptyBlock
            title="Nothing due right now."
            subtitle="Add one small study step so future-you has a place to start."
            actionLabel="Plan a study step"
            onAction={() => router.push("/tasks")}
          />
        )}
      </StickyCard>

      {/* ─── 4. Two side-by-side context cards ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StickyCard
          tape="ash"
          delay={180}
        >
          <CardEyebrow>Your streak</CardEyebrow>
          <div className="mt-3 flex items-center gap-4">
            <div className="relative w-14 h-14 rounded-2xl bg-cream-100 dark:bg-cream-900/40 flex items-center justify-center flex-shrink-0">
              <svg
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-cream-600 dark:text-cream-400"
              >
                <path d="M12 2c2.5 4 5 7 5 11a5 5 0 1 1-10 0c0-4 2.5-7 5-11Z" />
                <path d="M12 16a2 2 0 0 0 2-2c0-1.5-1-2-2-3.5-1 1.5-2 2-2 3.5a2 2 0 0 0 2 2Z" />
              </svg>
              {streak > 0 && (
                <DoodleStar
                  className="absolute -top-1.5 -right-1.5 text-cream-500 dark:text-cream-400"
                  size={12}
                />
              )}
            </div>
            <div>
              <p className="text-3xl font-bold text-baltic-800 dark:text-baltic-100 leading-none tabular-nums">
                {streak}
              </p>
              <p className="text-xs text-steel-500 dark:text-steel-400 mt-1">
                {streak === 0
                  ? "Start with one focus block today."
                  : streak === 1
                  ? "day in a row. A small win counts."
                  : `days in a row. Keep the chain gentle.`}
              </p>
            </div>
          </div>
        </StickyCard>

        <StickyCard
          tape="lavender"
          delay={240}
        >
          <CardEyebrow>Pick up where you left off</CardEyebrow>
          {lastSession ? (
            <LastSessionBlock
              session={lastSession}
              subject={getSubject(lastSession.subject)}
              onContinue={() => router.push("/focus")}
              onViewJournal={() => router.push("/journal")}
            />
          ) : (
            <div className="mt-3">
              <p className="text-sm text-steel-500 dark:text-steel-400">
                No sessions yet. Your first one will live here.
              </p>
              <button
                onClick={() => router.push("/focus")}
                className="press mt-3 text-xs font-semibold text-baltic-600 dark:text-baltic-400 hover:text-baltic-800 dark:hover:text-baltic-200 transition-colors"
              >
                Start your first session →
              </button>
            </div>
          )}
        </StickyCard>
      </div>

      {/* Margin scribble at the bottom — small handwritten reassurance */}
      <p className="mt-8 text-right font-script text-lg text-steel-400 dark:text-steel-500 select-none">
        small steps, every day —
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   STICKY-NOTE CARD — paper, washi tape, optional accessory
   ───────────────────────────────────────────────────────────── */

type TapeColor = "cream" | "baltic" | "ash" | "lavender";

function FocusStickyNote({
  children,
  delay = 0,
}: {
  children: ReactNode;
  delay?: number;
}) {
  return (
    <div
      className="focus-sticky-note sticky-enter p-6 sm:p-7"
      style={{ "--delay": `${delay}ms` } as CSSProperties}
    >
      <div className="relative z-10">{children}</div>
    </div>
  );
}

function StickyCard({
  children,
  tape = "cream",
  delay = 0,
  paperclip = false,
  tools = true,
  className,
}: {
  children: ReactNode;
  tape?: TapeColor;
  delay?: number;
  paperclip?: boolean;
  tools?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "paper-card sticky-enter px-6 pt-9 pb-6 border border-lavender-200/60 dark:border-lavender-800/60",
        className
      )}
      style={
        {
          "--delay": `${delay}ms`,
        } as CSSProperties
      }
    >
      {/* Washi tape strip — slightly rotated, off-center for authenticity */}
      <div
        aria-hidden
        className={cn("washi-tape", `washi-${tape}`)}
        style={{
          width: "5.8rem",
          top: "-0.62rem",
          left: "1.75rem",
          transform: "rotate(-3.5deg)",
        }}
      />
      {paperclip && (
        <PaperclipDoodle className="absolute -top-2 right-5 z-20 text-baltic-500/70 dark:text-baltic-200/55" />
      )}
      {tools && (
        <StudyToolDoodles className="pointer-events-none absolute bottom-3 right-3 z-[1] text-cream-600/25 dark:text-cream-300/20" />
      )}

      <div className="relative z-10">{children}</div>
    </div>
  );
}

/* Card eyebrow — small uppercase tab */
function CardEyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-steel-500 dark:text-steel-400">
      {children}
    </p>
  );
}

/* ─────────────────────────────────────────────────────────────
   FOCUS SUMMARY
   ───────────────────────────────────────────────────────────── */

function FocusSummary({
  focusPct,
  todayMinutes,
  dailyGoal,
  minutesToGoal,
}: {
  focusPct: number;
  todayMinutes: number;
  dailyGoal: number;
  minutesToGoal: number;
}) {
  const isDone = focusPct >= 100;
  const helperText = isDone
    ? "Goal met. Nice work."
    : todayMinutes === 0
    ? "Try one small focus block."
    : `${formatTime(minutesToGoal)} left today.`;

  return (
    <div className="study-progress-note mx-auto w-full max-w-[13.5rem] text-center">
      <p className="font-script text-lg leading-none text-cream-700 dark:text-cream-300">
        today's focus
      </p>
      <p className="mt-2 text-4xl font-bold tabular-nums tracking-tight text-baltic-800 dark:text-baltic-100">
        {focusPct}%
      </p>
      <div className="mt-3 h-2 rounded-full bg-white/80 dark:bg-lavender-900/70 overflow-hidden">
        <div
          className="h-full rounded-full bg-baltic-600 dark:bg-baltic-400"
          style={{
            width: `${focusPct}%`,
            transition: "width 700ms var(--ease-out)",
          }}
        />
      </div>
      <p className="mt-3 text-xs text-steel-500 dark:text-steel-400">
        <span className="font-semibold tabular-nums text-baltic-700 dark:text-baltic-300">
          {formatTime(todayMinutes)}
        </span>{" "}
        done of{" "}
        <span className="font-semibold tabular-nums text-baltic-700 dark:text-baltic-300">
          {formatTime(dailyGoal)}
        </span>
      </p>
      <p className="mt-2 text-xs font-semibold text-ash-700 dark:text-ash-300">
        {helperText}
      </p>
    </div>
  );
}

/* Doodles: tiny hand-drawn SVG accents */
function PaperclipDoodle({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      width="31"
      height="38"
      viewBox="0 0 31 38"
      fill="none"
      className={className}
    >
      <path
        d="M20.5 9.5v17.2c0 5.4-3.4 8.8-8.2 8.8s-8.2-3.4-8.2-8.8V10.8c0-5 3.1-8.3 7.3-8.3s7.3 3.3 7.3 8.3v14.7c0 3.1-2 5.2-4.7 5.2s-4.7-2.1-4.7-5.2V12"
        stroke="currentColor"
        strokeWidth="2.15"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ScribbleUnderline({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      width="120"
      height="10"
      viewBox="0 0 120 10"
      fill="none"
      className={cn("doodle-draw", className)}
      style={{ "--doodle-len": "150" } as CSSProperties}
    >
      <path
        d="M2 6 C 18 2, 35 9, 52 4 S 86 8, 102 3 S 116 6, 118 5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

function DoodleArrow({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      width="22"
      height="34"
      viewBox="0 0 22 34"
      fill="none"
      className={cn("doodle-draw", className)}
      style={{ "--doodle-len": "60" } as CSSProperties}
    >
      <path
        d="M11 2 C 13 8, 9 14, 11 22 M5 17 L11 24 L17 17"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

function StudyToolDoodles({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      width="118"
      height="44"
      viewBox="0 0 118 44"
      fill="none"
      className={className}
    >
      <g transform="rotate(-18 36 24)">
        <path
          d="M12 19 H58 L69 24 L58 29 H12 Z"
          fill="currentColor"
          opacity="0.12"
        />
        <path
          d="M12 19 H58 L69 24 L58 29 H12 Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path
          d="M58 19 L69 24 L58 29"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path
          d="M9 19 H17 V29 H9 Z"
          fill="currentColor"
          opacity="0.18"
        />
        <path
          d="M17 19 V29 M54 19 V29"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </g>
      <g transform="rotate(5 88 25)">
        <path
          d="M74 14 H110 V28 H74 Z"
          fill="currentColor"
          opacity="0.10"
        />
        <path
          d="M74 14 H110 V28 H74 Z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
        <path
          d="M80 14 V20 M86 14 V18 M92 14 V22 M98 14 V18 M104 14 V20"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}

function DoodleStar({
  className,
  size = 14,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      aria-hidden
      width={size}
      height={size}
      viewBox="0 0 14 14"
      fill="none"
      className={className}
    >
      <path
        d="M7 1 L8.5 5 L13 5.5 L9.5 8.5 L10.5 13 L7 10.5 L3.5 13 L4.5 8.5 L1 5.5 L5.5 5 Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="0.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────
   CONTENT BLOCKS
   ───────────────────────────────────────────────────────────── */

function NextTaskBlock({
  task,
  subject,
  onComplete,
  onFocus,
  onViewAll,
  remainingCount,
}: {
  task: { id: string; title: string; subject: string; dueDate: string };
  subject: { label: string; color: string } | undefined;
  onComplete: () => void;
  onFocus: () => void;
  onViewAll: () => void;
  remainingCount: number;
}) {
  const color = subject?.color || "#60729f";
  const overdue = isOverdue(task.dueDate);

  return (
    <div className="mt-3">
      <div className="flex items-start gap-4">
        <div
          className="w-1 self-stretch rounded-full flex-shrink-0 mt-1"
          style={{ backgroundColor: color }}
        />
        <div className="flex-1 min-w-0">
          <p className="text-xl font-bold text-baltic-800 dark:text-baltic-100 leading-snug">
            {task.title}
          </p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1.5 text-xs text-steel-500 dark:text-steel-400">
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: color }}
              />
              {subject?.label || task.subject}
            </span>
            <span className="text-steel-300 dark:text-steel-600">·</span>
            <span
              className={cn(
                "text-xs font-medium",
                overdue
                  ? "text-red-500"
                  : "text-steel-500 dark:text-steel-400"
              )}
            >
              {overdue ? "Overdue" : `Due ${formatDate(task.dueDate)}`}
            </span>
          </div>
        </div>
      </div>

      <p className="mt-4 text-sm text-steel-500 dark:text-steel-400">
        <span className="font-script text-lg text-ash-700 dark:text-ash-300">
          tiny next step:
        </span>{" "}
        open a focus block, work until the timer ends, then come back to mark it done.
      </p>

      <div className="mt-5 flex items-center gap-2 flex-wrap">
        <button
          onClick={onFocus}
          className="press inline-flex items-center gap-2 px-4 py-2 rounded-full bg-baltic-700 dark:bg-baltic-500 text-white text-xs font-semibold hover:bg-baltic-800 dark:hover:bg-baltic-400 focus:outline-none focus:ring-2 focus:ring-baltic-400 focus:ring-offset-2 dark:focus:ring-offset-baltic-950"
          style={{ transition: "transform 160ms var(--ease-out), background-color 160ms ease" }}
        >
          Start a focus block
          <span className="text-sm leading-none">→</span>
        </button>
        <button
          onClick={onComplete}
          className="press inline-flex items-center gap-2 px-4 py-2 rounded-full border border-lavender-200 dark:border-lavender-700 text-baltic-700 dark:text-baltic-300 text-xs font-semibold hover:bg-baltic-50 dark:hover:bg-baltic-900/40 focus:outline-none focus:ring-2 focus:ring-baltic-400 focus:ring-offset-2 dark:focus:ring-offset-baltic-950"
          style={{ transition: "transform 160ms var(--ease-out), background-color 160ms ease" }}
        >
          <svg
            width="11"
            height="11"
            viewBox="0 0 10 10"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M2 5l2.5 2.5L8 3" />
          </svg>
          Mark done
        </button>
      </div>

      {remainingCount > 0 && (
        <div className="mt-5 pt-4 border-t border-dashed border-lavender-200 dark:border-lavender-800">
          <button
            onClick={onViewAll}
            className="press text-xs text-steel-500 dark:text-steel-400 hover:text-baltic-700 dark:hover:text-baltic-300 transition-colors"
          >
            <span className="font-semibold tabular-nums">{remainingCount}</span>{" "}
            more on your list →
          </button>
        </div>
      )}
    </div>
  );
}

function LastSessionBlock({
  session,
  subject,
  onContinue,
  onViewJournal,
}: {
  session: {
    id: string;
    subject: string;
    duration: number;
    completedAt: string;
  };
  subject: { label: string; color: string } | undefined;
  onContinue: () => void;
  onViewJournal: () => void;
}) {
  const color = subject?.color || "#60729f";
  const date = new Date(session.completedAt);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  const whenLabel = isToday
    ? "Earlier today"
    : isYesterday
    ? "Yesterday"
    : date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const timeLabel = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className="mt-3">
      <div className="flex items-center gap-3">
        <div
          className="w-1 self-stretch rounded-full flex-shrink-0"
          style={{ backgroundColor: color }}
        />
        <div className="flex-1 min-w-0">
          <p className="text-base font-bold text-baltic-800 dark:text-baltic-100 truncate">
            {subject?.label || session.subject}
          </p>
          <p className="text-xs text-steel-500 dark:text-steel-400 mt-0.5">
            {formatTime(session.duration)} · {whenLabel} at {timeLabel}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <button
          onClick={onContinue}
          className="press inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-baltic-700 dark:bg-baltic-500 text-white text-xs font-semibold hover:bg-baltic-800 dark:hover:bg-baltic-400 focus:outline-none focus:ring-2 focus:ring-baltic-400 focus:ring-offset-2 dark:focus:ring-offset-baltic-950"
          style={{ transition: "transform 160ms var(--ease-out), background-color 160ms ease" }}
        >
          Continue
          <span className="text-sm leading-none">→</span>
        </button>
        <button
          onClick={onViewJournal}
          className="press text-xs font-semibold text-steel-500 dark:text-steel-400 hover:text-baltic-700 dark:hover:text-baltic-300 transition-colors px-2"
        >
          See journal
        </button>
      </div>
    </div>
  );
}

function EmptyBlock({
  title,
  subtitle,
  actionLabel,
  onAction,
}: {
  title: string;
  subtitle: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="mt-3 py-2">
      <p className="text-xl font-bold text-baltic-800 dark:text-baltic-100">
        {title}
      </p>
      <p className="text-xs text-steel-500 dark:text-steel-400 italic mt-1">
        {subtitle}
      </p>
      <button
        onClick={onAction}
        className="press mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-baltic-700 dark:bg-baltic-500 text-white text-xs font-semibold hover:bg-baltic-800 dark:hover:bg-baltic-400 focus:outline-none focus:ring-2 focus:ring-baltic-400 focus:ring-offset-2 dark:focus:ring-offset-baltic-950"
        style={{ transition: "transform 160ms var(--ease-out), background-color 160ms ease" }}
      >
        {actionLabel}
        <span className="text-sm leading-none">→</span>
      </button>
    </div>
  );
}
