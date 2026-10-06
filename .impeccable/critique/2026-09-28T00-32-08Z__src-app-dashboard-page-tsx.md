---
target: dashboard (with Focus as the center)
total_score: 24
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 4
target_identity: "file:C:\\Portfolio\\aim\\src\\app\\dashboard\\page.tsx"
target_fingerprint: "sha256:1d7c6ecf91e13bc46131a63416c0e35e8471b498dccc678853b3ba6e945f1702"
target_path: "C:\\Portfolio\\aim\\src\\app\\dashboard\\page.tsx"
timestamp: 2026-09-28T00-32-08Z
slug: src-app-dashboard-page-tsx
closed: true
---
Method: dual-agent (A: isolated design-review agent · B: isolated detector + browser agent)

## Design Health Score: 24/40 (Acceptable)

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Focus states are excellent; the dashboard's "a" meter shows no number and reads ambiguously |
| 2 | Match System / Real World | 3 | Student language; "5D STREAK" is shorthand |
| 3 | User Control and Freedom | 3 | Undo and two-step Discard/Exit are good; the welcome modal can't be dismissed |
| 4 | Consistency and Standards | 2 | Three button systems; Focus is light-only; strips, tape and stripes all mark cards |
| 5 | Error Prevention | 3 | Clamps and confirms; Mark done sits right next to Start |
| 6 | Recognition Rather Than Recall | 2 | The dashboard's suggestion must be re-entered on /focus |
| 7 | Flexibility and Efficiency | 2 | Focus has Space/F/Esc; no path from a task into Focus |
| 8 | Aesthetic and Minimalist Design | 2 | Focus is near a 4; the dashboard near 1.5 |
| 9 | Error Recovery | 2 | The duplicate-subject check fails silently |
| 10 | Help and Documentation | 2 | The core loop (plan, focus, reflect) is never taught |
| **Total** | | **24/40** | **Acceptable** |

## Design Specificity Verdict

**LLM assessment.** Roughly 70% of the dashboard could belong to any product in the category: a greeting with the name, date and streak chips, cards with uppercase labels and colored top strips, a progress visual next to a headline and a button, and a list grouped by day.

It reads as AI-made because every device is a known "make it look designed" move, applied side by side with nothing deciding which ones belong. The devices come from four worlds:
- **desk:** dot grid, paper cards;
- **stationery:** highlighter, Caveat, trailing periods, polaroids;
- **SaaS template:** eyebrows, mono chips, blobs, staggered entrances, the visual-plus-number hero;
- **Focus's instrument world:** contour lines, the tick ring, the sentence, subject color.

Focus feels authored because it has one idea: a sentence, then an instrument, on a quiet contour surface. The dashboard spends its effort on the frame rather than the action. The name is 48px and the glyph 176px, while the only Start button is a 14px pill in column three.

**Deterministic scan.**
- The CLI found 0 findings.
- The in-browser detector found 19 on /dashboard against 4 on /focus:
  - 14 labels at 10px;
  - 11 text elements at 3.77:1 contrast;
  - a kicker above a heading ("RIGHT NOW");
  - an overused font (Plus Jakarta Sans, 83% of text).
- Measurements, dashboard vs /focus: 60 vs 19 text elements, 11 vs 7 text colors, 14 vs 1 uppercase labels, 11 vs 2 animated elements.
- The measurements also caught what the detector missed: the date at 2.43:1, "Adjust goal" and "5 pending" at 2.75:1, and the day counts at 2.06:1.
- False positives: the spotlight-glow flag on the tiled 1px dot grid, and a duplicated logo-transition flag.
- At a 375px width the page is 455px wide (80px overflow), caused by a blob and the nav.

## Priority Issues

1. **[P1] No governing idea: four visual worlds on one page.**
   - **Why:** this is the AI-slop feeling.
   - **Fix:** make the Focus sentence the governing idea and cut the devices that don't serve it, starting with the label layer.
   - **Command:** /impeccable distill, then /impeccable quieter.
2. **[P1] The hierarchy is inverted.**
   - **What:** the name (48px) and the glyph (176px) outrank a 14px Start button, and Focus is never previewed.
   - **Fix:** make starting a session the largest, first thing, and demote the greeting.
   - **Command:** /impeccable layout.
3. **[P1] Feature overload.**
   - **What:** about 15 targets in the first viewport, and "This week" duplicates /tasks. 5 of 8 cognitive-load checks fail.
   - **Fix:** one primary action; turn the week list into "After this" with two items; move Mark done to the end of a session.
   - **Command:** /impeccable distill.
4. **[P1] The Start → Focus handoff is broken.**
   - **What:** Focus opens blank, with the length hard-coded to 25 (focus/page.tsx:56).
   - **Fix:** pass subject, task and length into Focus.
   - **Command:** /impeccable shape, then harden.
5. **[P0 keyboard / P1 mobile] The craft floor is broken.**
   - **What:**
     - The SubjectSelector options are div onClick (line 119), so keyboard users can never start a session.
     - The page overflows 80px at 375px, and Start sits below the fold.
     - 11 contrast failures.
   - **Command:** /impeccable harden, then adapt.

## Persona Red Flags

- **Jordan (first-timer / portfolio visitor):**
  - The sample streak and minutes aren't labeled as sample data.
  - The "a" doesn't read as progress, and "5D" is cryptic.
  - Start breaks its promise.
  - Focus, the best work, is hidden one click away.
- **Casey (mobile):**
  - The page scrolls sideways, and Start is below the fold.
  - The duration presets are about 24px tall.
  - Mark done sits next to Start.
  - A running timer is lost if the tab is killed.
- **A student about to study (8pm, lab report due tomorrow):**
  - It takes 4 or more interactions to reach a running timer, re-entering what the app already knew.
  - The session can't be tied to the task, and the task can't be marked done at the end of the session.
  - The Ambient menu is empty, and there's no dark Focus.

## Minor Observations

- The highlighter's padding leaves a gap before the period: "1h 15m to go ."
- The reserved undo slot leaves a permanent gap of about 44px.
- The welcome modal can't be dismissed, and its button shape differs from the others.
- Esc on the Ambient or Backdrop menu exits Focus (reproduced by the reviewer from idle setup).
- White text on the Science-colored Begin button measures 3.38:1.
- High priority is the calmest blue.
- The mantra says "no shortcuts" while the page has shortcuts.

## Questions to Consider

- If the dashboard's only job is to start a focus block, why is the name bigger than the Start button?
- What would a student lose if the dashboard and the Focus setup were the same screen?
- Should a task be completable anywhere except at the end of a focus session?
- Is aim a planner with a timer, or a timer that remembers your plan?
- If the contour lines are the brand, why do they only appear after clicking Focus?
