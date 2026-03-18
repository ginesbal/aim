"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { Task, FocusSession, UserProfile } from "./types";
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

function save(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

// ─── Auth Context ───
interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  login: (email: string, name: string) => void;
  signup: (email: string, name: string) => void;
  logout: () => void;
  updateProfile: (profile: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setUser(load<UserProfile | null>("meridian_user", null));
    setMounted(true);
  }, []);

  const login = useCallback((email: string, name: string) => {
    const u = { email, name };
    setUser(u);
    save("meridian_user", u);
  }, []);

  const signup = useCallback((email: string, name: string) => {
    const u = { email, name };
    setUser(u);
    save("meridian_user", u);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("meridian_user");
  }, []);

  const updateProfile = useCallback(
    (partial: Partial<UserProfile>) => {
      if (!user) return;
      const updated = { ...user, ...partial };
      setUser(updated);
      save("meridian_user", updated);
    },
    [user]
  );

  if (!mounted) return null;

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, login, signup, logout, updateProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}

// ─── Tasks Context ───
interface TasksState {
  tasks: Task[];
  addTask: (task: Omit<Task, "id" | "createdAt" | "completed">) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleComplete: (id: string) => void;
}

const TasksContext = createContext<TasksState | null>(null);

// Sample tasks for demo
const SAMPLE_TASKS: Task[] = [
  {
    id: "demo1",
    title: "Linear algebra problem set",
    description: "Complete exercises 4.1 through 4.8 on vector spaces and eigenvalues",
    subject: "mathematics",
    dueDate: new Date(Date.now() + 86400000).toISOString().split("T")[0],
    priority: "high",
    completed: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "demo2",
    title: "Read chapter on Romanticism",
    description: "Focus on the transition from Neoclassicism and key authors of the period",
    subject: "literature",
    dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0],
    priority: "medium",
    completed: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "demo3",
    title: "Lab report — Organic compounds",
    description: "Write up findings from Wednesday's spectroscopy lab session",
    subject: "science",
    dueDate: new Date().toISOString().split("T")[0],
    priority: "high",
    completed: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "demo4",
    title: "Microeconomics essay outline",
    description: "Draft thesis and outline for market failure case study essay",
    subject: "economics",
    dueDate: new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0],
    priority: "low",
    completed: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "demo5",
    title: "Spanish verb conjugation practice",
    description: "Subjunctive mood irregular verbs — use flashcard deck",
    subject: "languages",
    dueDate: new Date(Date.now() + 86400000).toISOString().split("T")[0],
    priority: "medium",
    completed: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "demo6",
    title: "History source analysis",
    description: "Analyze primary sources from the Industrial Revolution for Thursday's seminar",
    subject: "history",
    dueDate: new Date(Date.now() + 86400000 * 4).toISOString().split("T")[0],
    priority: "medium",
    completed: true,
    createdAt: new Date().toISOString(),
  },
];

export function TasksProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = load<Task[]>("meridian_tasks", []);
    setTasks(stored.length > 0 ? stored : SAMPLE_TASKS);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) save("meridian_tasks", tasks);
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

  if (!mounted) return null;

  return (
    <TasksContext.Provider value={{ tasks, addTask, updateTask, deleteTask, toggleComplete }}>
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
  addSession: (subject: string, duration: number) => void;
  todayMinutes: number;
  weekMinutes: number;
  streak: number;
}

const FocusContext = createContext<FocusState | null>(null);

export function FocusProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = load<FocusSession[]>("meridian_sessions", []);
    if (stored.length > 0) {
      setSessions(stored);
    } else {
      // Sample data
      const now = new Date();
      const sampleSessions: FocusSession[] = [];
      for (let i = 0; i < 5; i++) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        sampleSessions.push({
          id: generateId(),
          subject: ["mathematics", "science", "literature", "economics", "history"][i],
          duration: [45, 30, 25, 50, 25][i],
          completedAt: d.toISOString(),
        });
      }
      setSessions(sampleSessions);
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) save("meridian_sessions", sessions);
  }, [sessions, mounted]);

  const addSession = useCallback((subject: string, duration: number) => {
    setSessions((prev) => [
      ...prev,
      { id: generateId(), subject, duration, completedAt: new Date().toISOString() },
    ]);
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

  // Calculate streak
  let streak = 0;
  const dateSet = new Set(
    sessions.map((s) => new Date(s.completedAt).toDateString())
  );
  const check = new Date();
  // If no session today, start checking from yesterday
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

// ─── Theme Context ───
interface ThemeState {
  dark: boolean;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeState | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setDark(load<boolean>("meridian_dark", false));
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      save("meridian_dark", dark);
      document.documentElement.classList.toggle("dark", dark);
    }
  }, [dark, mounted]);

  const toggle = useCallback(() => setDark((d) => !d), []);

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
