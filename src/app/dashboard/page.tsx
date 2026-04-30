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

      {/* ─── 2. Your aim today — primary sticky note ─── */}
      <StickyCard
        tape="cream"
        tilt="-0.4deg"
        delay={60}
        accessory="paperclip"
        className="mb-7 paper-card-hover"
      >
        <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6 md:gap-8 items-center">
          <TargetRing
            focusPct={focusPct}
            todayMinutes={todayMinutes}
            dailyGoal={dailyGoal}
          />

          {/* Title + guidance + CTA */}
          <div className="text-center md:text-left">
            <CardEyebrow>Your aim today</CardEyebrow>
            <p className="mt-2 text-2xl font-bold text-baltic-800 dark:text-baltic-100 leading-snug">
              {guidance.lead}
              <span className="highlighter">{guidance.accent}</span>
              {guidance.tail}
            </p>

            {/* Progress bar with anchors */}
            <div className="mt-4">
              <div className="h-2 rounded-full bg-lavender-100 dark:bg-lavender-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-baltic-600 dark:bg-baltic-400"
                  style={{
                    width: `${focusPct}%`,
                    transition: "width 700ms var(--ease-out)",
                  }}
                />
              </div>
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-steel-400">
                  Start
                </span>
                <span className="text-[10px] font-bold text-baltic-600 dark:text-baltic-400 tabular-nums">
                  {focusPct}%
                </span>
                <span className="text-[10px] font-mono uppercase tracking-wider text-steel-400">
                  Goal
                </span>
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={() => router.push("/focus")}
              className="press mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-baltic-700 dark:bg-baltic-500 text-white text-sm font-semibold hover:bg-baltic-800 dark:hover:bg-baltic-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-baltic-400 focus:ring-offset-2 dark:focus:ring-offset-baltic-950"
              style={{ transition: "transform 160ms var(--ease-out), background-color 160ms ease" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-cream-300 animate-pulse" />
              {todayMinutes === 0 ? "Begin a focus session" : "Continue focusing"}
              <span className="text-base leading-none">→</span>
            </button>
          </div>
        </div>
      </StickyCard>

      {/* ─── Hand-drawn pointer arrow ─── */}
      <div
        className="flex justify-center mb-4 sticky-enter"
        style={{ "--delay": "180ms" } as CSSProperties}
      >
        <div className="flex flex-col items-center text-steel-400 dark:text-steel-500">
          <span className="font-script text-base text-cream-700 dark:text-cream-300 -mb-0.5">
            keep going
          </span>
          <DoodleArrow className="text-baltic-400 dark:text-baltic-500" />
        </div>
      </div>

      {/* ─── 3. Next up — guided task sticky note ─── */}
      <StickyCard
        tape="baltic"
        tilt="0.5deg"
        delay={120}
        accessory="thumbtack"
        className="mb-7 paper-card-hover"
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
            title="Nothing on your plate."
            subtitle="A clear list is a fine place to begin."
            actionLabel="Add your first task"
            onAction={() => router.push("/tasks")}
          />
        )}
      </StickyCard>

      {/* ─── 4. Two side-by-side context cards ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StickyCard
          tape="ash"
          tilt="-0.6deg"
          delay={180}
          className="paper-card-hover"
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
                  ? "Start one today."
                  : streak === 1
                  ? "day in a row. Keep it going."
                  : `days in a row. Don't break it today.`}
              </p>
            </div>
          </div>
        </StickyCard>

        <StickyCard
          tape="lavender"
          tilt="0.3deg"
          delay={240}
          className="paper-card-hover"
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
type Accessory = "paperclip" | "thumbtack" | "none";

function StickyCard({
  children,
  tape = "cream",
  tilt = "0deg",
  delay = 0,
  accessory = "none",
  className,
}: {
  children: ReactNode;
  tape?: TapeColor;
  tilt?: string;
  delay?: number;
  accessory?: Accessory;
  className?: string;
}) {
  const tiltDegrees = Number.parseFloat(tilt);
  const hoverTilt = Number.isFinite(tiltDegrees)
    ? `${tiltDegrees + (tiltDegrees >= 0 ? 0.38 : -0.38)}deg`
    : tilt;

  return (
    <div
      className={cn(
        "paper-card sticky-enter px-6 pt-10 pb-6 border border-lavender-200/60 dark:border-lavender-800/60",
        className
      )}
      style={
        {
          "--tilt": tilt,
          "--hover-tilt": hoverTilt,
          "--delay": `${delay}ms`,
          "--idle-delay": `${delay + 900}ms`,
          "--idle-duration": `${8 + delay / 1000}s`,
        } as CSSProperties
      }
    >
      {/* Washi tape cluster — torn, translucent, and anchored off-center */}
      <div aria-hidden className={cn("washi-cluster", `washi-${tape}`)}>
        <span className="washi-tape washi-tape-main" />
        <span className="washi-tape washi-tape-tab" />
      </div>

      {/* Optional accessory: paperclip top-right or thumbtack top-right */}
      {accessory === "paperclip" && <Paperclip />}
      {accessory === "thumbtack" && <Thumbtack />}

      <div className="relative z-[1]">{children}</div>
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

function TargetRing({
  focusPct,
  todayMinutes,
  dailyGoal,
}: {
  focusPct: number;
  todayMinutes: number;
  dailyGoal: number;
}) {
  const center = 80;
  const radius = 58;
  const progressAngle = -90 + (focusPct / 100) * 360;
  const marker = getPolarPoint(center, center, radius, progressAngle);

  return (
    <div className="target-ring-wrap relative mx-auto md:mx-0">
      <div className="absolute inset-0 -m-4 rounded-full bg-baltic-100/45 dark:bg-baltic-800/25 blur-xl" />
      <svg
        viewBox="0 0 160 160"
        className="target-ring relative w-48 h-48"
        aria-label={`${focusPct} percent of daily goal complete`}
      >
        <defs>
          <filter
            id="target-ink-wobble"
            x="-12%"
            y="-12%"
            width="124%"
            height="124%"
            colorInterpolationFilters="sRGB"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.035"
              numOctaves="1"
              seed="6"
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="0.28"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>

        <circle
          cx={center}
          cy={center}
          r="70"
          stroke="currentColor"
          className="text-lavender-300/80 dark:text-lavender-700/80"
          strokeWidth="1.4"
          strokeDasharray="0.5 6"
          strokeLinecap="round"
          fill="none"
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke="currentColor"
          className="text-lavender-300 dark:text-lavender-700"
          strokeWidth="2"
          strokeDasharray="2 7"
          strokeLinecap="round"
          fill="none"
          filter="url(#target-ink-wobble)"
        />
        <circle
          cx={center}
          cy={center}
          r="43"
          stroke="currentColor"
          className="text-lavender-300/70 dark:text-lavender-700/70"
          strokeWidth="1.2"
          strokeDasharray="1 6"
          strokeLinecap="round"
          fill="none"
        />
        <circle
          cx={center}
          cy={center}
          r="20"
          stroke="currentColor"
          className="text-cream-500/70 dark:text-cream-400/45"
          strokeWidth="1.4"
          strokeDasharray="1.5 5"
          strokeLinecap="round"
          fill="none"
        />

        <g
          stroke="currentColor"
          className="text-baltic-500/55 dark:text-baltic-400/55"
          strokeWidth="1.8"
          strokeLinecap="round"
        >
          <path d="M80 7.5 L80 18" />
          <path d="M80 142 L80 152.5" />
          <path d="M7.5 80 L18 80" />
          <path d="M142 80 L152.5 80" />
        </g>

        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke="currentColor"
          className="target-progress-stroke text-baltic-600 dark:text-baltic-400"
          strokeWidth="8"
          strokeLinecap="round"
          fill="none"
          pathLength={100}
          strokeDasharray="100"
          strokeDashoffset={100 - focusPct}
          transform={`rotate(-90 ${center} ${center})`}
          filter="url(#target-ink-wobble)"
          style={{ transition: "stroke-dashoffset 760ms var(--ease-out)" }}
        />
        <circle
          cx={center}
          cy={center}
          r="4"
          className="fill-baltic-700 dark:fill-baltic-300"
        />
        <circle
          cx={center}
          cy={center}
          r="8"
          stroke="currentColor"
          className="text-baltic-600/25 dark:text-baltic-300/25"
          strokeWidth="1"
          fill="none"
        />

        {focusPct > 0 && (
          <g
            transform={`translate(${marker.x} ${marker.y}) rotate(${
              progressAngle + 12
            })`}
            className="target-pencil-mark"
          >
            <path
              d="M-5 0.5 C-2.5 -1, 2 -1, 5 0.5"
              stroke="currentColor"
              className="text-cream-600 dark:text-cream-300"
              strokeWidth="2.4"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M-3.5 2.5 L3.5 2.5"
              stroke="currentColor"
              className="text-baltic-700/45 dark:text-baltic-200/45"
              strokeWidth="1"
              strokeLinecap="round"
              fill="none"
            />
          </g>
        )}

        <text
          x={center}
          y="73"
          textAnchor="middle"
          className="fill-baltic-800 dark:fill-baltic-100"
          style={{
            fontSize: "26px",
            fontWeight: 800,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {focusPct}%
        </text>
        <path
          d="M63 82 C70 79, 78 84, 87 81 S99 82, 101 80"
          stroke="currentColor"
          className="text-cream-500/85 dark:text-cream-400/60"
          strokeWidth="2.2"
          strokeLinecap="round"
          fill="none"
        />
        <text
          x={center}
          y="102"
          textAnchor="middle"
          className="fill-steel-500 dark:fill-steel-400"
          style={{
            fontSize: "9.5px",
            fontWeight: 700,
            letterSpacing: "1.2px",
            textTransform: "uppercase",
          }}
        >
          {formatTime(todayMinutes)} / {formatTime(dailyGoal)}
        </text>
      </svg>
    </div>
  );
}

function getPolarPoint(cx: number, cy: number, radius: number, angle: number) {
  const radians = (angle * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(radians),
    y: cy + radius * Math.sin(radians),
  };
}

/* ─────────────────────────────────────────────────────────────
   DOODLES — hand-drawn SVG accents
   ───────────────────────────────────────────────────────────── */

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

function Paperclip() {
  return (
    <svg
      aria-hidden
      className="paperclip-accessory absolute -top-5 right-5 pointer-events-none"
      width="34"
      height="48"
      viewBox="0 0 34 48"
      fill="none"
    >
      <defs>
        <linearGradient
          id="paperclip-metal"
          x1="6"
          y1="4"
          x2="28"
          y2="44"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#f7f9fc" />
          <stop offset="0.34" stopColor="#b9c0cd" />
          <stop offset="0.67" stopColor="#eef2f7" />
          <stop offset="1" stopColor="#8f98aa" />
        </linearGradient>
      </defs>
      <path
        d="M18 4.8 C 11.4 4.8, 7 9.5, 7 16.1 L 7 35.5 C 7 41.3, 11.3 44.6, 16.8 44.6 C 22.6 44.6, 27 40.8, 27 35.2 L 27 14.8 C 27 10.6, 23.8 7.8, 19.9 7.8 C 15.8 7.8, 12.7 10.8, 12.7 15.1 L 12.7 34.2 C 12.7 37.1, 14.6 38.8, 17.1 38.8 C 19.7 38.8, 21.4 36.9, 21.4 34.2 L 21.4 16.6"
        stroke="#1f2937"
        strokeOpacity="0.18"
        strokeWidth="6"
        strokeLinecap="round"
        transform="translate(1 1.5)"
      />
      <path
        d="M18 4.8 C 11.4 4.8, 7 9.5, 7 16.1 L 7 35.5 C 7 41.3, 11.3 44.6, 16.8 44.6 C 22.6 44.6, 27 40.8, 27 35.2 L 27 14.8 C 27 10.6, 23.8 7.8, 19.9 7.8 C 15.8 7.8, 12.7 10.8, 12.7 15.1 L 12.7 34.2 C 12.7 37.1, 14.6 38.8, 17.1 38.8 C 19.7 38.8, 21.4 36.9, 21.4 34.2 L 21.4 16.6"
        stroke="url(#paperclip-metal)"
        strokeWidth="4.3"
        strokeLinecap="round"
      />
      <path
        className="paperclip-glint"
        d="M13.5 9.5 C 9.8 12.1, 9.2 15.6, 9.2 20.1 L 9.2 34.4"
        stroke="#ffffff"
        strokeOpacity="0.72"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Thumbtack() {
  return (
    <svg
      aria-hidden
      className="thumbtack-accessory absolute -top-5 right-5 select-none pointer-events-none"
      width="36"
      height="38"
      viewBox="0 0 36 38"
      fill="none"
    >
      <defs>
        <radialGradient
          id="thumbtack-dome"
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(14 11) rotate(52) scale(15 15)"
        >
          <stop stopColor="#f5f7cf" />
          <stop offset="0.42" stopColor="#c7ce64" />
          <stop offset="1" stopColor="#7c842d" />
        </radialGradient>
        <linearGradient
          id="thumbtack-pin"
          x1="13"
          y1="19"
          x2="23"
          y2="34"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#f7f9fc" />
          <stop offset="0.54" stopColor="#a8b0bd" />
          <stop offset="1" stopColor="#6f7787" />
        </linearGradient>
      </defs>
      <ellipse cx="19" cy="31" rx="9.5" ry="3.5" fill="#262d40" opacity="0.16" />
      <path
        d="M17.2 20.2 L23.6 31.4 L20.1 33.4 L14.7 21.2 Z"
        fill="url(#thumbtack-pin)"
      />
      <path
        d="M6.8 15.6 C 6.8 9.3 11.7 4.9 18.1 4.9 C 24.5 4.9 29.2 9.3 29.2 15.6 C 29.2 21.6 24.4 25.2 18.1 25.2 C 11.8 25.2 6.8 21.6 6.8 15.6 Z"
        fill="url(#thumbtack-dome)"
        stroke="#687021"
        strokeWidth="0.9"
      />
      <path
        d="M9.8 20.1 C 12.4 23.2 23.3 23.3 26.2 19.8"
        stroke="#5e641d"
        strokeOpacity="0.45"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <ellipse
        className="thumbtack-gleam"
        cx="14"
        cy="11.5"
        rx="3.4"
        ry="2.3"
        fill="#ffffff"
        opacity="0.74"
        transform="rotate(-24 14 11.5)"
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
          style={{ transition: "transform 160ms var(--ease-out), background-color 160ms ease" }}
        >
          Focus on this
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
