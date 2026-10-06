---
target: dashboard and Focus after the help, keyboard and copy passes
total_score: 29
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 1
target_identity: "file:C:\\Portfolio\\aim\\src\\app\\dashboard\\page.tsx"
target_fingerprint: "sha256:6b36350cb5ad1fd64d3bffbbfad56327347f7e2c027e48da7951136bddf646d4"
target_path: "C:\\Portfolio\\aim\\src\\app\\dashboard\\page.tsx"
timestamp: 2026-10-06T05-06-04Z
slug: src-app-dashboard-page-tsx
---
Method: dual-agent (A: isolated design-review sub-agent · B: isolated detector and browser-evidence sub-agent)

# Critique: aim dashboard and Focus, after the help, keyboard and copy passes

29/40, up from 27. Efficiency and help rose from 2 to 3; minimalism fell from 3 to 2 because of the Focus backdrops. Both reviewers independently found that Esc in the backdrop menu also leaves the session.

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Tab title, live dashboard states, role=status announcements. Ring track 1.10:1; goal-crossing only a 14px line. |
| 2 | Match System / Real World | 3 | Natural sentence and button copy. Backdrop colour names are token names; "Cream" renders olive (#949b31). |
| 3 | User Control and Freedom | 3 | Leave keeps the session; two-step Discard. A chosen rating can't be cleared; welcome dialog can't be dismissed. |
| 4 | Consistency and Standards | 3 | Esc differs across popovers (help ok, profile ignores, length menu partial, backdrop exits Focus). Nav items are buttons. |
| 5 | Error Prevention | 3 | Strong guards. Enter on arrival at the ending card rates "Scattered"; unsaved session lost silently if the tab closes on the dashboard. |
| 6 | Recognition Rather Than Recall | 3 | Launcher names everything. Backdrop trigger is an unlabelled dot; "a" hint only until the first session. |
| 7 | Flexibility and Efficiency | 3 | Enter/Space/Esc/1–4/Enter-in-note work. Saving without a rating takes 4–5 Tabs; "Adjust goal" leaves the page. |
| 8 | Aesthetic and Minimalist Design | 2 | Dashboard near 4. Focus default Contours crosses the timer and runs under controls; Birds fly through the clock. |
| 9 | Error Recovery | 3 | Clear form errors. Task whose subject was deleted lands on setup unexplained (focus/page.tsx:370). |
| 10 | Help and Documentation | 3 | New panel concise and reachable. Copy partly wrong; clipped at 375 on Focus. |
| **Total** | | **29/40** | **Good** |

All ten heuristics applied (Operate surface).

## Design Specificity Verdict

**LLM assessment.** The dashboard is specific: launcher sentence as headline in the Focus card's grammar, the "a" filling with subject-coloured bands, handwritten connecting words and highlighter. Focus is weaker: a standard Pomodoro ring layout and a stock Vanta animation as its loudest element, on the screen used longest.

**Deterministic scan.** CLI: 0 findings on src/app/dashboard/page.tsx, src/app/focus/page.tsx, src/components (exit 0, also with --no-config). Browser (6 views): layout-transition on the logo (AnimatedAimLogo.tsx:48-49, true, low); gpt-thin-border-wide-shadow on help panel (HelpButton.tsx:82), backdrop list (focus/page.tsx:643), context pill (.focus-panel), reflection card (focus/page.tsx:1178), setup card (focus/page.tsx:835) — true as measured, advisory, and matching DESIGN.md's documented floating shadow; text-overflow on the pill's task span (truncate max-w-[22ch], no title, focus/page.tsx:611) — true, minor; flat-type-hierarchy — half false positive (h1 wrapper reads 16px, spans render 24/36px; true part: h2 "After this" is 14px); dark-glow #ffba00 — false positive (detector's own overlay). Overlay not on screen; live server stopped.

## Overall Impression

The keyboard loop works end to end, the dashboard is close to finished, and help exists. Remaining work concentrates in Focus: one keyboard bug, inaccurate help copy, backdrops competing with the timer.

## What's Working

1. The launcher sentence: one sentence, one pre-filled action, Begin autofocused so Enter is the fastest path.
2. The "a" meter: identity, data and reward in one mark; the peak is placed where the student lands after saving.
3. Session safety: leave pauses, honest live states, beforeunload on Focus, two-step Discard, ?start=1 can't overwrite a live session; the whole loop worked keyboard-only.

Measured passes: all text except one item (steel-600 5.49:1 on white, 4.86:1 on baltic-50); focus indicators 4.22–4.77:1; no sideways scroll at 1280 or 375; Esc with help open closes help and keeps the session.

## Priority Issues

**1. [P1] Esc in the backdrop menu pauses the session and leaves Focus**
- What: the popover's document-level Esc handler (focus/page.tsx:498–507) closes the menu and refocuses the trigger; the window-level handler (461–488) then runs handleExit in the same keypress. Reproduced 2/2 by each reviewer, running and paused.
- Why: Esc closes menus everywhere else; here it ends the session.
- Fix: stop propagation at the menu, as HelpButton and SubjectSelector do.
- Command: /impeccable harden

**2. [P2] Help copy partly wrong; panel clipped on phones**
- What: "Finish early — Ends now and logs the time so far" is untrue (it opens the save screen; nothing is logged until Save session); the Finish early tooltip says the same. "Enter" and "1–4" only work with focus on Begin or the rating. At 375 on Focus the panel extends ~85px past the left edge.
- Fix: reword (HelpButton.tsx:12–24, Finish early title); clamp the panel width to the viewport (HelpButton.tsx:82).
- Command: /impeccable clarify

**3. [P2] The default Focus backdrop competes with the timer**
- What: Contours (baltic-400 lines ~2.9:1 vs canvas) crosses the frosted centre and runs under Pause/Finish early; Discard over a line is 1.68:1 before halo; Birds fly over the countdown. Fog is calm.
- Fix: default to Fog or Still, or mix Contours' line colour 60–70% toward the canvas and keep the ring clear (focus/page.tsx:32–48, default at :151; VantaBg.tsx:27–49).
- Command: /impeccable quieter

**4. [P2] Ending card keyboard path records the worst rating and can't undo it**
- What: autoFocus lands on "Scattered" (QualityIndicator.tsx:107); Enter rates it. Clicking a selected circle keeps it selected. Saving unrated takes 4–5 Tabs.
- Fix: clicking the selected circle clears it; focus Save session on arrival with 1–4 still scoped to the scale.
- Command: /impeccable harden

**5. [P2] Wrong screen-reader description after saving; quiet goal peak**
- What: in the just-logged state Begin's aria-describedby resolves to "just logged 1m of Languages", not the next task. Goal crossing changes only the 14px status line and the check in the "a".
- Fix: describe Begin by the "Next, focus for…" line in that state (dashboard/page.tsx:433–452, 615–624); add a headline line when the goal is crossed.
- Command: /impeccable delight

## Persona Red Flags

**Alex (power user):** welcome dialog unskippable (no close, Esc no-op); after closing help with Esc focus is on "?", so Space reopens help; After-this rows open setup, not a running timer.

**Sam (keyboard / screen reader):** backdrop Esc ends the session; arriving on running Focus leaves focus on body; Focus has no h1 and two nested main landmarks; profile menu ignores Esc; length menu stays open after tabbing out; single-choice groups use aria-pressed toggles rather than radios.

**Jordan (first visit):** first Begin starts a 25-minute timer on a sample task with no preview; colour names meaningless ("Cream" is olive); "Add your first task" lands on Tasks without opening the form; the "a" hint disappears after the first session.

## Cognitive Load

2 of 8 fail (moderate): single focus (Focus running with Contours/Birds) and minimal choices. Over 4 options: Focus running 7 controls; ending card ~12; backdrop menu 8 (chunked 4+4); blank setup 9; dashboard body 7 (primary still unmistakable).

## Minor Observations

- Red "overdue" on #eff1f5 is 4.27:1 (needs 4.5) — the one real text-contrast failure (dashboard/page.tsx:909, 918).
- Progress arc and track below 3:1 (countdown carries the same information).
- Context pill truncates at 22ch with no title.
- "25 / MINUTES" on Focus vs "25m" elsewhere; "overdue" vs "Overdue".
- Finished-but-unsaved session lost silently if the tab closes on the dashboard (no beforeunload there); no chime for a session ending while on the dashboard.
- Under 44px: logo 32×32, desktop nav pills 32px tall, Save session 137×38, backdrop menu rows 206×36.
- Not covered by reduced motion: .focus-btn:active scale, active:scale-[0.98], After-this chevron translate, length-menu chevron rotate, progress arc transition, subject wash transition, AnimatedAimLogo sequence.

## Questions to Consider

1. Should the Focus screen's most visible element be the student's own time rather than a stock animation (Still by default, ring in the subject's colour)?
2. Should the end of a session be the peak rather than a form?
3. Should a first visit offer a one-minute demo session for a reviewer with 90 seconds?
