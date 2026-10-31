"use client";

import { useEffect, useRef, useState } from "react";
import { usePreferences } from "@/lib/contexts";
import { clearAllData, isStorageFailing, writeKey, WELCOME_SKIPPED_KEY } from "@/lib/storage";
import { DURATION_MAX, DURATION_MIN, GOAL_MAX, GOAL_MIN } from "@/lib/durations";
import { formatTime } from "@/lib/utils";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

const NAME_MAX = 40;

type Field = "goal" | "block";

/** Whole minutes from min to max, or null. "", "2.5", "1e3" and "-5" are
 *  not: parseInt read "2.5" as 2 and saved it without a word. */
function parseMinutes(value: string, min: number, max: number): number | null {
  const text = value.trim();
  if (!/^\d+$/.test(text)) return null;
  const minutes = Number(text);
  return minutes >= min && minutes <= max ? minutes : null;
}

const rangeError = (min: number, max: number) =>
  `Enter whole minutes, from ${min} to ${max} (${formatTime(max)}).`;

export default function SettingsPage() {
  const { name, dailyGoal, focusBlockMin, setName, setDailyGoal, setFocusBlockMin } =
    usePreferences();
  const [localName, setLocalName] = useState(name);
  const [localGoal, setLocalGoal] = useState(String(dailyGoal));
  const [localBlock, setLocalBlock] = useState(String(focusBlockMin));
  // Each error stays beside its field until that field is edited; they
  // used to flash in one line by the button and vanish after 3 seconds.
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [status, setStatus] = useState("");
  const goalRef = useRef<HTMLInputElement>(null);
  const blockRef = useRef<HTMLInputElement>(null);

  function edited(field?: Field) {
    setStatus("");
    if (field) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const goal = parseMinutes(localGoal, GOAL_MIN, GOAL_MAX);
    // The range Focus runs: Settings took up to 180, so the dashboard
    // offered "focus for 2h 30m" and Begin ran a 2-hour timer.
    const block = parseMinutes(localBlock, DURATION_MIN, DURATION_MAX);
    setErrors({
      goal: goal === null ? rangeError(GOAL_MIN, GOAL_MAX) : undefined,
      block: block === null ? rangeError(DURATION_MIN, DURATION_MAX) : undefined,
    });
    if (goal === null || block === null) {
      setStatus("");
      (goal === null ? goalRef : blockRef).current?.focus();
      return;
    }

    // A name is optional, as the welcome's "Skip for now" makes it, so
    // someone who skipped can still change their goal. Clearing it also
    // keeps the welcome from asking again.
    const trimmed = localName.trim().slice(0, NAME_MAX);
    setName(trimmed);
    if (!trimmed) writeKey(WELCOME_SKIPPED_KEY, "1");
    setDailyGoal(goal);
    setFocusBlockMin(block);
    setLocalName(trimmed);
    setLocalGoal(String(goal));
    setLocalBlock(String(block));
    setStatus(
      isStorageFailing()
        ? "Changed for this tab only: this browser isn't saving aim."
        : "Saved."
    );
  }

  return (
    <div className="relative space-y-6 max-w-2xl mx-auto">

      <div>
        <h1 className="text-display text-baltic-800 dark:text-baltic-100">Settings</h1>
        <p className="text-sm text-steel-600 dark:text-steel-400 mt-1">Manage your preferences</p>
      </div>

      {/* Profile */}
      <Card padding="lg">
        <h2 className="text-title text-baltic-800 dark:text-baltic-100 mb-4">Profile</h2>
        {/* noValidate: the messages below, not the browser's bubbles. */}
        <form onSubmit={handleSave} noValidate className="space-y-3">
          <Input
            id="settings-name"
            label="Name"
            autoComplete="name"
            maxLength={NAME_MAX}
            value={localName}
            onChange={(e) => {
              setLocalName(e.target.value);
              edited();
            }}
          />
          <Input
            ref={goalRef}
            id="settings-goal"
            label="Daily focus goal (minutes)"
            type="number"
            inputMode="numeric"
            min={GOAL_MIN}
            max={GOAL_MAX}
            value={localGoal}
            error={errors.goal}
            onChange={(e) => {
              setLocalGoal(e.target.value);
              edited("goal");
            }}
          />
          <Input
            ref={blockRef}
            id="settings-block"
            label={`Focus block length (${DURATION_MIN}–${DURATION_MAX} minutes)`}
            type="number"
            inputMode="numeric"
            min={DURATION_MIN}
            max={DURATION_MAX}
            value={localBlock}
            error={errors.block}
            onChange={(e) => {
              setLocalBlock(e.target.value);
              edited("block");
            }}
          />
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <Button type="submit" size="sm">Save</Button>
            {/* Always mounted, so "Saved." is read out when it appears. It
                stays until the next edit. */}
            <p role="status" className="text-sm font-medium text-ash-700 dark:text-ash-300">
              {status}
            </p>
          </div>
        </form>
      </Card>

      {/* Data */}
      <Card padding="lg">
        <h2 className="text-title text-baltic-800 dark:text-baltic-100 mb-4">Data</h2>
        <p className="text-sm text-steel-600 dark:text-steel-400 mb-3">
          All data is stored locally in your browser.
        </p>
        <ClearAllData />
      </Card>
    </div>
  );
}

/* Clearing takes two clicks, both on the page: the first one arms it and
   says what will go; the second does it. It was a window.confirm() that
   removed five named keys and left the subjects, tabs and welcome flag
   behind (critique, 2026-10-28). Focus lands on "Keep my data", and Esc
   backs out. */
function ClearAllData() {
  const [armed, setArmed] = useState(false);
  const openRef = useRef<HTMLButtonElement>(null);
  const keepRef = useRef<HTMLButtonElement>(null);
  const wasArmed = useRef(false);

  useEffect(() => {
    if (armed) keepRef.current?.focus();
    else if (wasArmed.current) openRef.current?.focus();
    wasArmed.current = armed;
  }, [armed]);

  if (!armed) {
    return (
      <Button ref={openRef} variant="danger" size="sm" onClick={() => setArmed(true)}>
        Clear all data
      </Button>
    );
  }

  return (
    <div
      role="group"
      aria-labelledby="clear-data-warning"
      onKeyDown={(e) => {
        if (e.key === "Escape") setArmed(false);
      }}
      className="space-y-3 rounded-xl border border-red-200 bg-red-50/60 p-4 dark:border-red-900/60 dark:bg-red-950/20"
    >
      <p id="clear-data-warning" className="text-sm text-baltic-800 dark:text-baltic-100">
        This removes your tasks, focus sessions, subjects and settings from this browser.
        It can&apos;t be undone: aim starts over as on a first visit, with its sample tasks.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="destructive"
          size="sm"
          onClick={() => {
            clearAllData();
            window.location.assign("/dashboard");
          }}
        >
          Clear everything
        </Button>
        <Button ref={keepRef} variant="ghost" size="sm" onClick={() => setArmed(false)}>
          Keep my data
        </Button>
      </div>
    </div>
  );
}
