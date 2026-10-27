---
name: aim
description: A calm study app built around the focus session.
colors:
  baltic-50: "#eff1f5"
  baltic-100: "#dfe3ec"
  baltic-500: "#60729f"
  baltic-600: "#4d5b80"
  baltic-700: "#394460"
  baltic-800: "#262d40"
  lavender-50: "#f0f1f4"
  lavender-200: "#c5c9d3"
  lavender-400: "#8b93a7"
  steel-300: "#afb6b6"
  steel-600: "#616b6b"
  ash-500: "#76946b"
  cream-300: "#d5da8b"
  cream-600: "#949b31"
  paper: "#ffffff"
  error: "#dc2626"
typography:
  countdown:
    fontFamily: "Bricolage Grotesque, system-ui, sans-serif"
    fontSize: "3.75rem"
    fontWeight: 200
    lineHeight: 1
    letterSpacing: "-0.025em"
    fontFeature: "\"tnum\""
  headline:
    fontFamily: "Bricolage Grotesque, system-ui, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.025em"
  connector:
    fontFamily: "Newsreader, Georgia, serif"
    fontSize: "1.08em"
    fontWeight: 400
    fontStyle: "italic"
    letterSpacing: "0"
  title:
    fontFamily: "Bricolage Grotesque, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
  body:
    fontFamily: "Bricolage Grotesque, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Bricolage Grotesque, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 400
    letterSpacing: "0.18em"
  mono-label:
    fontFamily: "JetBrains Mono, Fira Code, monospace"
    fontSize: "0.625rem"
    fontWeight: 400
    letterSpacing: "0.18em"
rounded:
  md: "6px"
  xl: "12px"
  2xl: "16px"
  3xl: "24px"
  full: "9999px"
spacing:
  gutter-phone: "16px"
  gutter-desktop: "32px"
  card: "24px"
  focus-card: "32px"
components:
  button-begin:
    backgroundColor: "{colors.baltic-500}"
    textColor: "{colors.paper}"
    rounded: "{rounded.full}"
    padding: "14px 28px"
  button-primary:
    backgroundColor: "{colors.baltic-600}"
    textColor: "{colors.paper}"
    rounded: "{rounded.full}"
    padding: "8px 24px"
  button-primary-hover:
    backgroundColor: "{colors.baltic-700}"
  button-secondary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.baltic-700}"
    rounded: "{rounded.full}"
    padding: "8px 16px"
  button-secondary-hover:
    backgroundColor: "{colors.lavender-50}"
  input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.baltic-800}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
  card:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.2xl}"
    padding: "{spacing.card}"
  focus-card:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.3xl}"
    padding: "{spacing.focus-card}"
  nav-item:
    textColor: "{colors.steel-600}"
    rounded: "{rounded.full}"
    padding: "6px 16px"
  nav-item-active:
    backgroundColor: "{colors.baltic-600}"
    textColor: "{colors.paper}"
  chip-selected:
    backgroundColor: "{colors.baltic-100}"
    textColor: "{colors.baltic-700}"
    rounded: "{rounded.full}"
---

# Design System: aim

## Overview

**Creative North Star: "The Annotated Notebook"**

aim looks like study material annotated in the margins, kept calm. White paper cards with a faint grain rest on a pale blue-grey desk. The words that join a sentence ("focus for", "on", "just logged") are set in an italic serif, like a note in a textbook's margin, while what matters (the task, the length, the time) is set in a clear grotesque. The day's progress fills the "a" of the logo like ink.

The north star describes what is already there; it is not a licence to add notebook props. The system is quiet by default: one card, one sentence, one filled button per screen, and everything else steps back. Focus, where the session runs, is the same desk with the furniture cleared away, keeping only the clock, the controls and an optional slow backdrop.

The rejected direction is the generic productivity dashboard: grids of same-size stat cards, competing accents, decoration added to fill space. It was tried, felt AI-generated and overwhelming, and was taken out.

**Key Characteristics:**
- A sentence as the headline: what matters in a bold grotesque, the words that join it in an italic serif.
- Paper cards with soft, layered shadows on a pale blue-grey surface.
- One filled, fully rounded primary button per screen, coloured by the subject.
- Colour carries meaning: a subject's colour, the ink in the "a", the primary action.
- Light theme only for now; motion is slow, optional, and off under "reduce motion".

**The Reason Rule.** Every visual change states the reason it serves (a finding, a user need, a measured problem). A change that only makes something look more like a notebook does not ship.

## Colors

A cool, low-saturation palette: blue-grey for the voice of the product, grey-violet and grey-green for structure and secondary text, with sage and cream as the only warm notes.

### Primary
- **Baltic** (`baltic-500`): the product's accent. The keyboard focus outline and the Begin button when no subject colour applies.
- **Deep Baltic** (`baltic-600`, hover `baltic-700`): filled primary buttons on Focus and in dialogs, the active page in the navigation, and the connecting words of a sentence.
- **Baltic Night** (`baltic-800`): body and heading text.
- **Baltic Desk** (`baltic-50`): the app surface everything rests on, and the Focus canvas. `baltic-100` marks a selected chip.

### Secondary
- **Ash** (`ash-500`): sage. A subject colour and a backdrop colour; never used as a general accent.
- **Cream** (`cream-300`): the highlighter, laid at 55% opacity under a word of a display heading (the empty dashboard's "first aim"). It is not used on small text: at 14px in the status line it read as a stray underline (critique, 2026-10-27). `cream-600` is the Cream backdrop colour.

### Neutral
- **Lavender** (`lavender-200` hairlines, `lavender-400` control edges, `lavender-50` hover): structure. Control edges use `lavender-400` because it is the lightest step that holds 3:1 on white.
- **Steel** (`steel-600` secondary text, `steel-300` separators): grey-green for anything quieter than body text. `steel-600` is the lightest text colour allowed (5.49:1 on white).
- **Paper** (`paper`): every card, menu and input.
- **Error** (`error`): error text and the border of a field in error.

### Subject colours
Ten muted colours that students assign to their subjects: Baltic blue `#60729f`, sage `#76946b`, dusty rose `#b47692`, mustard `#b9a23d`, soft teal `#6ba9bd`, terracotta `#a96249`, ink violet `#4e4d78`, olive `#676e3d`, pale sage `#91a989`, slate `#586074`. They were chosen to stay distinguishable from each other, including for red-green colour blindness. When one fills a button, it is darkened as far as needed for white text to read.

**The Subject Colour Rule.** A subject's colour appears where that subject is: its dot (in lists, the launcher and the meter's legend), the Begin button for it. It is never used decoratively. The "a" itself fills in one ink, the logo's colour, not in subject colours.

## Typography

**Body Font:** Bricolage Grotesque (with system-ui fallback)
**Connecting Font:** Newsreader italic 400, for the words that join a sentence only
**Label/Mono Font:** JetBrains Mono, for small uppercase captions on Tasks and Journal

**Character:** A warm, slightly irregular grotesque carries all content and controls; a reading serif, in italic, joins the words of a sentence, so the headline reads like a line of annotated notes. It replaced Caveat, whose handwriting read as a kid's notebook and sat a size down on a line of its own, so the headline read as a label over a title (critique, 2026-10-27).

### Hierarchy
- **Countdown** (200, 3.75rem, line-height 1, tabular figures): the Focus clock only. Light weight so a large number stays calm.
- **Headline** (700, 1.875rem on phones and 2.25rem from 640px, line-height 1.15, tracking -0.025em): the launcher sentence ("focus for 25m on Lab report"), "just logged 45m of Science" and "paused on …", each one sentence at one size. In the launcher a task title over 72 characters is shortened with an ellipsis (the full title is its tooltip); "paused on …" is clamped to three lines (four on phones).
- **Connecting words** (Newsreader italic 400 at 1.08em of the sentence around them, `baltic-600`, normal tracking): "focus for", "on", "of", "just logged", "paused on", "next, focus for"; 1.125rem on the Focus card. They sit inline at the sentence's size, never on a line of their own.
- **Title** (600, 1.25rem): the greeting. Also 1.125rem 500 for "How focused were you?" on the ending card.
- **Body** (400, 0.875rem, line-height 1.5): status lines, lists, help text. Button labels are 15px 500.
- **Label** (400, 11px, uppercase, tracking 0.18em to 0.22em, `steel-600`): small captions on Focus and in menus ("Focusing on", "of 25:00", "Pattern").
- **Mono label** (JetBrains Mono 400, 10px to 11px, uppercase, tracking 0.16em to 0.18em, tabular figures): dates, counts and filter chips on Tasks and Journal, and the parked day chips on the dashboard. Not used on Focus or in the launcher.

**The Connecting Words Rule.** The italic serif only joins the words of a sentence. It never carries content, a number or a control label.

## Layout

The dashboard is a single centred column, 896px wide at most, inside a page frame of 1152px with 16px gutters on phones and 32px from 640px. A fixed 64px top bar holds the logo, the page navigation, help and profile; on phones the navigation moves to a bottom tab bar.

The launcher card is a two-column grid from 1024px: the sentence and its button on the left, the "a" meter (144px) in an 11rem column on the right. Below 1024px the meter drops under the sentence. "After this" is a plain list under the card, not more cards.

Focus is a full-screen canvas. Its stage is centred and scrolls when it is taller than the window, so nothing is ever cut off. Controls sit at the top right; the session's context pill sits at the top left (on phones, on its own row below the controls). During a session, "Hide timer" (top right) clears the clock and its controls so the backdrop shows whole; the pill then carries the countdown (and "Paused") and brings the timer back when clicked. The timer returns by itself when the session ends.

**The One Filled Button Rule.** Each screen has exactly one filled primary button. Everything else is a secondary pill, an underlined text link or a plain row.

## Elevation & Depth

Depth is paper on a desk. Cards rest with a soft, layered shadow that reads as a sheet lifted a millimetre; anything that floats above the page, such as a menu, popover or dialog, gets a deeper shadow; the primary button carries a small lift of its own. There are no glows and no hard offset shadows.

### Shadow Vocabulary
- **Resting paper** (`box-shadow: 0 1px 1px rgba(38,45,64,.04), 0 4px 8px -2px rgba(38,45,64,.06), 0 14px 28px -10px rgba(38,45,64,.10)`): dashboard cards.
- **Floating** (`box-shadow: 0 16px 36px -12px rgba(38,45,64,.28)`): menus and popovers (length menu, subject list, backdrop menu, help).
- **Focus card** (`box-shadow: 0 18px 44px -14px rgba(38,45,64,.22)`): the setup and ending cards on the Focus canvas.
- **Primary lift** (`box-shadow: 0 6px 16px -8px rgba(38,45,64,.35)`): the Begin button.

**The Rest and Float Rule.** Things on the page rest; only things above the page float. A card never gets a floating shadow.

## Shapes

Soft and round, never sharp. Buttons, chips, navigation items and the context pill are fully rounded. Cards and menus use 16px corners, the larger Focus cards 24px, inputs 6px. Borders are 1px hairlines (`lavender-200`) on surfaces and 1px `lavender-400` on controls that need a visible edge. The one custom silhouette is the "a" of the logo, used as the progress meter.

## Components

Soft and tactile: fully rounded pills that press in slightly (scale 0.97 over 160ms), soft paper shadows, one coloured action per screen.

### Buttons
- **Shape:** fully rounded.
- **Begin** (`button-begin`): filled with the subject's colour (Baltic by default), white 15px label with a play mark, primary lift shadow. The only filled button on the dashboard.
- **Primary** (`button-primary`): `baltic-600`, white label, used on Focus (Pause / Resume, Save session) and in dialogs.
- **Secondary** (`button-secondary`): white with a 1px `lavender-200` edge and `baltic-700` label; hover `lavender-50`. Finish early, Pause & leave, the backdrop and help buttons.
- **Text links:** `steel-600`, 14px 500, underlined; for quieter alternatives ("or focus without a task", "Adjust goal", "Keep going").
- **Discard:** plain `steel-600` text that turns red on hover and asks once more ("Confirm discard") before acting.
- **Focus:** a 2px `baltic-500` outline, offset 2px, on every control; links and menu rows draw the same colour as a 2px ring.

### Chips
- **Style:** text-only pills for duration presets (25m, 45m, 1h, 1h 30m).
- **State:** the selected chip fills with `baltic-100` and darkens its label to `baltic-700`.

### Cards / Containers
- **Corner Style:** 16px on the dashboard, 24px on Focus.
- **Background:** paper, with a faint grain on dashboard cards.
- **Shadow Strategy:** resting paper; Focus cards use the focus-card shadow.
- **Border:** 1px `lavender-200` at reduced opacity.
- **Internal Padding:** 24px (20px on phones); 32px on Focus cards.

### Inputs / Fields
- **Style:** white, 1px `lavender-400` edge, 6px corners (fully rounded on the Focus card), 14px text, `steel-600` placeholder.
- **Focus:** the shared `baltic-500` outline, plus the edge shifting to `baltic-400`.
- **Error:** `error` edge and a short message below that says what to do.

### Navigation
- **Desktop:** page names as pills inside a `baltic-50` track; the active page fills `baltic-600` with a white label; inactive pages are `steel-600`.
- **Phone:** a four-item bottom tab bar with an underline marker on the active page.

### The "a" meter
The logo's "a" drawn as an outline (counter included, so the empty letter still reads as an "a") and filled from the bottom with one ink, `baltic-700`, the logo's colour, up to today's share of the goal. The ink is sized by area, not height, so half the goal inks half the letter. The counter stays the logo's white dot; there is no percentage inside it. A newly saved session's ink grows in on top; reaching the goal gives the letter a small settle, and a full day looks exactly like the logo. The numbers appear once, under it ("1h 10m of 2h"), with the subjects in a legend. It is the dashboard's only data display.

Above the ink, a ghost of the same ink at 14% opacity is the session Begin would start, sized by the length in the launcher sentence (picking 45m raises it). While Begin is hovered or keyboard-focused, the ghost deepens to 30% and the line under the "a" says what it would add ("+25m → 79%", "+25m → goal", or "+25m bonus" past the goal); Begin's description says the same for screen readers. The preview is not shown for the focus Begin takes on arrival. No ghost while a session is still open, or without a task to start.

It used to stack one band per session in its subject's colour, with the percentage in a white disc. Out of the wordmark that read as a striped chart behind a mask, and the disc hid the middle third of the fill (critique, 2026-10-27).

### The launcher sentence
"focus for [25m] on [task]": the dashboard's headline and its main control in one. Both the length and the task are slots: words of the sentence underlined like blanks, each opening a short list under itself. The length list offers the quick lengths and becomes the default length. The task list offers the next five tasks by due date; a pick lasts for the visit, and Begin, the meta line and "After this" follow it. With only one task open, the task is plain text. After a save, the same sentence steps down to 1.125rem as "next, focus for [25m] on [task]". The same sentence reappears on the Focus setup card.

## Do's and Don'ts

### Do:
- **Do** give every visual change a stated reason (The Reason Rule).
- **Do** keep exactly one filled button per screen (The One Filled Button Rule).
- **Do** keep text at 4.5:1 or better (`steel-600` on white is the floor) and control edges and icons at 3:1 (`lavender-400`).
- **Do** use the shared `baltic-500` focus outline; a custom ring must use the same colour.
- **Do** honour "reduce motion": animated backdrops don't start and entrance animations are off.

### Don't:
- **Don't** add notebook props (tape, doodles, ruled lines, stickers) to express the north star.
- **Don't** set content, numbers or controls in the italic serif (The Connecting Words Rule).
- **Don't** use a subject colour decoratively (The Subject Colour Rule).
- **Don't** use dark surfaces; aim is light-only until dark mode is deliberately brought back.
- **Don't** return to grids of same-size stat cards or competing accents; that is the direction aim moved away from.
- **Don't** use emoji or Unicode symbols as icons; icons are inline SVG with a 1.5 to 1.75 stroke.
