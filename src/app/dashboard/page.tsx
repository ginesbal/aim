"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
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
  parseLocalDate,
  projectedFinishTime,
  readableFill,
  cn,
} from "@/lib/utils";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import AimLogo from "@/components/layout/AimLogo";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import type { Task, UserSubject } from "@/lib/types";
import { loadLiveSession, type LiveSession } from "@/lib/liveSession";
import { DURATION_PRESETS } from "@/components/ui/DurationPicker";

/* Saved for later, not deleted: the weekday / date / streak chips above
   the greeting. They're hidden while the dashboard is refocused around
   starting a focus session; flip to true to bring them back. */
const SHOW_DAY_CHIPS = false;

const WELCOME_SKIPPED_KEY = "aim_welcome_skipped";

/* Tick the dashboard once a minute so the header date / weekday and any
   time-of-day-derived copy ("Hit your goal by 4:30 PM") stay current
   when the page is left open across day or hour boundaries. Cheap; the
   work inside is cached by useMemo. */
function useMinuteTick() {
  const [, force] = useState(0);
  useEffect(() => {
    const id = setInterval(() => force((n) => n + 1), 60_000);
    return () => clearInterval(id);
  }, []);
}

/* Defensive subject-label capitalization. Trusts user-entered case for
   labels like "iOS Development" or "C# basics" but lifts the first
   character when the entire label arrived lowercase (which happens when
   getSubject() falls back to the raw subject key on a data mismatch). */
function formatSubjectLabel(s: string | undefined | null) {
  if (!s) return "study";
  const first = s.charAt(0);
  if (first !== first.toLowerCase()) return s;
  return first.toUpperCase() + s.slice(1);
}

export default function DashboardPage() {
  const { name, isFirstVisit, dailyGoal, focusBlockMin, setName, setFocusBlockMin } =
    usePreferences();
  const { tasks } = useTasks();
  const { todayMinutes, streak, sessions } = useFocus();
  const { getSubject } = useSubjects();
  const router = useRouter();

  useMinuteTick();

  // The welcome dialog asks for a name but doesn't insist: "Skip for now"
  // (or Esc) is remembered, so it doesn't come back on every visit. The
  // name can still be set in Settings; until then the greeting says "there".
  const [showWelcome, setShowWelcome] = useState(
    () => isFirstVisit && !(typeof window !== "undefined" && window.localStorage.getItem(WELCOME_SKIPPED_KEY))
  );
  const [welcomeName, setWelcomeName] = useState("");
  const [welcomeError, setWelcomeError] = useState<string | null>(null);

  const firstName = name ? name.split(" ")[0] : "there";

  const pendingTasks = useMemo(
    () =>
      tasks
        .filter((t) => !t.completed)
        .sort(
          (a, b) =>
            parseLocalDate(a.dueDate).getTime() -
            parseLocalDate(b.dueDate).getTime()
        ),
    [tasks]
  );

  const nextTask = pendingTasks[0];
  const focusPct = Math.min(Math.round((todayMinutes / dailyGoal) * 100), 100);
  const minutesToGoal = Math.max(dailyGoal - todayMinutes, 0);

  // Today's sessions become the meter's segments: oldest at the bottom of
  // the "a", each band in its subject's colour.
  const segments = useMemo(() => {
    const todayKey = new Date().toDateString();
    return sessions
      .filter((s) => new Date(s.completedAt).toDateString() === todayKey)
      .sort(
        (a, b) =>
          new Date(a.completedAt).getTime() -
          new Date(b.completedAt).getTime()
      )
      .map((s) => ({
        id: s.id,
        minutes: s.duration,
        color: getSubject(s.subject)?.color ?? "#60729f",
        label: formatSubjectLabel(getSubject(s.subject)?.label ?? s.subject),
      }));
  }, [sessions, getSubject]);

  // Arriving from Focus after "Save session" (?logged=<id>): that session
  // gets its moment once — a line naming it and its band growing into
  // the "a". The param is dropped so a reload doesn't replay it. Also
  // notice a session still open in this tab (left mid-way), so the
  // launcher offers to return to it instead of starting another.
  const [justLoggedId, setJustLoggedId] = useState<string | null>(null);
  const [live, setLive] = useState<LiveSession | null>(null);
  useEffect(() => {
    const logged = new URLSearchParams(window.location.search).get("logged");
    if (logged) {
      setJustLoggedId(logged);
      window.history.replaceState(null, "", "/dashboard");
    }
    setLive(loadLiveSession());
  }, []);

  const justLogged = useMemo(() => {
    const s = justLoggedId ? sessions.find((x) => x.id === justLoggedId) : undefined;
    if (!s) return undefined;
    const sub = getSubject(s.subject);
    // The planner task this session finished, if "Mark done" was ticked:
    // matched the way Focus links them, by the session's task text.
    const done = s.task?.trim()
      ? tasks.find((t) => t.completed && t.title.slice(0, 60).trim() === s.task?.trim())
      : undefined;
    return {
      minutes: s.duration,
      label: formatSubjectLabel(sub?.label ?? s.subject),
      color: sub?.color ?? "#60729f",
      doneTitle: done?.title,
    };
  }, [justLoggedId, sessions, getSubject, tasks]);

  // The two tasks after the one the launcher offers, soonest due first.
  const afterThis = useMemo(
    () => pendingTasks.filter((t) => t.id !== nextTask?.id).slice(0, 2),
    [pendingTasks, nextTask]
  );

  // Focus, set up for a task. taskId lets Focus offer "Mark done" at the
  // end of the session; start=1 (the launcher's Begin) also starts the
  // timer on arrival.
  function focusHref(task: Task, start: boolean) {
    const params = new URLSearchParams({
      subject: getSubject(task.subject)?.label ?? task.subject,
      task: task.title,
      taskId: task.id,
      min: String(focusBlockMin),
    });
    if (start) params.set("start", "1");
    return `/focus?${params}`;
  }

  // Last 7 days of session activity → small dot trail on the streak chip.
  // Index 6 is today; earlier indexes are days ago.
  const last7 = useMemo(() => {
    if (!SHOW_DAY_CHIPS) return [];
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
    // Say what's missing instead of silently ignoring the click.
    if (!welcomeName.trim()) {
      setWelcomeError("Add a name so aim knows what to call you.");
      return;
    }
    setName(welcomeName.trim());
    setShowWelcome(false);
  }

  function skipWelcome() {
    window.localStorage.setItem(WELCOME_SKIPPED_KEY, "1");
    setShowWelcome(false);
  }

  // A session still open in this tab lives only in the tab's storage, so
  // closing the tab would lose it without a word. Ask first, as Focus does.
  useEffect(() => {
    if (!live) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [live]);

  return (
    // A narrower column than the app shell's: the headline is ~540px
    // wide, so at the full width the meter sat stranded across a gap and
    // each "After this" row's title and day were a screen-width apart.
    <div className="pb-4 mx-auto max-w-4xl">
      <Modal open={showWelcome} onClose={skipWelcome} width="sm" labelledBy="welcome-title">
        <div className="text-center py-2">
          <div className="flex justify-center mb-4">
            <AimLogo size="md" />
          </div>
          <h2 id="welcome-title" className="text-display text-baltic-800 dark:text-baltic-100 mb-1">
            Welcome to aim
          </h2>
          <p className="text-body text-balance text-steel-600 dark:text-steel-400 mb-5">
            A calm space to plan your studies and build focus habits.
          </p>
          <form onSubmit={handleWelcomeSubmit} noValidate className="space-y-3">
            <Input
              id="welcome-name"
              label="Your name"
              placeholder="What should we call you?"
              value={welcomeName}
              onChange={(e) => {
                setWelcomeName(e.target.value);
                setWelcomeError(null);
              }}
              error={welcomeError ?? undefined}
              autoFocus
              autoComplete="given-name"
              className="text-center"
            />
            <Button type="submit" pill className="w-full press">
              Get started
            </Button>
          </form>
          <button
            type="button"
            onClick={skipWelcome}
            className="tap-target mt-3 rounded-md px-1 text-sm font-medium text-steel-600 underline decoration-steel-300 underline-offset-2 hover:text-baltic-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-baltic-500"
          >
            Skip for now
          </button>
        </div>
      </Modal>

      {/* ── HEADER — greeting ── */}
      <header className="mb-5 sm:mb-8">
        {SHOW_DAY_CHIPS && (
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
        )}
        {/* A quiet greeting: the launcher sentence below is the page's
            headline, so the name no longer competes with it. */}
        <p className="text-xl font-semibold text-baltic-700 dark:text-baltic-200">
          {getGreeting()}, {firstName}
        </p>
      </header>

      {/* ── HERO — the launcher: "focus for 25m on <task>" + Begin ── */}
      <StickyCard className="mb-3">
        <HeroBody
          focusPct={focusPct}
          todayMinutes={todayMinutes}
          dailyGoal={dailyGoal}
          minutesToGoal={minutesToGoal}
          focusBlockMin={focusBlockMin}
          nextTask={nextTask}
          subject={nextTask ? getSubject(nextTask.subject) : undefined}
          hasAnySessions={sessions.length > 0}
          // Remounted when the welcome dialog closes, so the main button
          // takes focus then, the same as on any later arrival.
          key={showWelcome ? "welcome" : "ready"}
          focusPrimary={!showWelcome}
          segments={segments}
          newSegmentId={justLogged ? justLoggedId ?? undefined : undefined}
          justLogged={justLogged}
          live={live}
          liveSubject={live ? getSubject(live.subject) : undefined}
          onReturnToFocus={() => router.push("/focus")}
          onFocusBlank={() => router.push("/focus")}
          onSetLength={setFocusBlockMin}
          onFocus={() =>
            // Begin means begin: Focus opens set up for this task and
            // starts the timer (Focus strips start=1 so a reload won't
            // restart it).
            router.push(nextTask ? focusHref(nextTask, true) : "/focus")
          }
          onPlanStep={() => router.push("/tasks?new=1")}
          onEditGoal={() => router.push("/settings")}
        />
      </StickyCard>

      {/* ── AFTER THIS — the next two tasks, one click from focusing.
          Hidden while a session is still open: every row would lead
          back to that session anyway. ── */}
      {nextTask && !live && (
        <AfterThis
          tasks={afterThis}
          getSubject={getSubject}
          onFocusOn={(t) => router.push(focusHref(t, false))}
          onOpenAll={() => router.push("/tasks")}
        />
      )}
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
   HERO — the launcher. The Focus setup sentence, already filled
   in: "focus for 25m on <task>", with Caveat only on the
   connecting words (as on the Focus card) and Begin in the
   subject's colour. The "a" meter sits beside it as a gauge.
   Without a task to launch, it falls back to a plain headline
   and a way to add one.
   ───────────────────────────────────────────────────────────── */

function HeroBody({
  focusPct,
  todayMinutes,
  dailyGoal,
  minutesToGoal,
  focusBlockMin,
  nextTask,
  subject,
  hasAnySessions,
  focusPrimary,
  segments,
  newSegmentId,
  justLogged,
  live,
  liveSubject,
  onReturnToFocus,
  onFocus,
  onFocusBlank,
  onSetLength,
  onPlanStep,
  onEditGoal,
}: {
  focusPct: number;
  todayMinutes: number;
  dailyGoal: number;
  minutesToGoal: number;
  focusBlockMin: number;
  nextTask: Task | undefined;
  subject: UserSubject | undefined;
  hasAnySessions: boolean;
  /** The main button takes focus on arrival. Off while the welcome
      dialog is open, so it can't pull focus out from under it. */
  focusPrimary: boolean;
  segments: MeterSegment[];
  /** The session just saved on Focus, whose band grows into the "a". */
  newSegmentId?: string;
  justLogged?: { minutes: number; label: string; color: string; doneTitle?: string };
  /** A session still open in this tab (left mid-way on Focus). */
  live: LiveSession | null;
  liveSubject: UserSubject | undefined;
  onReturnToFocus: () => void;
  onFocus: () => void;
  /** Focus with nothing set up: pick a subject on the Focus card. */
  onFocusBlank: () => void;
  /** New default session length, from the menu in the sentence. */
  onSetLength: (minutes: number) => void;
  onPlanStep: () => void;
  onEditGoal: () => void;
}) {
  // The launcher's text column. The length menu's list renders here, not
  // inside the <h1>, so the heading still reads as one sentence.
  const columnRef = useRef<HTMLDivElement>(null);

  // Begin shows what it would add to the "a" while it's pointed at: on
  // hover, and on keyboard focus once the page has been used. Not on the
  // focus it takes on arrival, or the preview would stay up until
  // something else took focus.
  const [hoverBegin, setHoverBegin] = useState(false);
  const [focusBegin, setFocusBegin] = useState(false);
  const usedPage = useRef(false);
  useEffect(() => {
    const mark = () => {
      usedPage.current = true;
    };
    window.addEventListener("keydown", mark, { once: true });
    window.addEventListener("pointerdown", mark, { once: true });
    return () => {
      window.removeEventListener("keydown", mark);
      window.removeEventListener("pointerdown", mark);
    };
  }, []);
  const launching = Boolean(nextTask) && !live;

  const meter = (
    <FocusTarget
      focusPct={focusPct}
      todayMinutes={todayMinutes}
      dailyGoal={dailyGoal}
      segments={segments}
      newSegmentId={newSegmentId}
      justLogged={justLogged}
      firstUse={!hasAnySessions}
      nextMinutes={launching ? focusBlockMin : undefined}
      previewNext={launching && (hoverBegin || focusBegin)}
    />
  );

  // The quiet alternative to the main action: a session with no task.
  const focusBlank = (
    <button
      onClick={onFocusBlank}
      className="press tap-target rounded-md px-1 -mx-1 text-sm font-medium text-steel-600 dark:text-steel-400 underline decoration-steel-300 underline-offset-2 hover:text-baltic-700 dark:hover:text-baltic-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-baltic-500"
    >
      or focus without a task
    </button>
  );

  // Arriving from "Save session": for this one visit the headline is what
  // was just done (same shape as the other headlines), and the next task
  // steps back to a quiet line under it. "Done" first, "next" second.
  const loggedHeadline = justLogged && (
    <>
      <h1 id="launcher-headline" className="text-baltic-800 dark:text-baltic-100">
        <span className="block text-2xl font-semibold leading-tight">
          <span className="font-script text-[1.25em] text-baltic-500 dark:text-baltic-300 pr-1">just logged</span>
        </span>{" "}
        <span className="mt-1 block text-3xl sm:text-4xl font-bold tracking-tight leading-[1.12]">
          <span className="tabular-nums">{formatTime(justLogged.minutes)}</span> of {justLogged.label}
        </span>
      </h1>
      {/* The session that reached the day's goal is the day's biggest
          moment; it gets a line of its own here, not just the small
          status line further down. */}
      {todayMinutes >= dailyGoal && todayMinutes - justLogged.minutes < dailyGoal && (
        <p className="mt-3 text-base font-semibold text-baltic-700 dark:text-baltic-300">
          Today&apos;s <span className="tabular-nums">{formatTime(dailyGoal)}</span> goal is done.
        </p>
      )}
      {/* "Mark done" took effect: the task has left the launcher, so say
          where it went. */}
      {justLogged.doneTitle && (
        <p title={justLogged.doneTitle} className="mt-3 truncate text-sm text-steel-600 dark:text-steel-400">
          Marked done:{" "}
          <span className="font-semibold text-baltic-700 dark:text-baltic-300">{justLogged.doneTitle}</span>
        </p>
      )}
    </>
  );

  // ── A session is still open: offer the way back, not a new one ──
  if (live) {
    const label = formatSubjectLabel(liveSubject?.label ?? live.subject);
    const color = liveSubject?.color ?? "#60729f";
    // Clock time, like the rest of the dashboard. A running session whose
    // end time has passed (the page re-renders each minute) is finished.
    const finished =
      live.state === "done" || live.state === "reflecting" ||
      (live.state === "running" && live.endTime <= Date.now());
    const lead = finished ? "just finished" : live.state === "paused" ? "paused on" : "still focusing on";
    // The headline already names the state; this line adds only what's new.
    let detail: ReactNode;
    if (finished) {
      detail = "Waiting to be saved";
    } else if (live.state === "paused") {
      detail = (
        <>
          <span className="font-semibold tabular-nums text-baltic-700 dark:text-baltic-300">
            {formatTime(Math.max(1, Math.floor(live.secondsLeft / 60)))}
          </span>{" "}
          left
        </>
      );
    } else {
      const ends = new Date(live.endTime).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
      detail = (
        <>
          Ends at{" "}
          <span className="whitespace-nowrap font-semibold tabular-nums text-baltic-700 dark:text-baltic-300">{ends}</span>
        </>
      );
    }
    return (
      <div className="grid gap-6 lg:gap-8 items-center grid-cols-1 lg:grid-cols-[minmax(0,1fr)_11rem]">
        <div className="min-w-0">
          <h1 id="launcher-headline" className="text-baltic-800 dark:text-baltic-100">
            <span className="block text-2xl font-semibold leading-tight">
              <span className="font-script text-[1.25em] text-baltic-500 dark:text-baltic-300 pr-1">{lead}</span>
            </span>{" "}
            <span
              title={live.task.trim() || label}
              className="mt-1 text-3xl sm:text-4xl font-bold tracking-tight leading-[1.12] line-clamp-3 sm:line-clamp-2"
            >
              {live.task.trim() || label}
            </span>
          </h1>
          <p className="mt-3 flex items-center gap-2 text-sm text-steel-600 dark:text-steel-400">
            <span aria-hidden className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
            <span>{detail}</span>
          </p>
          <div className="mt-7">
            <button
              onClick={onReturnToFocus}
              autoFocus={focusPrimary}
              aria-describedby="launcher-headline"
              style={{ backgroundColor: readableFill(color) }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 text-[15px] font-medium text-white hover:brightness-[0.94] active:scale-[0.98] shadow-[0_6px_16px_-8px_rgba(38,45,64,0.35)] focus:outline-none focus-visible:ring-2 focus-visible:ring-baltic-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-baltic-950 transition-[filter,transform] duration-150 ease-out"
            >
              {/* No ▶ here: returning doesn't start anything, and ▶ means
                  "starts now" everywhere else. */}
              {finished ? "Finish saving" : "Return to focus"}
            </button>
          </div>
        </div>
        {meter}
      </div>
    );
  }

  // ── No task to launch: teach the next step instead ──
  if (!nextTask) {
    const fresh = !hasAnySessions;
    return (
      <div className="grid gap-8 items-center grid-cols-1 lg:grid-cols-[minmax(0,1fr)_11rem]">
        <div>
          {loggedHeadline ?? (
            <h1 id="launcher-headline" className="text-3xl font-bold tracking-tight text-baltic-800 dark:text-baltic-100 leading-tight">
              {fresh ? (
                <>
                  Set your <span className="highlighter">first aim</span>
                </>
              ) : (
                "All caught up"
              )}
            </h1>
          )}
          <p className="mt-2 text-sm text-steel-600 dark:text-steel-400">
            {fresh
              ? "Add a task and your first focus session is one click away."
              : "Plan the next task and it will be waiting here."}
          </p>
          <button
            onClick={onPlanStep}
            autoFocus={focusPrimary}
            aria-describedby="launcher-headline"
            className="press mt-6 inline-flex items-center gap-2 rounded-full px-6 py-3 bg-baltic-700 dark:bg-baltic-500 text-white text-[15px] font-medium hover:bg-baltic-800 dark:hover:bg-baltic-400 shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-baltic-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-baltic-950"
            style={{ transition: "transform 160ms var(--ease-out), background-color 160ms ease" }}
          >
            {fresh ? "Add your first task" : "Add a task"}
          </button>
          <div className="mt-4">{focusBlank}</div>
        </div>
        {meter}
      </div>
    );
  }

  // ── The launcher ──
  const subjectLabel = formatSubjectLabel(subject?.label ?? nextTask.subject);
  const fill = readableFill(subject?.color ?? "#60729f");
  const overdue = isOverdue(nextTask.dueDate);
  const day = dayLabel(nextTask.dueDate);
  const due = overdue
    ? "overdue"
    : `due ${day === "Today" || day === "Tomorrow" ? day.toLowerCase() : day}`;

  // Where the day stands, in one quiet line under the actions. No
  // highlighter here: at 14px the swipe read as a stray underline, not
  // emphasis (critique, 2026-10-27). Semibold carries the numbers.
  let status: ReactNode;
  if (focusPct >= 100) {
    status = (
      <>
        <span className="font-semibold text-baltic-700 dark:text-baltic-200">Goal hit</span> · {formatTime(todayMinutes)} of focus today, anything more is bonus
      </>
    );
  } else if (todayMinutes === 0) {
    const finish = projectedFinishTime(focusBlockMin);
    status = (
      <>
        Aim for <span className="font-semibold tabular-nums text-baltic-700 dark:text-baltic-200">{formatTime(dailyGoal)}</span> today
        {finish && (
          <>
            {" "}· this session ends at{" "}
            <span className="whitespace-nowrap font-semibold tabular-nums text-baltic-700 dark:text-baltic-300">{finish}</span>
          </>
        )}
      </>
    );
  } else {
    const finish = projectedFinishTime(minutesToGoal);
    status = (
      <>
        <span className="font-semibold tabular-nums text-baltic-700 dark:text-baltic-200">{formatTime(minutesToGoal)} to go</span>
        {finish && (
          <>
            {" "}· hit your goal by{" "}
            <span className="whitespace-nowrap font-semibold tabular-nums text-baltic-700 dark:text-baltic-300">{finish}</span>
          </>
        )}
      </>
    );
  }

  return (
    <div className="grid gap-6 lg:gap-8 items-center grid-cols-1 lg:grid-cols-[minmax(0,1fr)_11rem]">
      <div ref={columnRef} className="relative min-w-0">
        {loggedHeadline ? (
          <>
            {loggedHeadline}
            {/* The launcher sentence, one step quieter: still one click
                from the next session, length menu included. */}
            <p id="launcher-next" className="mt-4 text-base text-steel-600 dark:text-steel-400">
              Next, focus for{" "}
              <span className="font-semibold text-baltic-800 dark:text-baltic-100">
                <LengthMenu minutes={focusBlockMin} onChange={onSetLength} listParent={columnRef} />
              </span>{" "}
              on{" "}
              <span title={nextTask.title} className="font-semibold text-baltic-800 dark:text-baltic-100">
                {nextTask.title}
              </span>
            </p>
          </>
        ) : (
          <>
            {/* The sentence is the headline. It reads the same aloud:
                "focus for 25m on Lab report — Organic compounds". */}
            <h1 id="launcher-headline" className="text-baltic-800 dark:text-baltic-100">
              {/* Real spaces between the words (not margins), so the sentence
                  reads correctly aloud and when copied. */}
              <span className="block text-2xl font-semibold leading-tight">
                <span className="font-script text-[1.25em] text-baltic-500 dark:text-baltic-300 pr-1">focus for</span>{" "}
                <LengthMenu minutes={focusBlockMin} onChange={onSetLength} listParent={columnRef} />{" "}
                <span className="font-script text-[1.25em] text-baltic-500 dark:text-baltic-300 pl-1">on</span>
              </span>{" "}
              {/* No `block` here: it would override line-clamp's display and
                  switch the clamp off. Phones allow a third line so a long
                  title still reads whole. */}
              <span
                // Clamped to two lines (three on phones): the full title is
                // still one hover away.
                title={nextTask.title}
                className="mt-1 text-3xl sm:text-4xl font-bold tracking-tight leading-[1.12] line-clamp-3 sm:line-clamp-2"
              >
                {nextTask.title}
              </span>
            </h1>

            <p className="mt-3 inline-flex items-center gap-2 text-sm text-steel-600 dark:text-steel-400">
              <span
                aria-hidden
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: subject?.color ?? "#60729f" }}
              />
              <span>{subjectLabel}</span>
              <span aria-hidden className="text-steel-300 dark:text-steel-600">·</span>
              <span className={cn(overdue && "font-semibold text-red-600 dark:text-red-400")}>{due}</span>
              {/* A new user never created this task: say it's one of the
                  seeded examples (ids demo1–6 in contexts.tsx). */}
              {nextTask.id.startsWith("demo") && (
                <>
                  <span aria-hidden className="text-steel-300 dark:text-steel-600">·</span>
                  <span>sample task</span>
                </>
              )}
            </p>
          </>
        )}

        <div className="mt-7 flex items-center gap-5 flex-wrap">
          {/* Same button as Focus's Begin: subject colour, play mark. The
              launcher's main button takes focus on arrival (here and in
              the other two states), so Enter acts on it. It is described by
              the sentence it starts, so a screen reader landing here still
              hears it: the headline, or after a save the "Next, focus
              for…" line (the headline then names what was just logged). */}
          <button
            onClick={onFocus}
            autoFocus={focusPrimary}
            onPointerEnter={() => setHoverBegin(true)}
            onPointerLeave={() => setHoverBegin(false)}
            onFocus={(e) => setFocusBegin(usedPage.current && e.currentTarget.matches(":focus-visible"))}
            onBlur={() => setFocusBegin(false)}
            aria-describedby={`${loggedHeadline ? "launcher-next" : "launcher-headline"} launcher-projection`}
            style={{ backgroundColor: fill }}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 text-[15px] font-medium text-white hover:brightness-[0.94] active:scale-[0.98] shadow-[0_6px_16px_-8px_rgba(38,45,64,0.35)] focus:outline-none focus-visible:ring-2 focus-visible:ring-baltic-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-baltic-950 transition-[filter,transform] duration-150 ease-out"
          >
            <svg aria-hidden width={14} height={14} viewBox="0 0 14 14" fill="none">
              <polygon points="3,2 12,7 3,12" fill="currentColor" />
            </svg>
            Begin focusing
          </button>
          {/* What the meter's preview shows, in words. */}
          <span id="launcher-projection" className="sr-only">
            {todayMinutes >= dailyGoal
              ? `Adds ${formatTime(focusBlockMin)} past today's goal.`
              : `Brings today to ${formatTime(todayMinutes + focusBlockMin)} of ${formatTime(dailyGoal)}.`}
          </span>
          {focusBlank}
        </div>

        <p className="mt-6 text-sm text-steel-600 dark:text-steel-400">
          {status}
          {focusPct < 100 && (
            <>
              {" "}
              <button
                onClick={onEditGoal}
                // Own line on phones (it would otherwise wrap mid-sentence),
                // inline after the status from sm up.
                className="press tap-target block w-fit mt-1 sm:inline sm:mt-0 sm:ml-1 rounded-md px-1 -mx-1 text-sm font-medium text-steel-600 dark:text-steel-400 underline decoration-steel-300 underline-offset-2 hover:text-baltic-700 dark:hover:text-baltic-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-baltic-500"
              >
                Adjust goal
              </button>
            </>
          )}
        </p>
      </div>

      {meter}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   LENGTH MENU — the "25m" in the launcher sentence, as a real
   control. It offers the same quick lengths as Focus, and a pick
   becomes the default session length (the value in Settings), so
   the launcher keeps offering it. A small disclosure like the
   subject picker: opening moves focus to the current length, Esc
   closes and hands focus back, a click outside closes.
   ───────────────────────────────────────────────────────────── */

function LengthMenu({
  minutes,
  onChange,
  listParent,
}: {
  minutes: number;
  onChange: (minutes: number) => void;
  /** Where the open list renders: outside the heading the trigger sits in. */
  listParent: React.RefObject<HTMLElement>;
}) {
  const [open, setOpen] = useState(false);
  // Where to place the list: under the trigger, in listParent's coordinates.
  const [pos, setPos] = useState({ left: 0, top: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLSpanElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector<HTMLButtonElement>('[aria-pressed="true"]')?.focus();
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!triggerRef.current?.contains(t) && !listRef.current?.contains(t)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  function toggle() {
    const t = triggerRef.current;
    // offsetLeft/Top are relative to listParent: the nearest positioned
    // ancestor of the trigger.
    if (t) setPos({ left: t.offsetLeft, top: t.offsetTop + t.offsetHeight + 8 });
    setOpen((v) => !v);
  }

  function close() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  // The quick lengths, plus the current one if Settings holds a custom
  // length (say 35m), so the menu always shows what's picked.
  const options = DURATION_PRESETS.includes(minutes)
    ? DURATION_PRESETS
    : [...DURATION_PRESETS, minutes].sort((a, b) => a - b);

  return (
    // Keys and focus events from the portalled list still bubble here
    // through React.
    <span
      onKeyDown={(e) => {
        if (e.key === "Escape" && open) {
          e.stopPropagation();
          close();
        }
      }}
      // Tabbing out of the trigger or the list closes it, so it can't be
      // left open over Begin with focus somewhere else.
      onBlur={(e) => {
        const next = e.relatedTarget as Node | null;
        if (open && !triggerRef.current?.contains(next) && !listRef.current?.contains(next)) setOpen(false);
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        title="Change session length"
        className="tap-target inline-flex items-center gap-1 rounded-lg px-1.5 -mx-1.5 tabular-nums hover:bg-lavender-100 dark:hover:bg-lavender-800/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-baltic-500 transition-colors duration-150"
      >
        {formatTime(minutes)}
        <svg
          aria-hidden
          width={14}
          height={14}
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          className={cn("text-steel-500 transition-transform duration-150", open && "rotate-180")}
        >
          <path d="M3 4.5L6 7.5L9 4.5" />
        </svg>
      </button>
      {open &&
        listParent.current &&
        createPortal(
          <span
            ref={listRef}
            id={listId}
            role="group"
            aria-label="Session length"
            className="absolute z-20 flex w-36 flex-col rounded-2xl border border-lavender-200 bg-white py-1 text-left leading-normal shadow-[0_16px_36px_-12px_rgba(38,45,64,0.28)] dropdown-enter dark:border-lavender-700 dark:bg-lavender-900"
            style={{ left: pos.left, top: pos.top, transformOrigin: "top left" }}
          >
            {options.map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={m === minutes}
                onClick={() => {
                  onChange(m);
                  close();
                }}
                className="flex items-center justify-between gap-3 px-4 py-3 text-sm font-medium text-baltic-700 dark:text-baltic-200 hover:bg-lavender-50 dark:hover:bg-lavender-800/60 focus:outline-none focus-visible:bg-lavender-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-baltic-500"
              >
                <span className="tabular-nums">{formatTime(m)}</span>
                {m === minutes && (
                  <svg aria-hidden width={14} height={14} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="text-baltic-600">
                    <path d="M2.5 7.5L6 11l5.5-7" />
                  </svg>
                )}
              </button>
            ))}
          </span>,
          listParent.current
        )}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────
   AFTER THIS — the next two tasks, as a quiet list under the
   launcher (no card of its own). Each row opens Focus set up for
   that task, not started, so switching what you work on is one
   click. Everything else lives on /tasks.
   ───────────────────────────────────────────────────────────── */

function AfterThis({
  tasks,
  getSubject,
  onFocusOn,
  onOpenAll,
}: {
  tasks: Task[];
  getSubject: (idOrLabel: string) => UserSubject | undefined;
  onFocusOn: (task: Task) => void;
  onOpenAll: () => void;
}) {
  return (
    <section aria-labelledby="after-this" className="mt-8">
      <div className="flex items-baseline justify-between gap-4 px-1 mb-2">
        <h2 id="after-this" className="text-sm font-semibold text-baltic-700 dark:text-baltic-200">
          After this
        </h2>
        <button
          onClick={onOpenAll}
          className="press tap-target rounded-md px-1 -mx-1 text-sm font-medium text-steel-600 dark:text-steel-400 hover:text-baltic-700 dark:hover:text-baltic-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-baltic-500"
        >
          See all tasks
        </button>
      </div>

      {tasks.length === 0 ? (
        <p className="px-1 text-sm text-steel-600 dark:text-steel-400">
          Nothing else is open after this one.
        </p>
      ) : (
        <ul className="divide-y divide-lavender-200/70 dark:divide-lavender-800/60 border-y border-lavender-200/70 dark:border-lavender-800/60">
          {tasks.map((t) => {
            const subject = getSubject(t.subject);
            const subjectLabel = formatSubjectLabel(subject?.label ?? t.subject);
            const overdue = isOverdue(t.dueDate);
            const day = dayLabel(t.dueDate);
            return (
              <li key={t.id}>
                <button
                  onClick={() => onFocusOn(t)}
                  // Everything the row shows, in words: the visible subject
                  // and day (including "overdue") would otherwise be lost
                  // behind a label naming only the title.
                  aria-label={`Set up focus for ${t.title}, ${subjectLabel}, ${overdue ? "overdue" : `due ${day === "Today" || day === "Tomorrow" ? day.toLowerCase() : day}`}`}
                  className="group w-full flex items-center gap-3 px-1 py-3.5 text-left rounded-lg hover:bg-white dark:hover:bg-baltic-900/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-baltic-500 transition-colors duration-150"
                >
                  <span
                    aria-hidden
                    className="self-start mt-[7px] sm:self-center sm:mt-0 w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: subject?.color ?? "#60729f" }}
                  />
                  <span className="flex-1 min-w-0">
                    <span className="block truncate text-[15px] text-baltic-800 dark:text-baltic-100">
                      {t.title}
                    </span>
                    {/* Phones: subject and day go under the title, so the
                        title gets the row's full width. */}
                    <span className="sm:hidden mt-0.5 block truncate text-sm text-steel-600 dark:text-steel-400">
                      {subjectLabel} ·{" "}
                      <span className={cn(overdue && "font-semibold text-red-700 dark:text-red-400")}>{day}</span>
                    </span>
                  </span>
                  <span className="hidden sm:inline text-sm text-steel-600 dark:text-steel-400 flex-shrink-0">
                    {subjectLabel}
                  </span>
                  <span
                    className={cn(
                      "hidden sm:block w-20 text-right text-sm flex-shrink-0",
                      // red-700: red-600 is 4.27:1 on the page surface, under 4.5.
                      overdue ? "font-semibold text-red-700 dark:text-red-400" : "text-steel-600 dark:text-steel-400"
                    )}
                  >
                    {day}
                  </span>
                  {/* A chevron, not Begin's play mark: this row opens Focus
                      set up for the task, it doesn't start the timer. ▶
                      means "starts now" everywhere in the app. */}
                  <svg
                    aria-hidden
                    width={14}
                    height={14}
                    viewBox="0 0 14 14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.75}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="flex-shrink-0 text-steel-500 group-hover:text-baltic-600 group-hover:translate-x-0.5 dark:group-hover:text-baltic-300 transition-[color,transform] duration-150"
                  >
                    <path d="M5.5 3l4 4-4 4" />
                  </svg>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
   STICKY CARD — a plain paper panel: white surface, hairline
   border, the layered paper shadow. No accent strip, no grain
   overlay (after:hidden switches off .paper-card's ::after), and
   no entrance animation — the cards are simply there.
   ───────────────────────────────────────────────────────────── */

function StickyCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "paper-card after:hidden relative px-5 sm:px-6 py-6 border border-lavender-200/60 dark:border-lavender-800/60",
        className
      )}
    >
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   FOCUS TARGET — the full "a" of aim, as today's meter. Bowl + tail
   silhouette pulled directly from the AimLogo paths, filled from the
   bottom with one ink, the logo's own colour, up to today's share of
   the goal. The counter stays the logo's white dot. The numbers sit
   under it once ("1h 10m of 2h"), and the legend names the subjects.
   Above the ink, a pale ghost of the same ink is the session Begin
   would start, so the meter answers "what will this session do to my
   day?" instead of only reporting the past.

   It used to stack a band per session in each subject's colour, with
   the percentage in a white disc over the counter. Out of the
   wordmark that read as a striped chart behind a mask, not a letter
   filling with ink, and the disc hid the middle third of the fill
   (critique, 2026-10-27).
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
const A_BOTTOM = A_TOP + A_HEIGHT;
// The tail's box, from A_TAIL_PATH (its chamfered corner is too small to
// count).
const A_TAIL = { left: 233, right: 306, top: 279, bottom: 356 };

/* The ink is sized by area, not height. The bowl is narrow at its top and
   bottom, so a level set by height made the same 25m look about a third
   bigger as the day's first session than as its last, and a 58% day
   showed 62% ink (critique, 2026-10-27). INK_AREA holds the share of the
   letter's inked area (bowl and tail, less the counter) below each half-
   unit row, counted from the bottom; inkLevel turns a share of the goal
   into the height that inks exactly that much of the letter. */
const INK_ROW = 0.5;
const INK_AREA: number[] = (() => {
  const below: number[] = [];
  let area = 0;
  for (let y = A_BOTTOM; y > A_TOP; y -= INK_ROW) {
    const mid = y - INK_ROW / 2;
    const half = Math.sqrt(Math.max(A_BOWL_R ** 2 - (mid - A_BOWL_CY) ** 2, 0));
    let left = A_BOWL_CX - half;
    let right = A_BOWL_CX + half;
    if (mid >= A_TAIL.top && mid <= A_TAIL.bottom) {
      left = Math.min(left, A_TAIL.left);
      right = Math.max(right, A_TAIL.right);
    }
    let width = right - left;
    const fromCounter = mid - A_COUNTER_CY;
    if (Math.abs(fromCounter) < A_COUNTER_R) width -= 2 * Math.sqrt(A_COUNTER_R ** 2 - fromCounter ** 2);
    area += width * INK_ROW;
    below.push(area);
  }
  return below.map((a) => a / area);
})();

function inkLevel(share: number): number {
  if (share <= 0) return A_BOTTOM;
  if (share >= 1) return A_TOP;
  const row = INK_AREA.findIndex((a) => a >= share);
  const prev = row > 0 ? INK_AREA[row - 1] : 0;
  const within = (share - prev) / (INK_AREA[row] - prev);
  return A_BOTTOM - (row + within) * INK_ROW;
}

interface MeterSegment {
  id: string;
  minutes: number;
  color: string;
  label: string;
}

function FocusTarget({
  focusPct,
  todayMinutes,
  dailyGoal,
  segments,
  newSegmentId,
  justLogged,
  firstUse,
  nextMinutes,
  previewNext,
}: {
  focusPct: number;
  todayMinutes: number;
  dailyGoal: number;
  segments: MeterSegment[];
  newSegmentId?: string;
  /** The session just saved on Focus: named here, where it lands. */
  justLogged?: { minutes: number; label: string; color: string };
  /** No session ever finished: say what the "a" is for, once. */
  firstUse?: boolean;
  /** The length Begin would start, drawn as a ghost above the ink. */
  nextMinutes?: number;
  /** Begin is hovered or keyboard-focused: show what it would add. */
  previewNext?: boolean;
}) {
  // The session that took the day past its goal gets a settle once its
  // ink has landed.
  const fromPct = justLogged
    ? Math.min(Math.round(((todayMinutes - justLogged.minutes) / Math.max(dailyGoal, 1)) * 100), 100)
    : undefined;
  const crossedGoal = fromPct !== undefined && fromPct < 100 && focusPct >= 100;

  // One ink, as two layers of the same colour: what the "a" already held,
  // and on top of it the session just saved, which grows in once. Past
  // the goal the "a" is simply full.
  const shareOf = (minutes: number) => minutes / Math.max(dailyGoal, 1);
  const newSeg = newSegmentId ? segments.find((s) => s.id === newSegmentId) : undefined;
  const before = Math.min(
    segments.reduce((sum, s) => (s === newSeg ? sum : sum + shareOf(s.minutes)), 0),
    1
  );
  const added = newSeg ? Math.min(shareOf(newSeg.minutes), 1 - before) : 0;
  const beforeTop = inkLevel(before);
  const inkTop = inkLevel(before + added);

  // The next session, pale, above the ink: the length in the sentence,
  // so picking 45m raises it, and it deepens while Begin is pointed at.
  // Nothing to draw once the "a" is full.
  const ghost = nextMinutes ? Math.min(shareOf(nextMinutes), 1 - before - added) : 0;
  const ghostTop = inkLevel(before + added + ghost);
  const projected = todayMinutes + (nextMinutes ?? 0);
  const preview =
    previewNext && nextMinutes ? (
      <>
        <span className="font-semibold tabular-nums text-baltic-700 dark:text-baltic-300">+{formatTime(nextMinutes)}</span>
        {todayMinutes >= dailyGoal ? (
          " bonus"
        ) : (
          <>
            <svg aria-hidden width={12} height={12} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="inline-block mx-1 -mt-px">
              <path d="M2 6h8M7 3l3 3-3 3" />
            </svg>
            <span className="font-semibold tabular-nums text-baltic-800 dark:text-baltic-100">
              {projected >= dailyGoal ? "goal" : `${Math.round((projected / Math.max(dailyGoal, 1)) * 100)}%`}
            </span>
          </>
        )}
      </>
    ) : null;

  // Legend: minutes per subject today, largest first.
  const legend = Array.from(
    segments
      .reduce((map, seg) => {
        const prev = map.get(seg.label);
        map.set(seg.label, {
          label: seg.label,
          color: seg.color,
          minutes: (prev?.minutes ?? 0) + seg.minutes,
        });
        return map;
      }, new Map<string, { label: string; color: string; minutes: number }>())
      .values()
  ).sort((a, b) => b.minutes - a.minutes);

  // Beside the launcher (lg+) it's a centred column. Stacked under it on
  // smaller screens it becomes the card's footer: the "a" on the left,
  // the numbers beside it, which saves a screen-height of scrolling.
  return (
    <div className="flex items-center gap-5 pt-6 border-t border-lavender-200/60 dark:border-lavender-800/60 lg:block lg:pt-0 lg:border-0 lg:mx-auto lg:w-full lg:max-w-[11rem] lg:text-center">
      <div
        className={cn(
          // 144px beside the launcher: at 192px the "a" outweighed the
          // headline and Begin, the two things the card is for.
          "relative flex-shrink-0 w-28 h-28 lg:mx-auto lg:w-36 lg:h-36",
          crossedGoal && "focus-complete-settle"
        )}
        // After the ink has landed (300ms wait + 900ms growth).
        style={crossedGoal ? { animationDelay: "1200ms", animationFillMode: "forwards" } : undefined}
      >
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
            {/* The part of the "a" the ink hasn't reached yet. */}
            <clipPath id="aim-a-unfilled">
              <rect x={A_VB_X} y={A_VB_Y} width={A_VB_SIZE} height={Math.max(inkTop - A_VB_Y, 0)} />
            </clipPath>
          </defs>

          {/* The empty "a" is drawn as an outline, the logo waiting to be
              filled, not a grey blob. Bowl and tail are stroked, then
              painted over in the card colour: that hides the inner half
              of each stroke, including where the two shapes overlap, and
              leaves one clean outline of the whole letter. */}
          <g
            fill="none"
            strokeWidth={3}
            vectorEffect="non-scaling-stroke"
            className="stroke-lavender-400 dark:stroke-lavender-600"
          >
            <circle cx={A_BOWL_CX} cy={A_BOWL_CY} r={A_BOWL_R} vectorEffect="non-scaling-stroke" />
            <path d={A_TAIL_PATH} vectorEffect="non-scaling-stroke" />
          </g>
          <g className="fill-white dark:fill-lavender-900">
            <circle cx={A_BOWL_CX} cy={A_BOWL_CY} r={A_BOWL_R} />
            <path d={A_TAIL_PATH} />
          </g>

          <g clipPath="url(#aim-a-silhouette)" className="fill-baltic-700 dark:fill-baltic-200">
            {nextMinutes !== undefined && (
              // After a save it waits for the new ink to land first.
              <g className={newSeg ? "meter-ghost-in" : undefined}>
                {/* A full-height sheet behind the ink, moved so its top sits
                    at the ghost's level: the ink covers the rest, and a new
                    length only has to move it (a transform, so it eases). */}
                <rect
                  className="meter-ghost"
                  x={A_VB_X}
                  y={A_TOP}
                  width={A_VB_SIZE}
                  height={A_HEIGHT + 2}
                  style={{
                    transform: `translateY(${ghostTop - A_TOP}px)`,
                    opacity: ghost > 0 ? (previewNext ? 0.3 : 0.14) : 0,
                  }}
                />
              </g>
            )}
            {before > 0 && (
              <rect x={A_VB_X} y={beforeTop} width={A_VB_SIZE} height={A_BOTTOM - beforeTop} />
            )}
            {added > 0 && (
              <rect
                // The session just saved grows in from its bottom edge,
                // once: the moment the time you put in lands in the "a".
                // It reaches 2 units into the layer below, so the two never
                // show an anti-aliased seam (half a unit still did while it
                // grew).
                className="meter-band-in"
                x={A_VB_X}
                y={inkTop}
                width={A_VB_SIZE}
                height={beforeTop - inkTop + (before > 0 ? 2 : 0)}
              />
            )}
          </g>

          {/* The counter: the logo's white dot, over the ink. Where the ink
              hasn't reached it yet, it keeps the outline, so the empty "a"
              still reads as a letter. */}
          <circle cx={A_COUNTER_CX} cy={A_COUNTER_CY} r={A_COUNTER_R} className="fill-white dark:fill-lavender-900" />
          <circle
            cx={A_COUNTER_CX}
            cy={A_COUNTER_CY}
            r={A_COUNTER_R}
            fill="none"
            strokeWidth={1.5}
            vectorEffect="non-scaling-stroke"
            clipPath="url(#aim-a-unfilled)"
            className="stroke-lavender-400 dark:stroke-lavender-600"
          />
        </svg>
      </div>

      <div className="min-w-0">
        <p className="lg:mt-3 text-sm text-steel-600 dark:text-steel-400">
          {/* While Begin is pointed at, the line says what it would add;
              Begin's own description carries that for screen readers. */}
          {preview ? (
            <span aria-hidden>{preview}</span>
          ) : (
            <>
              <span className="font-semibold tabular-nums text-baltic-700 dark:text-baltic-300">
                {formatTime(todayMinutes)}
              </span>{" "}
              of{" "}
              <span className="font-semibold tabular-nums text-baltic-700 dark:text-baltic-300">
                {formatTime(dailyGoal)}
              </span>
            </>
          )}
          <span className="sr-only"> focused today ({focusPct}%)</span>
        </p>
        {firstUse && (
          <p className="mt-1 text-xs text-balance text-steel-600 dark:text-steel-400">
            Every session you finish fills in the &ldquo;a&rdquo;.
          </p>
        )}

        {legend.length > 0 && (
          <ul className="mt-2 space-y-1" aria-label="Today by subject">
            {legend.map((l) => (
              <li
                key={l.label}
                className={cn(
                  "flex items-center lg:justify-center gap-1.5 text-xs",
                  // The subject just logged stands out for this arrival.
                  l.label === justLogged?.label
                    ? "font-semibold text-baltic-800 dark:text-baltic-100"
                    : "text-steel-600 dark:text-steel-400"
                )}
              >
                <span aria-hidden className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: l.color }} />
                <span>{l.label}</span>{" "}
                <span className="tabular-nums font-medium text-baltic-700 dark:text-baltic-300">
                  {formatTime(l.minutes)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
