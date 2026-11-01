"use client";

import { useEffect, useRef, useState } from "react";
import { usePreferences } from "@/lib/contexts";
import { clearAllData, isStorageFailing, writeKey, WELCOME_SKIPPED_KEY } from "@/lib/storage";
import { cn, formatTime } from "@/lib/utils";
import { SENTENCE, Connect } from "@/components/ui/Sentence";
import { GoalSlot, LengthSlot } from "@/components/ui/SentenceSlot";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

const NAME_MAX = 40;

/* Settings in the dashboard's voice: one sentence whose blanks are the
   two numbers the dashboard runs on, "aim for [2h] a day, [25m] at a
   time", with the launcher's own lists. It was a card of number fields
   in minutes with a Save button, in a column narrower than every other
   page (critique, 2026-10-28). A pick saves at once, and the line under
   the sentence says what was saved. The name and the data follow in
   quiet sections, headed like the dashboard's "After this". */
export default function SettingsPage() {
  const { dailyGoal, focusBlockMin, setDailyGoal, setFocusBlockMin } = usePreferences();
  const listParent = useRef<HTMLElement>(null);
  const [status, setStatus] = useState("");

  function saved(what: string) {
    setStatus(
      isStorageFailing()
        ? "Changed for this tab only: this browser isn't saving aim."
        : `Saved: ${what}.`
    );
  }

  return (
    <div className="mx-auto max-w-4xl pb-4">
      <header ref={listParent} className="relative mb-12">
        {/* Where the dashboard's day line sits. Settings has no tab in
            the navigation, so this says where you are; the heading
            carries the same word for screen readers. */}
        <p aria-hidden className="mb-2 text-lg font-semibold text-baltic-700 dark:text-baltic-200">
          Settings
        </p>
        {/* Each value stays with its words, so a phone breaks the line
            after "a day," and not inside "at a time". */}
        <h1 className={SENTENCE}>
          <span className="sr-only">Settings: </span>
          <Connect>aim for</Connect>{" "}
          <span className="whitespace-nowrap">
            <GoalSlot
              minutes={dailyGoal}
              listParent={listParent}
              onChange={(m) => {
                setDailyGoal(m);
                saved(`${formatTime(m)} a day`);
              }}
            />{" "}
            <Connect>a day,</Connect>
          </span>{" "}
          <span className="whitespace-nowrap">
            <LengthSlot
              other
              minutes={focusBlockMin}
              listParent={listParent}
              onChange={(m) => {
                setFocusBlockMin(m);
                saved(`${formatTime(m)} at a time`);
              }}
            />{" "}
            <Connect>at a time</Connect>
          </span>
        </h1>
        {/* Always mounted, so each save is read out as it happens. */}
        <p
          role="status"
          className={cn(
            "mt-3 max-w-md text-sm",
            status
              ? "font-medium text-ash-700 dark:text-ash-300"
              : "text-steel-600 dark:text-steel-400"
          )}
        >
          {status || "Each pick saves at once, and the dashboard follows it."}
        </p>
      </header>

      <section aria-labelledby="settings-name-heading" className={SECTION}>
        {/* pt: level with the text inside the field beside it. */}
        <h2 id="settings-name-heading" className={cn(SECTION_HEADING, "sm:pt-[9px]")}>
          Your name
        </h2>
        <NameField />
      </section>

      <section aria-labelledby="settings-data-heading" className={cn(SECTION, "border-b")}>
        <h2 id="settings-data-heading" className={SECTION_HEADING}>
          Your data
        </h2>
        <div className="space-y-3">
          <p className="text-sm text-steel-600 dark:text-steel-400">
            Your tasks, sessions, subjects and settings are kept in this browser, and nowhere else.
          </p>
          <ClearAllData />
        </div>
      </section>
    </div>
  );
}

/* Quiet rows between hairlines, no cards: the label in a narrow column,
   the setting beside it, so both settings start on one edge and the
   labels scan down the left. On phones the label sits above. The label
   is set like the dashboard's "After this". */
const SECTION =
  "grid gap-x-10 gap-y-3 border-t border-lavender-200/70 px-1 py-6 sm:grid-cols-[10rem_minmax(0,1fr)] dark:border-lavender-800/60";
const SECTION_HEADING = "text-sm font-semibold text-baltic-700 dark:text-baltic-200";

/* Saved as it's typed, like the picks above, so it can't be lost to a
   forgotten Save. A name is optional, as the welcome's "Skip for now"
   makes it; an empty one also keeps the welcome from asking again. */
function NameField() {
  const { name, setName } = usePreferences();
  const [draft, setDraft] = useState(name);

  return (
    <div className="max-w-sm">
      <Input
        id="settings-name"
        aria-labelledby="settings-name-heading"
        aria-describedby="settings-name-hint"
        autoComplete="given-name"
        maxLength={NAME_MAX}
        placeholder="What should we call you?"
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value);
          const trimmed = e.target.value.trim();
          setName(trimmed);
          if (!trimmed) writeKey(WELCOME_SKIPPED_KEY, "1");
        }}
        onBlur={() => setDraft((d) => d.trim())}
      />
      <p id="settings-name-hint" className="mt-2 text-sm text-steel-600 dark:text-steel-400">
        For the dashboard&apos;s greeting. It saves as you type; leave it empty to go without.
      </p>
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
      // -ml-4: the label lines up with the text above; the hover wash
      // reaches into the margin.
      <Button ref={openRef} variant="danger" size="sm" className="-ml-4" onClick={() => setArmed(true)}>
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
      className="max-w-xl space-y-3 rounded-xl border border-red-200 bg-red-50/60 p-4 dark:border-red-900/60 dark:bg-red-950/20"
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
