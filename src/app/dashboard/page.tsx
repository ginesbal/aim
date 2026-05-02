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

  const guidance = useMemo(() => {
    if (todayMinutes === 0) {
      return {
        lead: "Your goal is ",
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
        lead: "Almost there — just ",
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

      {/* Decorative blobs */}
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

      {/* Greeting */}
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
        <ScribbleUnderline className="ml-[8.5rem] mt-1 text-cream-500/70 dark:text-cream-400/50" />
      </header>

      {/* Today's aim — centerpiece, no accessory */}
      <StickyCard
        tape="cream"
        delay={60}
        accessory="none"
        className="mb-8"
      >
        <div className="grid grid-cols-1 md:grid-cols-[minmax(13rem,16rem)_1fr] gap-6 md:gap-10 items-center">
          <FocusTarget
            focusPct={focusPct}
            todayMinutes={todayMinutes}
            dailyGoal={dailyGoal}
            minutesToGoal={minutesToGoal}
          />

          <div className="text-center md:text-left">
            <CardEyebrow>Your aim today</CardEyebrow>
            <p className="mt-2 text-2xl font-bold text-baltic-800 dark:text-baltic-100 leading-snug">
              {guidance.lead}
              <span className="highlighter">{guidance.accent}</span>
              {guidance.tail}
            </p>
            <p className="mt-3 text-sm text-steel-500 dark:text-steel-400">
              Keep it simple: one timer, one task, then a real break.
            </p>

            <button
              onClick={() => router.push("/focus")}
              className="press mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-baltic-700 dark:bg-baltic-500 text-white text-sm font-semibold hover:bg-baltic-800 dark:hover:bg-baltic-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-baltic-400 focus:ring-offset-2 dark:focus:ring-offset-baltic-950"
              style={{
                transition:
                  "transform 160ms var(--ease-out), background-color 160ms ease",
              }}
            >
              {todayMinutes === 0
                ? "Begin a focus session"
                : "Continue focusing"}
              <span className="text-base leading-none">→</span>
            </button>
          </div>
        </div>
      </StickyCard>

      {/* Next up — clipped task */}
      <StickyCard
        tape="baltic"
        delay={120}
        accessory="paperclip"
        className="mb-8"
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

      {/* Streak + last session */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StickyCard
          tape="ash"
          delay={180}
          accessory="thumbtack"
          accessoryColor="cream"
        >
          <CardEyebrow>Your streak</CardEyebrow>
          <div className="mt-3 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-cream-100 dark:bg-cream-900/40 flex items-center justify-center flex-shrink-0">
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
          accessory="none"
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
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   STICKY CARD — flat panel, taped at the top, optional accessory
   ───────────────────────────────────────────────────────────── */

type TapeColor = "cream" | "baltic" | "ash" | "lavender";
type Accessory = "paperclip" | "thumbtack" | "none";
type AccessoryColor = "cream" | "baltic" | "ash";

function StickyCard({
  children,
  tape = "cream",
  delay = 0,
  accessory = "none",
  accessoryColor = "cream",
  className,
}: {
  children: ReactNode;
  tape?: TapeColor;
  delay?: number;
  accessory?: Accessory;
  accessoryColor?: AccessoryColor;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "paper-card sticky-enter relative px-6 pt-9 pb-6 border border-lavender-200/60 dark:border-lavender-800/60",
        className
      )}
      style={{ "--delay": `${delay}ms` } as CSSProperties}
    >
      {/* Two overlapping tape pieces near the top-left */}
      <WashiTape
        tape={tape}
        variant="a"
        rot={-7}
        style={{ width: "5.4rem", top: "-0.6rem", left: "1rem" }}
      />
      <WashiTape
        tape={tape}
        variant="b"
        rot={3.5}
        style={{ width: "3.2rem", top: "-0.45rem", left: "3.5rem" }}
      />

      {accessory === "paperclip" && (
        <Paperclip className="absolute -top-2.5 right-7" />
      )}
      {accessory === "thumbtack" && (
        <Thumbtack
          className="absolute -top-1.5 right-7"
          color={accessoryColor}
        />
      )}

      <div className="relative z-10">{children}</div>
    </div>
  );
}

function WashiTape({
  tape,
  variant,
  rot,
  style,
}: {
  tape: TapeColor;
  variant: "a" | "b";
  rot: number;
  style: CSSProperties;
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "washi-tape",
        `washi-${tape}`,
        variant === "a" ? "washi-torn-a" : "washi-torn-b"
      )}
      style={
        {
          ...style,
          "--tape-rot": `${rot}deg`,
        } as CSSProperties
      }
    />
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
   PAPERCLIP — two-tone metal stroke, drop shadow, hover glint
   ───────────────────────────────────────────────────────────── */

function Paperclip({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none", className)}
      style={{
        filter:
          "drop-shadow(0 1.5px 1.5px rgba(38, 45, 64, 0.22)) drop-shadow(0 0.5px 0 rgba(38, 45, 64, 0.10))",
        transform: "rotate(8deg)",
      }}
    >
      <svg
        width="22"
        height="32"
        viewBox="0 0 22 32"
        fill="none"
      >
        {/* Back — darker shadow stroke */}
        <path
          d="M7 30 L7 7 A4.2 4.2 0 0 1 15.4 7 L15.4 24 A2.8 2.8 0 0 1 9.8 24 L9.8 10"
          stroke="#7a8499"
          strokeWidth="2.6"
          strokeLinecap="round"
          fill="none"
        />
        {/* Front — lighter highlight stroke offset slightly */}
        <path
          d="M7 30 L7 7 A4.2 4.2 0 0 1 15.4 7 L15.4 24 A2.8 2.8 0 0 1 9.8 24 L9.8 10"
          stroke="#dde0e7"
          strokeWidth="0.9"
          strokeLinecap="round"
          fill="none"
          transform="translate(-0.5 -0.5)"
        />
        {/* Top catch-light */}
        <ellipse
          cx="11.2"
          cy="4.6"
          rx="2.6"
          ry="0.6"
          fill="white"
          opacity="0.55"
        />
      </svg>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   THUMBTACK — colored dome, gleam, pin-shaft hint, drop shadow
   ───────────────────────────────────────────────────────────── */

const TACK_FILLS: Record<AccessoryColor, { dome: string; rim: string }> = {
  cream: { dome: "#c7ce64", rim: "#8a8f3f" },
  baltic: { dome: "#60729f", rim: "#3e4c70" },
  ash: { dome: "#7a9477", rim: "#4f644f" },
};

function Thumbtack({
  className,
  color = "cream",
}: {
  className?: string;
  color?: AccessoryColor;
}) {
  const fill = TACK_FILLS[color];
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none", className)}
      style={{
        filter:
          "drop-shadow(0 2px 2px rgba(38, 45, 64, 0.28)) drop-shadow(0 0.5px 0 rgba(38, 45, 64, 0.12))",
      }}
    >
      <svg width="26" height="30" viewBox="0 0 26 30" fill="none">
        {/* Pin shaft — small triangle hint emerging from underneath */}
        <path d="M11.6 17 L13 23 L14.4 17 Z" fill="#9ba3b3" />
        <path
          d="M11.6 17 L13 23 L14.4 17 Z"
          stroke="#6b7488"
          strokeWidth="0.4"
          fill="none"
        />
        {/* Dome — main body */}
        <ellipse cx="13" cy="11" rx="9" ry="8" fill={fill.dome} />
        {/* Dome — darker bottom rim for volume */}
        <path
          d="M4.5 11 A9 8 0 0 0 21.5 11 A9 5 0 0 1 4.5 11 Z"
          fill={fill.rim}
          opacity="0.45"
        />
        {/* Soft inner shading on the right */}
        <ellipse
          cx="16.5"
          cy="12.5"
          rx="4"
          ry="5"
          fill="black"
          opacity="0.10"
        />
        {/* Primary catch-light */}
        <ellipse
          cx="9.4"
          cy="7.6"
          rx="3.2"
          ry="1.9"
          fill="white"
          opacity="0.6"
        />
        {/* Secondary tiny glint */}
        <circle cx="15.2" cy="8.4" r="0.8" fill="white" opacity="0.75" />
      </svg>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   FOCUS TARGET — the full "a" of aim. Bowl + tail silhouette
   pulled directly from the AimLogo paths; baltic fills from the
   bottom of the silhouette upward as focus minutes accrue, so
   the entire letter (bowl AND tail) paints itself in. The white
   counter dot sits in the bowl with the percentage inside.
   ───────────────────────────────────────────────────────────── */

// Geometry pulled directly from src/components/layout/AimLogo.tsx so the
// focus widget renders the same "a" the logo does.
const A_BOWL_CX = 241.5;
const A_BOWL_CY = 293.5;
const A_BOWL_R = 64.5;
const A_TAIL_PATH =
  "M305.782 288.417L306 290V356H233V279H302.256L305.782 288.417Z";
const A_COUNTER_CX = 242;
const A_COUNTER_CY = 294.5;
const A_COUNTER_R = 20;

// Square viewBox padded around the "a" silhouette (~6 units each side).
const A_VB_X = 170;
const A_VB_Y = 222;
const A_VB_SIZE = 142;
// Tight y-extent of the silhouette: bowl top (cy-r) to bowl bottom (cy+r).
const A_TOP = A_BOWL_CY - A_BOWL_R; // 229
const A_HEIGHT = 2 * A_BOWL_R; // 129

function FocusTarget({
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
              {/* Bowl */}
              <circle cx={A_BOWL_CX} cy={A_BOWL_CY} r={A_BOWL_R} />
              {/* Tail (right stem of the "a") */}
              <path d={A_TAIL_PATH} />
            </clipPath>
          </defs>

          <g clipPath="url(#aim-a-silhouette)">
            {/* Empty silhouette — ghost of the "a" waiting to be filled */}
            <rect
              x={A_VB_X}
              y={A_VB_Y}
              width={A_VB_SIZE}
              height={A_VB_SIZE}
              className="fill-lavender-200/55 dark:fill-lavender-800/40"
            />

            {/* Rising baltic — translates from below back into place.
                Sized exactly to the silhouette's y-extent so 50% reads as
                the bottom half, 100% as the full letter. */}
            <rect
              x={A_VB_X}
              y={A_TOP}
              width={A_VB_SIZE}
              height={A_HEIGHT}
              className="fill-baltic-700 dark:fill-baltic-400"
              style={{
                transform: `translateY(${100 - Math.max(0, Math.min(100, focusPct))}%)`,
                transformBox: "fill-box",
                transition: "transform 800ms var(--ease-out)",
              }}
            />
          </g>

          {/* Counter dot — exact logo geometry, drawn on top of the fill */}
          <circle
            cx={A_COUNTER_CX}
            cy={A_COUNTER_CY}
            r={A_COUNTER_R}
            className="fill-white dark:fill-baltic-900"
          />
        </svg>

        {/* Percentage label — positioned dead-center on the counter dot */}
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

      {/* Footer — minutes counter + status */}
      <p className="mt-4 text-xs text-steel-500 dark:text-steel-400">
        <span className="font-semibold tabular-nums text-baltic-700 dark:text-baltic-300">
          {formatTime(todayMinutes)}
        </span>{" "}
        of{" "}
        <span className="font-semibold tabular-nums text-baltic-700 dark:text-baltic-300">
          {formatTime(dailyGoal)}
        </span>
      </p>
      <p className="mt-1 text-xs font-semibold text-ash-700 dark:text-ash-300">
        {helperText}
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   DOODLES
   ───────────────────────────────────────────────────────────── */

function ScribbleUnderline({
  className,
  width = 120,
}: {
  className?: string;
  width?: number;
}) {
  const w = width;
  return (
    <svg
      aria-hidden
      width={w}
      height="10"
      viewBox="0 0 120 10"
      preserveAspectRatio="none"
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

      <div className="mt-5 flex items-center gap-2 flex-wrap">
        <button
          onClick={onFocus}
          className="press inline-flex items-center gap-2 px-4 py-2 rounded-full bg-baltic-700 dark:bg-baltic-500 text-white text-xs font-semibold hover:bg-baltic-800 dark:hover:bg-baltic-400 focus:outline-none focus:ring-2 focus:ring-baltic-400 focus:ring-offset-2 dark:focus:ring-offset-baltic-950"
          style={{
            transition:
              "transform 160ms var(--ease-out), background-color 160ms ease",
          }}
        >
          Start a focus block
          <span className="text-sm leading-none">→</span>
        </button>
        <button
          onClick={onComplete}
          className="press inline-flex items-center gap-2 px-4 py-2 rounded-full border border-lavender-200 dark:border-lavender-700 text-baltic-700 dark:text-baltic-300 text-xs font-semibold hover:bg-baltic-50 dark:hover:bg-baltic-900/40 focus:outline-none focus:ring-2 focus:ring-baltic-400 focus:ring-offset-2 dark:focus:ring-offset-baltic-950"
          style={{
            transition:
              "transform 160ms var(--ease-out), background-color 160ms ease",
          }}
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
          style={{
            transition:
              "transform 160ms var(--ease-out), background-color 160ms ease",
          }}
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
        style={{
          transition:
            "transform 160ms var(--ease-out), background-color 160ms ease",
        }}
      >
        {actionLabel}
        <span className="text-sm leading-none">→</span>
      </button>
    </div>
  );
}
