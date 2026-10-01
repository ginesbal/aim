"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { Task, FocusSession, Reflection, UserSubject, DEFAULT_USER_SUBJECTS, PREVIOUS_DEFAULT_COLORS } from "./types";
import { generateId } from "./utils";

// ─── Storage helpers ───
function load<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function hasStored(key: string) {
  try {
    return localStorage.getItem(key) !== null;
  } catch {
    return false;
  }
}

function save(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota exceeded / privacy mode — accept the loss rather than crash */
  }
}

// ─── Preferences Context (replaces Auth) ───
interface PreferencesState {
  name: string;
  isFirstVisit: boolean;
  dailyGoal: number;
  focusBlockMin: number;
  setName: (name: string) => void;
  setDailyGoal: (minutes: number) => void;
  setFocusBlockMin: (minutes: number) => void;
}

const PreferencesContext = createContext<PreferencesState | null>(null);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [name, setNameState] = useState("");
  const [dailyGoal, setDailyGoalState] = useState(120);
  const [focusBlockMin, setFocusBlockMinState] = useState(25);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setNameState(load<string>("aim_name", ""));
    setDailyGoalState(load<number>("aim_daily_goal", 120));
    setFocusBlockMinState(load<number>("aim_focus_block_min", 25));
    setMounted(true);
  }, []);

  const setName = useCallback((n: string) => {
    setNameState(n);
    save("aim_name", n);
  }, []);

  const setDailyGoal = useCallback((m: number) => {
    setDailyGoalState(m);
    save("aim_daily_goal", m);
  }, []);

  const setFocusBlockMin = useCallback((m: number) => {
    setFocusBlockMinState(m);
    save("aim_focus_block_min", m);
  }, []);

  if (!mounted) return null;

  return (
    <PreferencesContext.Provider
      value={{
        name,
        isFirstVisit: !name,
        dailyGoal,
        focusBlockMin,
        setName,
        setDailyGoal,
        setFocusBlockMin,
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error("usePreferences must be inside PreferencesProvider");
  return ctx;
}

// ─── Tasks Context ───
interface TasksState {
  tasks: Task[];
  addTask: (task: Omit<Task, "id" | "createdAt" | "completed">) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleComplete: (id: string) => void;
  /** Move every task filed under `fromLabel` to `toLabel` (subject rename). */
  reassignTasks: (fromLabel: string, toLabel: string) => void;
}

const TasksContext = createContext<TasksState | null>(null);

// A due date N days from today, as a local calendar date. (toISOString()
// is UTC: in the evening west of Greenwich, "today" came out as tomorrow.)
function dueIn(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const SAMPLE_TASKS: Task[] = [
  {
    id: "demo1",
    title: "Linear algebra problem set",
    description: "Complete exercises 4.1 through 4.8 on vector spaces and eigenvalues",
    subject: "Mathematics",
    dueDate: dueIn(1),
    priority: "high",
    completed: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "demo2",
    title: "Read chapter on Romanticism",
    description: "Focus on the transition from Neoclassicism and key authors of the period",
    subject: "Literature",
    dueDate: dueIn(2),
    priority: "medium",
    completed: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "demo3",
    title: "Lab report — Organic compounds",
    description: "Write up findings from Wednesday's spectroscopy lab session",
    subject: "Science",
    dueDate: dueIn(0),
    priority: "high",
    completed: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "demo4",
    title: "Microeconomics essay outline",
    description: "Draft thesis and outline for market failure case study essay",
    subject: "Economics",
    dueDate: dueIn(3),
    priority: "low",
    completed: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "demo5",
    title: "Spanish verb conjugation practice",
    description: "Subjunctive mood irregular verbs — use flashcard deck",
    subject: "Languages",
    dueDate: dueIn(1),
    priority: "medium",
    completed: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "demo6",
    title: "History source analysis",
    description: "Analyze primary sources from the Industrial Revolution for Thursday's seminar",
    subject: "History",
    dueDate: dueIn(4),
    priority: "medium",
    completed: true,
    createdAt: new Date().toISOString(),
  },
];

export function TasksProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Samples are for a first visit only. Once a list has been saved, even
    // an empty one (every task deleted), what's stored is the truth.
    setTasks(hasStored("aim_tasks") ? load<Task[]>("aim_tasks", []) : SAMPLE_TASKS);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) save("aim_tasks", tasks);
  }, [tasks, mounted]);

  const addTask = useCallback(
    (task: Omit<Task, "id" | "createdAt" | "completed">) => {
      setTasks((prev) => [
        ...prev,
        { ...task, id: generateId(), createdAt: new Date().toISOString(), completed: false },
      ]);
    },
    []
  );

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toggleComplete = useCallback((id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  }, []);

  const reassignTasks = useCallback((fromLabel: string, toLabel: string) => {
    if (fromLabel === toLabel) return;
    setTasks((prev) =>
      prev.map((t) => (t.subject === fromLabel ? { ...t, subject: toLabel } : t))
    );
  }, []);

  if (!mounted) return null;

  return (
    <TasksContext.Provider
      value={{ tasks, addTask, updateTask, deleteTask, toggleComplete, reassignTasks }}
    >
      {children}
    </TasksContext.Provider>
  );
}

export function useTasks() {
  const ctx = useContext(TasksContext);
  if (!ctx) throw new Error("useTasks must be inside TasksProvider");
  return ctx;
}

// ─── Focus Sessions Context ───
interface FocusState {
  sessions: FocusSession[];
  /** Logs a finished session and returns its id. */
  addSession: (subject: string, duration: number, reflection?: Reflection, task?: string) => string;
  todayMinutes: number;
  weekMinutes: number;
  streak: number;
}

const FocusContext = createContext<FocusState | null>(null);

export function FocusProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // No sample sessions: a first visit starts with an empty "a", so the
    // first session a visitor finishes is its first band. (Sample tasks
    // stay, so there's still something to focus on.)
    setSessions(load<FocusSession[]>("aim_sessions", []));
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) save("aim_sessions", sessions);
  }, [sessions, mounted]);

  const addSession = useCallback((subject: string, duration: number, reflection?: Reflection, task?: string) => {
    // The id comes back so the dashboard can point at this exact session
    // (the band that grows into the "a" on the way back from Focus).
    const id = generateId();
    setSessions((prev) => [
      ...prev,
      {
        id,
        subject,
        duration,
        completedAt: new Date().toISOString(),
        ...(reflection ? { reflection } : {}),
        ...(task && task.trim() ? { task: task.trim() } : {}),
      },
    ]);
    return id;
  }, []);

  const today = new Date().toDateString();
  const todayMinutes = sessions
    .filter((s) => new Date(s.completedAt).toDateString() === today)
    .reduce((sum, s) => sum + s.duration, 0);

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const weekMinutes = sessions
    .filter((s) => new Date(s.completedAt) >= weekStart)
    .reduce((sum, s) => sum + s.duration, 0);

  let streak = 0;
  const dateSet = new Set(
    sessions.map((s) => new Date(s.completedAt).toDateString())
  );
  const check = new Date();
  if (!dateSet.has(check.toDateString())) {
    check.setDate(check.getDate() - 1);
  }
  while (dateSet.has(check.toDateString())) {
    streak++;
    check.setDate(check.getDate() - 1);
  }

  if (!mounted) return null;

  return (
    <FocusContext.Provider value={{ sessions, addSession, todayMinutes, weekMinutes, streak }}>
      {children}
    </FocusContext.Provider>
  );
}

export function useFocus() {
  const ctx = useContext(FocusContext);
  if (!ctx) throw new Error("useFocus must be inside FocusProvider");
  return ctx;
}

// ─── User Subjects Context ───
interface SubjectsState {
  subjects: UserSubject[];
  addSubject: (label: string, color: string) => void;
  updateSubject: (id: string, updates: Partial<Omit<UserSubject, "id">>) => void;
  deleteSubject: (id: string) => void;
  getSubject: (idOrLabel: string) => UserSubject | undefined;
}

const SubjectsContext = createContext<SubjectsState | null>(null);

export function SubjectsProvider({ children }: { children: ReactNode }) {
  const [subjects, setSubjects] = useState<UserSubject[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = load<UserSubject[]>("aim_user_subjects", []);
    // Default subjects still on their original colour move to the new,
    // more distinct palette (see PREVIOUS_DEFAULT_COLORS).
    const migrated = stored.map((s) => {
      const fresh = DEFAULT_USER_SUBJECTS.find((d) => d.id === s.id);
      return fresh && PREVIOUS_DEFAULT_COLORS[s.id] === s.color ? { ...s, color: fresh.color } : s;
    });
    setSubjects(migrated.length > 0 ? migrated : DEFAULT_USER_SUBJECTS);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) save("aim_user_subjects", subjects);
  }, [subjects, mounted]);

  const addSubject = useCallback((label: string, color: string) => {
    setSubjects((prev) => [...prev, { id: generateId(), label, color }]);
  }, []);

  const updateSubject = useCallback(
    (id: string, updates: Partial<Omit<UserSubject, "id">>) => {
      setSubjects((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
      );
    },
    []
  );

  const deleteSubject = useCallback((id: string) => {
    setSubjects((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const getSubject = useCallback(
    (idOrLabel: string) =>
      subjects.find((s) => s.id === idOrLabel || s.label === idOrLabel),
    [subjects]
  );

  if (!mounted) return null;

  return (
    <SubjectsContext.Provider
      value={{ subjects, addSubject, updateSubject, deleteSubject, getSubject }}
    >
      {children}
    </SubjectsContext.Provider>
  );
}

export function useSubjects() {
  const ctx = useContext(SubjectsContext);
  if (!ctx) throw new Error("useSubjects must be inside SubjectsProvider");
  return ctx;
}

// ─── Theme Context ───
interface ThemeState {
  dark: boolean;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeState | null>(null);

/* Dark mode is off for now: the app stays light while its foundation
   settles. Its settings toggle was already removed, which left anyone
   with a saved "aim_dark: true" stuck in dark mode with no way out, so
   the saved choice is ignored (kept, not deleted) until this comes back.
   The dark: styles stay in the code. Flip to true to restore it, along
   with a toggle to reach it. */
const DARK_MODE_ENABLED = false;

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (DARK_MODE_ENABLED) setDark(load<boolean>("aim_dark", false));
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (DARK_MODE_ENABLED) save("aim_dark", dark);
    document.documentElement.classList.toggle("dark", DARK_MODE_ENABLED && dark);
  }, [dark, mounted]);

  const toggle = useCallback(() => {
    if (DARK_MODE_ENABLED) setDark((d) => !d);
  }, []);

  if (!mounted) return null;

  return (
    <ThemeContext.Provider value={{ dark, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be inside ThemeProvider");
  return ctx;
}
