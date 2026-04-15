# aim — a calm study planner

**Role** Design & engineering (solo)
**Stack** Next.js 14 · TypeScript · Tailwind · localStorage
**Status** Shipped, ongoing
**Repo** ginesbal/aim

---

## TL;DR

aim is a single-page study planner built around one question a student asks themself every day: *where should I put my attention right now?* Most planners answer that with a to-do list. aim answers it with a target — a focus goal, a next action, and a sense of whether you're building rhythm or drifting. The visual language is an editorial "scrapbook" — tape-strip cards, a warm muted palette, and typography that feels closer to a notebook than a productivity dashboard.

This write-up covers the decisions behind the look and feel, the information architecture of the home screen, and the small interaction details that carry most of the weight.

---

## Why build it

Two things kept bothering me about the study apps I'd tried:

1. **They confuse activity with progress.** A screen full of checkboxes tells you what's left. It doesn't tell you whether today is going well.
2. **They're loud.** Bright gradients, gamification badges, notification counters — the UI competes with the thing it's supposed to help you do.

So the brief I set for myself was narrow: a single space that opens calmly, shows you *one* thing to do next, and gives you an honest read on your focus habit over time. No streak-shaming, no XP, no dopamine slot machine.

---

## The design direction: editorial scrapbook

I wanted aim to feel like a notebook a thoughtful person keeps — something between a reading journal and a bullet journal spread. Three constraints fell out of that:

- **Paper-like surfaces, not glass.** Soft off-white cards on a warmer background. No neon, no glassmorphism, no dramatic drop shadows.
- **Tape strips instead of headers.** Each card has a small colored "tape" at the top-left, clipped into a trapezoid. It reads as a label without adding a header bar, and it carries the color meaning of the section (cream for focus, baltic for tasks, ash for streak, lavender for memory).
- **Typography does the hierarchy.** Plus Jakarta Sans for body and display, JetBrains Mono for micro-labels. Uppercase tracked-out mono text is reserved for eyebrows and metadata so those never compete with the content they label.

The visual metaphor isn't decorative. A notebook implies that the app is *yours* — the tasks, the reflections, the streak — and that it doesn't have opinions you didn't invite. That shaped a lot of the later decisions: no animated confetti, no "you're crushing it" copy, no email nudges.

---

## The color system

Five color families, each with a 50–950 scale. I named them by mood, not by role, so I could recompose them per surface without fighting semantic baggage:

| Token | Hue | Used for |
| --- | --- | --- |
| `baltic` | cool slate blue | primary text, buttons, accent rings |
| `lavender` | warm grey-purple | surfaces, borders, dark-mode canvas |
| `steel` | neutral grey | secondary text, captions, dividers |
| `ash` | muted sage | success, streak, completed state |
| `cream` | warm yellow | highlight, "today", the single CTA pulse |

Two rules I held to throughout:

1. **One family per surface.** A card pulls its borders, backgrounds, and hover states from one scale so it reads as a single object, not a collage.
2. **Cream is the scarcest color.** It only appears on things that are "now" — the focus-session CTA, today's dot in the streak row, the "due today" chip. Scarcity is what makes it read as attention-worthy rather than decorative.

Dark mode uses the 800–900 end of the same scales, which keeps the mood coherent rather than inverting into a harsh black/white contrast.

---

## The home screen

The dashboard is the hardest screen in any planner because it has to answer three questions at once — *how am I doing today, what should I do next, and am I building a habit?* — without looking like a cockpit. Here's how aim arranges them.

### 1 · "Your aim today" — the target card

A concentric SVG target with the user's focus minutes rendered as a colored arc. At first this was a single blue progress ring. That was honest but lossy: if you studied math for 40 minutes and reading for 20, the ring still just said "60 / 120."

The fix was to stack the arc by subject. Each subject contributes a colored slice, cumulatively, in its own brand color. When only one subject contributed, the arc uses a round cap and reads as a clean progress ring. When multiple did, it reads as a composed target and a small legend appears beneath it with labels and minutes.

The card also carries a plain-language line underneath — *"Almost there — just 30m left"* — that swaps copy based on how close you are to your daily goal. Percentages are a poor proxy for feeling. A sentence is better.

### 2 · "Next up" — one task, front and center

Pending tasks are sorted by due date, and exactly one — the soonest — is surfaced. The rest collapse into a small footer link: *"5 more on your list →"*.

Three chips hang under the title: subject (with color dot), due date (or an "Overdue" / "Due today" chip if applicable), and priority. The title itself is a button that deep-links into `/tasks?task=<id>` and opens the detail modal — the tasks page listens for that param on mount and cleans it from the URL after opening, so reopening the tab doesn't retrigger.

The "Focus on this" button passes `?subject=<id>` to the timer page, which reads it on mount and pre-selects that subject. Small thing, but it removes the entire "choose what you're studying" step when you've already told the app.

### 3 · "Your streak" — a rhythm row, not a counter

The streak card originally showed a number with a cream flame icon and a line of copy ("3 days in a row, don't break it today"). The "don't break it" framing bothered me — it's mild punishment masquerading as motivation.

The revision: keep the number, soften the copy ("days and counting"), and add a seven-dot row underneath showing the last seven days. Filled dots for days you studied, hollow dots for gaps, a cream ring on today. Now the card says *here's the pattern you're building* instead of *don't mess up*.

### 4 · "Pick up where you left off"

Shows the most recent focus session — subject, duration, when. The Continue button carries the subject through to the timer via the same `?subject=` mechanism so a resumed session is one click.

---

## The focus timer

The timer is full-screen. Nothing else on the page; a subtle generative background (Vanta/p5) replaces the normal layout, and an Exit button in the top-right lets you bail without ceremony.

**One decision I'd call out:** the clock's sweep hand. The first pass used a CSS `@keyframes rotate` animation. It looked fine, but if you blurred the tab for a minute and came back, the hand was visually where it would have been had time kept passing — except the timer pauses on blur-invisible intervals in some browsers, so the hand and the digits disagreed. Reviewers don't catch this; it's a "feels wrong" bug.

The fix was to drop the CSS animation and drive the rotation from the timer's own state:

```tsx
transform: `rotate(${((totalSeconds - secondsLeft) % 60) * 6}deg)`,
transition: "transform 0.95s linear, opacity 0.3s ease",
```

Now the hand is always in sync with the actual seconds remaining, because it's derived from the same state variable. Timing bugs that come from two clocks disagreeing are almost always fixed by keeping only one clock.

After the session ends the screen transitions to a reflection panel — a quality selector (four dots, not five stars — stars imply judgment, dots imply observation) and an optional one-line "what clicked?" note. Reflections are saved with the session and surface later in the journal.

---

## Tasks: folder tabs

Tasks live in a familiar metaphor — manila folder tabs across the top, one per subject plus an "All" tab. The active tab "pulls forward" with a subtle `-mb-[2px]` nudge that joins it visually to the folder body below, and its color bleeds into the body's border. Small counts on each tab show pending items at a glance, with a red dot on inactive tabs that have overdue work.

The folder body is one scrollable list sorted by: incomplete first, overdue second, then by due date. A small filter toggle (Pending / Done / All) lives in the info bar. The empty state for each folder uses a dashed rectangle with a fold corner — a visual hint of an empty file folder rather than a generic "no items" illustration.

---

## Accessibility and motion

A few things I built in from the start rather than retrofitted:

- **`prefers-reduced-motion`.** All decorative animations (floating blobs, timer pulse, dropdown entrance, tick staggers) are gated behind `@media (prefers-reduced-motion: reduce)` and stilled when the OS requests it. Functional transitions — button color shifts, focus rings — stay on, because those convey state.
- **Focus-visible rings everywhere.** Every interactive element on the dashboard has a 2px offset ring on `focus-visible`. The ring color is `baltic-400/60` with a surface-colored offset so it reads cleanly on both light and dark backgrounds.
- **ARIA on the generative parts.** The SVG target has a `<title>` and `<desc>` that describe the current state in prose (*"42m of 2h focused today, 35% of goal, across 2 subjects."*), so screen readers don't just announce "image."
- **No keyboard traps.** The welcome modal, which appears once on first visit, was originally `onClose={() => {}}` — a keyboard trap disguised as an onboarding. Now Escape, backdrop click, and a "Skip for now" button all dismiss it and set a default name so the greeting has something to say.
- **Midnight refresh.** A `useMidnightTick` hook re-renders the dashboard at local midnight so the greeting, streak, and "due today" chips stay accurate if you leave the tab open overnight.

---

## Technical choices worth explaining

- **localStorage, not a database.** aim is a single-user, single-device planner. A backend would be infrastructure theatre — it would let you say "it scales" without adding anything the user feels. Every context provider (`useSubjects`, `useTasks`, `useFocus`, `usePreferences`) hydrates from localStorage with a `mounted` flag pattern so SSR doesn't flash stale UI.
- **React Context over a state library.** Four providers, each scoped to its concern, composed at the root. No Redux, no Zustand — the state graph is small enough that the ergonomics of a library would cost more than they pay.
- **Tailwind with design tokens in the config, not utility soup in markup.** The five color families and the typography scale live in `tailwind.config.ts`. Components reach for semantic tokens (`text-baltic-800`, `bg-cream-100`), not hex values. That's what lets dark mode be a tag flip rather than a rewrite.
- **No ESLint config in the build.** `next build` does TypeScript checking, which is what actually catches bugs. An ESLint setup would be configuration for its own sake on a solo project this size. I'd add it the day someone else joins.

---

## What I'd do next

A few things are on the list but intentionally deferred:

- **Subject time budgets.** Right now the daily goal is a single number. A version where you can allocate a portion per subject ("2h math, 1h reading") would make the stacked ring feel like a plan, not a report.
- **Import/export.** Everything is local, which is great for privacy and terrible for moving devices. A JSON export/import would solve it without requiring a sync server.
- **Onboarding that teaches the scrapbook.** New users see an empty dashboard and don't immediately understand that the tape colors and the target rings are telling them something. A light first-run tour — not a modal wizard, but annotated sample data — would help.
- **A "weekly review" surface.** The journal has the data; it doesn't yet have a Sunday-night-ready summary.

---

## Reflections

The thing I'm most happy with isn't a single screen — it's that the app stays quiet. It doesn't ping you. It doesn't guilt you. It doesn't celebrate you. It opens, shows you where you are, and gets out of the way. That restraint took more design passes than any of the visible features.

The thing I'd change: I spent longer than I should have on the hero ring math before realizing the ring wasn't the problem — the *copy next to the ring* was doing the actual work. Dashboards succeed when a person can glance at them and say one sentence out loud about their day. The chart is just the evidence for the sentence.
