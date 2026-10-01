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
  task?: string; // what the user was working on, captured at setup
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

// ─── User-managed subjects ───
export interface UserSubject {
  id: string;
  label: string;
  color: string;
}

/* Subject colours: muted, but spread by both hue and lightness so
   neighbouring bands in the dashboard's "a" read as different subjects,
   including with red-green colour blindness. Measured in OKLab, the
   seven defaults (first seven) are at least 10 apart; the old set had
   pairs at 3, which read as the same colour. Baltic, sage and mustard
   carry over from the app's own palette. */
export const SUBJECT_COLORS = [
  "#60729f", // baltic blue
  "#76946b", // sage
  "#b47692", // dusty rose
  "#b9a23d", // mustard
  "#6ba9bd", // soft teal
  "#a96249", // terracotta
  "#4e4d78", // ink violet
  "#676e3d", // olive
  "#91a989", // pale sage
  "#586074", // slate
] as const;

/* What a screen reader says for each swatch in the new-subject picker
   ("Sage", not "#76946b"). Swatches without a name here fall back to
   "Colour 1", "Colour 2"… by position. */
export const SUBJECT_COLOR_NAMES: Partial<Record<(typeof SUBJECT_COLORS)[number], string>> = {
  // TODO(you): name the palette, one short word each, in your voice.
};

export const DEFAULT_USER_SUBJECTS: UserSubject[] = [
  { id: "math", label: "Mathematics", color: "#60729f" },
  { id: "sci", label: "Science", color: "#76946b" },
  { id: "lit", label: "Literature", color: "#b47692" },
  { id: "hist", label: "History", color: "#b9a23d" },
  { id: "lang", label: "Languages", color: "#6ba9bd" },
  { id: "econ", label: "Economics", color: "#a96249" },
  { id: "design", label: "Design", color: "#4e4d78" },
];

/* The colours the default subjects shipped with before the palette was
   spread out. A saved default subject still wearing its old colour was
   never recoloured by its owner, so it moves to the new one; anything
   the owner changed is left alone. */
export const PREVIOUS_DEFAULT_COLORS: Record<string, string> = {
  lit: "#6e7891",
  lang: "#4d5b80",
  econ: "#586074",
  design: "#91a989",
};

export const PRIORITIES = {
  low: { label: "Low", color: "#76946b" },
  medium: { label: "Medium", color: "#b9c23d" },
  high: { label: "High", color: "#60729f" },
} as const;
