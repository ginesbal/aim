export interface Task {
  id: string;
  title: string;
  description: string;
  subject: string;
  dueDate: string;
  priority: "low" | "medium" | "high";
  completed: boolean;
  createdAt: string;
}

export type FocusQuality = 1 | 2 | 3 | 4;

export interface Reflection {
  quality: FocusQuality;
  note?: string;
}

export interface FocusSession {
  id: string;
  subject: string;
  duration: number; // minutes
  completedAt: string;
  reflection?: Reflection;
}

export const QUALITY_LEVELS: Record<FocusQuality, { label: string; description: string }> = {
  1: { label: "Scattered", description: "Mind was elsewhere" },
  2: { label: "Distracted", description: "Some focus, some drift" },
  3: { label: "Focused", description: "Solid concentration" },
  4: { label: "Deep focus", description: "Fully immersed" },
};

export type SubjectKey =
  | "mathematics"
  | "science"
  | "literature"
  | "history"
  | "languages"
  | "design"
  | "economics"
  | "philosophy";

export const SUBJECTS: Record<SubjectKey, { label: string; color: string }> = {
  mathematics: { label: "Mathematics", color: "#60729f" },
  science: { label: "Science", color: "#76946b" },
  literature: { label: "Literature", color: "#6e7891" },
  history: { label: "History", color: "#b9c23d" },
  languages: { label: "Languages", color: "#4d5b80" },
  design: { label: "Design", color: "#91a989" },
  economics: { label: "Economics", color: "#586074" },
  philosophy: { label: "Philosophy", color: "#949b31" },
};

export const PRIORITIES = {
  low: { label: "Low", color: "#76946b" },
  medium: { label: "Medium", color: "#b9c23d" },
  high: { label: "High", color: "#60729f" },
} as const;
