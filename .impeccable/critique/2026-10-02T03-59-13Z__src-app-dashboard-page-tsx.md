---
target: the dashboard (src/app/dashboard/page.tsx) with Focus as its centre
total_score: 27
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 1
target_identity: "file:C:\\Portfolio\\aim\\src\\app\\dashboard\\page.tsx"
target_fingerprint: "sha256:98cbb3836d769afaab4b761ac703a0d92c518b85fa8613663a3911f4985f9eb4"
target_path: "C:\\Portfolio\\aim\\src\\app\\dashboard\\page.tsx"
timestamp: 2026-10-02T03-59-13Z
slug: src-app-dashboard-page-tsx
closed: true
---
Method: dual-agent (A: isolated design-review sub-agent · B: isolated detector and browser-evidence sub-agent)

# Critique: aim dashboard, with Focus as its centre

Score 27/40, one point under the last three runs. No design changed between runs; this pass looked harder at the Focus screen and found one real trap there. The dashboard came back clean again.

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Leaving a session pauses it, but the button only says "Leave". The end of a session has no signal beyond the tab title. |
| 2 | Match System / Real World | 3 | "Signed in as" with no sign-in. The mantra "no tabs, no shortcuts" sits on a screen with a Space shortcut. |
| 3 | User Control and Freedom | 2 | A session that ran to zero can only be saved. Saved sessions can't be deleted. The welcome dialog can't be dismissed. |
| 4 | Consistency and Standards | 3 | Three primary-button styles in one loop. Buttons get a strong focus outline, links a faint ring. |
| 5 | Error Prevention | 3 | Finish sits 10px from Pause. Esc leaves without asking (recoverable). |
| 6 | Recognition Rather Than Recall | 3 | The difference between Finish, Leave and Discard is never stated. Shortcuts live only in tooltips. |
| 7 | Flexibility and Efficiency | 2 | Only Space and Esc exist. Begin isn't focused: 9th tab stop on the dashboard, 11th on Focus setup. |
| 8 | Aesthetic and Minimalist Design | 3 | Dashboard is restrained. Focus is noisier: moving backdrop, "PAUSED" twice, task title three times on the ending card. |
| 9 | Error Recovery | 3 | An input in its error state loses its focus indicator, and its red border is 1.90:1. |
| 10 | Help and Documentation | 2 | No help surface. Sample tasks aren't labelled as samples. |
| **Total** | | **27/40** | **Acceptable (top of the band, one under Good)** |

All ten heuristics applied (Operate surface); none scored n/a.

## Design Specificity Verdict

**LLM assessment.** The dashboard no longer reads as generated and is not overwhelming. Two ideas could not be lifted into another product:
- The launcher sentence. "focus for 25m on <task>" is the page heading, uses the same grammar as the Focus setup card, and its Begin button takes the subject's colour.
- The "a" meter. The logo's letter fills with today's sessions as subject-coloured bands, and the just-saved band grows in on return.

Specificity drops on the Focus screen itself. The running state is a standard thin-numeral countdown ring over an off-the-shelf animated mesh (Vanta topology), and the task shrinks to a truncated pill in the corner. The welcome dialog (logo, tagline, one input, one pill button) is also interchangeable.

Does it revolve around Focus? On the dashboard, yes: one filled button, everything else quieter. The gap is reach: only the three soonest-due tasks can launch a linked session, and the Tasks page has no route into Focus.

**Deterministic scan.** CLI: 0 findings in `src/app/dashboard/page.tsx`, `src/app/focus/page.tsx` and `src/components` (exit 0 each). In-browser detector, five views:

| Rule | Where | Verdict |
|---|---|---|
| `layout-transition` | Logo, every view (`src/components/layout/AnimatedAimLogo.tsx:43-52`) | True, low severity. About 3.1s after load the logo shrinks 64→32px and the centred nav shifts 16px left. |
| `flat-type-hierarchy` | Dashboard | Half false positive. The headline spans render at 36px; the detector read the h1 wrapper (16px). True part: the "After this" h2 is 14px, same as body. |
| `gpt-thin-border-wide-shadow` | Focus setup card (64px blur), context pill (16px), ending card (44px) | True, advisory. |

A `dark-glow #ffba00` reading was the detector's own overlay and is discarded.

**Visual overlays.** The detector ran in the page on all five views, but the pane was hidden and the live server is stopped; no overlay is on screen.

## Overall Impression

The dashboard is finished enough to leave alone. The remaining work is in Focus, and most of it is accessibility basics and one dead end, not design. Biggest opportunity: a session that runs to zero currently forces the student to log it.

## What's Working

1. One sentence in two places: the dashboard heading and the Focus setup card share the same sentence, script face only on the connecting words. The student sees the session already composed and only has to agree.
2. The "a" as the day's vessel (`FocusTarget`, `src/app/dashboard/page.tsx`): the brand mark is the data display, and it closes the loop on return to the dashboard.
3. Session resilience: leave, return and "Keep going" all preserved the session in a live walkthrough; end-timestamp timer, sessionStorage restore, distinct running/paused/finished headlines, nav made inert under Focus.

Previous run's fixes held: input, stepper and rating edges 3.07:1, form labels 6.72:1, every text pair at or above 4.5:1 except one aria-hidden separator dot (2.06:1).

## Priority Issues

**1. [P1] A session that ran to zero can only be saved**
- What: the ending card offers "Save session" only; "Keep going" appears only when `secondsLeft > 0` (`src/app/focus/page.tsx:714`, `:1126`). Leaving turns the dashboard into a single "Finish saving" button; `/focus` always restores the ending card.
- Why it matters: a student who walked away or started the wrong task must log time they didn't do, polluting the meter and goal. Saved sessions can't be removed (`contexts.tsx` has no remove). The only way out is closing the tab.
- Fix: a quiet two-step "Don't save" on the ending card and beside "Finish saving", reusing the existing Discard control.
- Suggested command: /impeccable harden

**2. [P2] Keyboard focus rings are too faint on links and inputs**
- What: buttons get the global outline `#60729f` (4.2–4.8:1). Links and menu items override it with `focus-visible:ring-baltic-400/70`, measured 2.01–2.17:1 (need 3:1): "25m", "or focus without a task", "Adjust goal", "See all tasks", both After-this rows, "Keep going". Text inputs show a ring at 1.22–1.36:1. An input in its error state shows no indicator (`src/components/ui/Input.tsx:28`) and its red-300 border is 1.90:1.
- Why it matters: a keyboard user can't see where they are on the dashboard's secondary actions.
- Fix: delete the per-element ring overrides so the global `:focus-visible` outline applies. 27 uses across five files (tasks 17, dashboard 6, focus 2, SubjectSelector 1, TopNav 1). Give the error state `focus:ring-2` and a darker red border.
- Suggested command: /impeccable polish

**3. [P2] The Focus screen clips its content and can't scroll**
- What: the root is `fixed inset-0 ... overflow-hidden` (`src/app/focus/page.tsx:504`). Measured independently by both reviewers: at 1280×800 the New-subject form's bottom edge is at 818.8px and Add/Cancel are cut off; at 1280×620 they are fully off-screen; at 640×400 (200% zoom) the setup card spans y −31 to 439.
- Why it matters: on an ordinary laptop a student adding their first subject can't see the Add button (Enter still works). Zoom users lose parts of every stage.
- Fix: make the stage `overflow-y-auto` with `min-h-full` centring.
- Suggested command: /impeccable adapt

**4. [P2] The end of a session is silent**
- What: the only signal outside the page is `document.title` changing to "Done", which can lag up to a minute in a background tab. No Audio or Notification anywhere in `src`.
- Why it matters: the intended use is studying in another window or a book; the student overruns unknowingly and the completion moment never lands.
- Fix: a soft chime at done. An opt-in browser notification is the larger version.
- Suggested command: /impeccable delight

**5. [P2] The moving backdrop can't be stopped**
- What: the Vanta mesh animates for the whole session (`src/components/ui/TopologyBg.tsx`). OS-level reduced motion now stops it; everyone else has only a colour choice.
- Why it matters: perpetual motion behind a concentration timer works against the product's purpose; motion over five seconds needs an in-page stop (WCAG 2.2.2); it is the most template-looking element in the flow.
- Fix: add "Still" to the backdrop menu.
- Suggested command: /impeccable quieter

## Persona Red Flags

**Alex (power user)**
- Begin isn't focused on arrival: 9th tab stop on the dashboard, 11th on a prefilled Focus setup (focus starts on body).
- Rating has no 1–4 keys; Enter in the note field doesn't save.
- Nav items are buttons with `router.push` (`TopNav.tsx:53-65`): no middle-click or open in new tab.
- Resuming after Leave takes two presses: "Return to focus", then "Resume".
- The welcome dialog can't be skipped: Esc and backdrop click do nothing.

**Sam (accessibility-dependent)**
- Focus setup and running have no headings; the ending card has an h2 with no h1.
- The task field has only a placeholder, no label (`src/app/focus/page.tsx:793-801`).
- "+ 5 min" is announced as "5 min".
- Keyboard-activating Pause or Resume drops focus to body (two separate buttons, `:978-994`); same after Finish and after the welcome dialog closes.
- The duration stepper announces nothing when the value changes.
- "Confirm discard" disarms after 3s with no announcement.
- The dashboard length menu stays open and covers Begin after tabbing out.
- Colour swatches are named "Colour 1" to "Colour 10" (`SUBJECT_COLOR_NAMES` TODO).

**Jordan (first visit)**
- A name is demanded before anything is shown, with no word on why or that it stays on the device.
- The launcher tells them to focus on "Lab report — Organic compounds", an unlabelled sample task.
- Finish, Leave and Discard are three unexplained ways to stop.
- Four rating circles with no words until one is chosen.
- "Mark done" gets no confirmation on return.

## Cognitive Load

2 of 8 checklist items fail (moderate): chunking and minimal choices. Decision points over 4 options: Focus duration (6 controls for one value), subject list (7 plus New subject), Focus running (Pause, Finish, Discard, +5 min, Leave, Backdrop), ending card (up to 10, all but Save optional). The dashboard has 5 routes to start, mitigated by one filled button.

## Minor Observations

- The highlighter swipe reads as a smudge at 14px; it only works at headline size.
- Subject rows highlight across about 35px but only the inner 20px strip is clickable; delete buttons are 16×16.
- "Save session" is 137×38 with no tap-target extension.
- `.focus-btn` edges are 1.47:1 against the canvas; labels carry them.
- Selected rating ring 1.52:1; text label and glyph change carry it.
- Nested `<main>` on Focus (`AppShell.tsx:44`, `focus/page.tsx:672`); every page shares one `<title>`.
- "paused on" plus "Session paused · 24m left" says it twice.
- Not covered by the reduced-motion block: the logo sequence (`AnimatedAimLogo.tsx:25-52`), `.focus-btn:active` scale, `active:scale-[0.98]` on Begin, hover scale on avatar and swatches.
- Unused animation classes in `globals.css`: `.timer-pulse`, `.tick-enter`, `.reflection-enter`.
- The launcher is fixed to the earliest-due task; focusing on another means retyping it and losing the taskId link.
- No sideways scroll on dashboard or Focus at 1280 or 375.

## Questions to Consider

1. The dashboard composes the sentence and Focus composes it again. Why are there two setup screens?
2. The running screen's hero is a clock the student isn't supposed to watch. What if the hero were the task?
3. If Focus had to earn a place on a second monitor for 90 minutes, would it have a moving backdrop and a mantra, or the "a" slowly filling?
