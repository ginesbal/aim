---
target: dashboard (with Focus as the center), re-run after the 7-step cleanup
total_score: 26
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:C:\\Portfolio\\aim\\src\\app\\dashboard\\page.tsx"
target_fingerprint: "sha256:f45e38a90ec246b01d0ddcedf0ffa009902c401ebe4fd7aa51a85589d05f4d9d"
target_path: "C:\\Portfolio\\aim\\src\\app\\dashboard\\page.tsx"
timestamp: 2026-09-30T02-38-13Z
slug: src-app-dashboard-page-tsx
closed: true
---
Method: dual-agent (A: isolated design-review agent · B: isolated detector + browser agent)

## Design Health Score: 26/40 (Acceptable), up from 24/40

| # | Heuristic | Score (was) | Key issue |
|---|---|---|---|
| 1 | Visibility of System Status | 3 (3) | The dashboard's status is strong. After Save or Skip, Focus silently resets to an empty setup card, and paused looks almost the same as running. |
| 2 | Match System / Real World | 3 (3) | The launcher sentence reads naturally. The empty "a" reads as a grey teardrop, and "Skip" hides that the session is still saved. |
| 3 | User Control and Freedom | 3 (3) | Two-step Exit and Discard, and Esc works. Begin always uses the default length. |
| 4 | Consistency and Standards | 2 (2) | ▶ starts the timer on Begin but only opens setup on "After this" rows. Begin is the subject colour while Focus's buttons are slate. Dark mode stops at Focus. |
| 5 | Error Prevention | 2 (3) | Reloading, closing the tab, or Tab+Enter onto the hidden nav throws away a running session. |
| 6 | Recognition Rather Than Recall | 3 (2) | The Tasks-to-Focus handoff needs nothing retyped. Shortcuts are only in tooltips, and "25m" looks adjustable but isn't. |
| 7 | Flexibility and Efficiency | 3 (2) | One click to a running timer. Begin is the 7th Tab stop, and nav links can't open in a new tab. |
| 8 | Aesthetic and Minimalist Design | 3 (2) | Calm, about three things on the page. The meter sits stranded at the right of a 1088px card. |
| 9 | Error Recovery | 2 (2) | The duplicate-subject message is good. An empty welcome-dialog submit does nothing, and lost sessions can't be recovered. |
| 10 | Help and Documentation | 2 (2) | Only small hints. The core loop is never taught. |
| **Total** | | **26/40** | **Acceptable** |

## Design Specificity Verdict

**LLM assessment.** The centre is specific to aim; the frame is generic.
- **Specific:** the launcher sentence "focus for 25m on <task>", Begin in the subject colour, clock-time framing, and the logo's "a" as the meter.
- **Generic:** a greeting, an avatar circle, a pill nav, a white rounded card with a soft shadow, and Plus Jakarta Sans plus Caveat plus a highlighter. That combination is the house style of AI-made "calm productivity" apps.

**Deterministic scan.**
- The CLI found 0 findings in 6 files.
- The browser detector found 3 on /dashboard, down from 19:
  - layout-transition on the logo (AnimatedAimLogo.tsx:49);
  - low-contrast on the highlighted "2h" at 4.46:1 (page.tsx:380);
  - an overused font (Plus Jakarta Sans at 95% of text).
- It found 4 on /focus, adding 10px undersized text and an advisory gpt-thin-border-wide-shadow on the setup card.
- Measurements on the dashboard, baseline vs now:
  - text elements 60 → 30;
  - text colours 11 → 7;
  - uppercase labels 14 → 0;
  - animated elements 11 → 1;
  - phone overflow 80px → 0;
  - Begin is above the fold on phones.
- False positives:
  - dark-glow on the detector's own overlays;
  - the disabled Begin contrast (disabled controls are exempt);
  - truncate "overflow" at 296px;
  - the tap-target size of "Adjust goal" and "See all tasks" (they have 44px pseudo-element hit areas);
  - a dark-mode load caused by a concurrent dark-mode test in another tab.

## Priority Issues

1. **[P1] Focus doesn't seal off the app behind it, and sessions die silently.**
   - **What:** TopNav stays in the Tab order and the accessibility tree under the z-50 Focus canvas, giving 6 invisible Tab stops (AppShell.tsx:21, focus/page.tsx:387).
   - **Why:** Enter on one of them, a reload, or closing the tab loses the running session without a confirm.
   - **Fix:** make the shell inert on /focus, add a beforeunload guard, and persist the session in sessionStorage.
   - **Command:** /impeccable harden
2. **[P1] The session loop has no ending.**
   - **What:** Save and Skip reset to an empty setup card (focus/page.tsx:201-222).
   - **Why:** the reward (the "a" filling) is never seen. "Skip" saves while "Exit" discards, with no explanation.
   - **Fix:** return to the dashboard with the new band animating in, plus "25m of Science logged · 1h 35m to go" and the next task. Rename Skip to "Save without rating".
   - **Command:** /impeccable shape
3. **[P2] The "a" meter doesn't land its idea.**
   - **What:** the empty "a" is a grey teardrop (about 1.3:1 in light, 1.1:1 in dark). Four of the seven default subject colours are near-identical slate blues (types.ts:76-84).
   - **Fix:** draw the empty "a" as an outline, spread the default subject colours further apart, and state the goal once, next to the meter.
   - **Command:** /impeccable colorize
4. **[P2] Dark mode stops at the Focus door.**
   - **What:** Focus flashes to a full-screen light background in dark mode (globals.css:528, TOPO_BG).
   - **Fix:** add a dark background that follows the app theme.
   - **Command:** /impeccable adapt
5. **[P2] The same ▶ does two different things, and "25m" looks adjustable but isn't.**
   - **What:** there's no way to choose the length or focus without a task from the launcher.
   - **Fix:** give the "After this" rows a chevron, make 25/45/60 a choice inside the sentence, and add "or just focus".
   - **Command:** /impeccable clarify

## Persona Red Flags

- **Alex (power user):**
  - Begin is the 7th Tab stop.
  - Nav items are buttons, not links, so they can't open in a new tab.
  - Changing the length takes 5 actions.
  - Shortcuts are only in tooltips, while the mantra says "no shortcuts".
- **Sam (screen reader, keyboard only):**
  - 6 invisible Tab stops behind Focus.
  - The "After this" aria-label hides "Overdue".
  - Arming the Exit confirm with Esc isn't announced.
  - The welcome dialog has no accessible name, and its input has no label.
  - On phones, +5 min is 27px and Pause and Finish are 38px.
- **Jordan (first-timer, portfolio reviewer):**
  - A welcome dialog that can't be dismissed.
  - The sample due dates go stale and show "overdue" as the headline.
  - The grey "a" doesn't explain itself.
  - Begin starts a timer immediately.
  - There's no confirmation after Save.

## Minor Observations

- The h1 is the greeting while the launcher is an h2.
- The highlighted "2h" is 4.46:1 in light and about 3:1 in dark.
- 10px "minutes" and "Focusing on".
- The reflection's task line is 11px italic.
- Begin has a heavy drop shadow.
- The "After this" row hover barely changes the row.
- The disabled "Save reflection" is barely legible.
- The logo has a width/height transition.
- The Focus setup card has a wide soft shadow.
- last7 and StreakChip are still computed while hidden.
- The desktop nav has no aria-label.
- SUBJECT_COLOR_NAMES is empty (the owner's TODO).
- The overused-font flag is still unresolved.

## Questions to Consider

- Is the "a" a reward or a decoration? If it's the reward, why is it never seen at the end of a session?
- If the launcher sentence is the signature, why isn't every part of it adjustable in place?
- Remove the greeting, avatar and pill nav: does anything get lost?
- Is the light-only Focus a deliberate "study lamp", or an unfinished edge?
