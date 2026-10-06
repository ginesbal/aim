# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Primary audience: people reviewing the owner's work.** aim is a portfolio piece, built as a real, working study app.
- **Designed around students** who plan study tasks and work through them in timed focus sessions, at a desk in a desktop browser.

## Product Purpose

A calm study app built around the focus session. The dashboard proposes the next session as a sentence ("focus for 25m on Lab report"), Focus runs it, and every finished session fills part of the day's goal, drawn as the "a" of the logo.

Success means a reviewer sees a coherent, carefully made product, and a student can start the right session from the dashboard in one step and trust that their work is kept.

## Positioning

The focus session is the centre of the product. Tasks exist to give sessions something to be about, the journal records them, and the "a" fills with them. The planner, journal and settings serve the session, not the other way round.

## Operating Context

- Sessions run 25 to 90 minutes, often with aim in a background tab: the tab title counts down in minutes and a soft chime marks the end.
- Pages: Dashboard, Tasks, Focus, Journal, Settings.
- A first visit asks for a name and starts with six sample tasks (marked "sample task"); there are no sample sessions.
- A session left mid-way (paused, or finished but not saved) survives leaving Focus and reloading, and the dashboard offers the way back to it.

## Capabilities and Constraints

- **No accounts; data stays in the browser.** Everything is in localStorage, plus sessionStorage for a live session. No server, no sign-in, no sync.
- **Desktop web first.** Phone layouts exist for the dashboard and Focus; Tasks, Journal and Settings wait until the owner asks.
- **Light theme only for now.** Dark mode is parked behind `DARK_MODE_ENABLED = false`.
- **Unfinished features are parked behind flags, not deleted:** `SHOW_DAY_CHIPS`, `SHOW_AMBIENT`, `DARK_MODE_ENABLED`.
- **Focus backdrops** come from Vanta.js: Contours (p5), Fog and Birds (three.js, pinned to 0.134.0, the version Vanta 0.5 is built for), plus Still for no motion.
- **Terminology:** the product name is "aim", lowercase. A session can end three ways: "Pause & leave" (kept for later), "Finish early" (logged), "Discard" (not logged).

## Brand Commitments

- The name "aim", lowercase, and its logo, whose "a" doubles as the daily progress meter (assets in `src/lib/`: `aim_logo.svg`, `logo.png`).
- A calm, plain voice. The welcome line reads: "A calm space to plan your studies and build focus habits."

## Evidence on Hand

- No real users, usage data, testimonials or press. Future work must not invent any.
- The six sample tasks in `src/lib/contexts.tsx` are placeholders, not real content.

## Product Principles

1. **Focus first.** Every screen should make starting, running or finishing a focus session easier; anything that doesn't serve that is secondary.
2. **Foundation before features.** Get the existing surfaces solid before adding new capabilities; park what isn't ready behind a flag.
3. **Calm over busy.** One primary action per screen. Motion and decoration must never compete with the session.
4. **Honest state, safe work.** The app says plainly what happened (paused, saved, marked done), and a session is never lost by leaving or reloading.
5. **Private by default.** Nothing leaves the browser.
