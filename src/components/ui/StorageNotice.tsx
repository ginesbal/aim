"use client";

import { useEffect, useState } from "react";
import { onStorageFailure } from "@/lib/storage";

/* Shown once this browser refuses to keep aim's data: site data turned
   off for the site, storage full, some private windows. Until now aim
   carried on as if it had saved, and everything from the tab was gone
   when it closed (critique, 2026-10-28). Fixed at the bottom so it shows
   on every page, Focus included; it can be dismissed. */
export default function StorageNotice() {
  const [failed, setFailed] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => onStorageFailure(() => setFailed(true)), []);

  if (!failed || dismissed) return null;

  return (
    <div className="fixed inset-x-4 bottom-20 sm:bottom-6 z-[60] flex justify-center pointer-events-none">
      <div
        role="alert"
        className="pointer-events-auto flex max-w-xl items-start gap-3 rounded-2xl bg-baltic-800 px-4 py-3 text-sm text-white shadow-[0_16px_36px_-12px_rgba(38,45,64,0.28)]"
      >
        <span aria-hidden className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-red-400" />
        <p className="flex-1">
          <span className="font-semibold">This browser isn&apos;t saving aim.</span>{" "}
          Tasks and sessions from this tab will be gone when it closes. Allowing site data for this site fixes it.
        </p>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="tap-target -m-1 flex-shrink-0 rounded-full p-1 text-white/70 hover:text-white"
        >
          <svg aria-hidden width={12} height={12} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round">
            <path d="M2.5 2.5l7 7M9.5 2.5l-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
