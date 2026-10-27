import type { ReactNode } from "react";

/* aim's page headlines are each one sentence at headline size: "focus for
   25m on Lab report", "5 tasks to do, the next due today", "this week, 4
   sessions for 2h 5m". What matters is in the grotesque; the words that
   join it step back in an italic serif, like a note in a textbook's
   margin (The Connecting Words Rule in DESIGN.md). They used to sit on a
   line of their own in Caveat, a size down, which read as a label over a
   title rather than a sentence (critique, 2026-10-27). A figure in the
   sentence ("2h 30m", "5 tasks") is kept whole with whitespace-nowrap, so
   a phone never breaks it across lines. */
export const SENTENCE =
  "text-3xl sm:text-4xl font-bold tracking-tight leading-[1.15] text-baltic-800 dark:text-baltic-100";

/** The connecting words of a sentence. Never content, a number or a control. */
export function Connect({ children }: { children: ReactNode }) {
  return <span className="font-connect text-baltic-600 dark:text-baltic-300">{children}</span>;
}
