"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn, initialOf } from "@/lib/utils";
import { usePreferences } from "@/lib/contexts";
import AnimatedAimLogo from "./AnimatedAimLogo";
import HelpButton from "@/components/ui/HelpButton";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/tasks", label: "Tasks" },
  { href: "/focus", label: "Focus" },
  { href: "/journal", label: "Journal" },
];

export default function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { name } = usePreferences();
  // A whole emoji or accented letter: charAt(0) split an emoji in half.
  const initial = initialOf(name);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  // Click outside or Esc closes; Esc hands focus back to the avatar.
  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      setMenuOpen(false);
      menuButtonRef.current?.focus();
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [menuOpen]);

  return (
    <>
    {/* The bar is the desk itself: the page's colour, solid, with a
        hairline under it. It was frosted white with a pill switcher, the
        last template tells on the page (critique, 2026-11-02). */}
    <header className="fixed top-0 left-0 right-0 h-16 bg-baltic-50 dark:bg-baltic-950 border-b border-lavender-200/80 dark:border-lavender-800/50 z-40 flex items-center px-4 sm:px-6">
      {/* Logo. Pages are real links (not buttons), so they can be opened
          in a new tab or copied. */}
      <Link href="/dashboard" className="tap-target flex-shrink-0 mr-8" aria-label="Go to dashboard">
        <AnimatedAimLogo />
      </Link>

      {/* Page names, centred. Plain words; the current one in dark ink
          with the 2px underline the phone bar uses. On phones they move
          to the bottom bar. */}
      <nav aria-label="Pages" className="hidden sm:flex flex-1 items-center justify-center">
        <ul className="flex items-center gap-2">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "tap-target block rounded-md px-3 py-2 text-sm transition-colors duration-200",
                    active
                      ? "font-semibold text-baltic-800 dark:text-baltic-100"
                      : "font-medium text-steel-600 hover:text-baltic-700 dark:text-steel-400 dark:hover:text-baltic-200"
                  )}
                >
                  <NavLabel label={item.label} active={active} />
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Help, then the profile dropdown — right */}
      <div className="ml-auto mr-2 flex-shrink-0">
        <HelpButton className="tap-target w-9 h-9 rounded-full flex items-center justify-center text-steel-600 hover:bg-white hover:text-baltic-700 dark:hover:bg-baltic-900 transition-colors duration-150" />
      </div>
      <div className="flex-shrink-0 relative" ref={menuRef}>
        <button
          ref={menuButtonRef}
          onClick={() => setMenuOpen((v) => !v)}
          // A secondary circle, not a filled one: the page's one filled
          // button (Begin) shouldn't have a darker disc competing with it
          // in the corner.
          className={cn(
            "tap-target w-9 h-9 rounded-full bg-white dark:bg-lavender-900 border border-lavender-200 dark:border-lavender-700 flex items-center justify-center text-sm font-semibold text-baltic-700 dark:text-baltic-200 hover:border-lavender-300 hover:bg-lavender-50 dark:hover:bg-lavender-800 transition-colors duration-150",
            menuOpen && "border-baltic-400 dark:border-baltic-400"
          )}
          aria-label="Open profile menu"
          aria-expanded={menuOpen}
        >
          {/* No name yet (the welcome can be skipped): a person mark, not
              "?", which would read as a second help button beside Help. */}
          {initial ? (
            initial
          ) : (
            <svg aria-hidden width={16} height={16} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round">
              <circle cx="8" cy="5.5" r="2.75" />
              <path d="M3 13.5c.8-2.4 2.7-3.75 5-3.75s4.2 1.35 5 3.75" />
            </svg>
          )}
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-12 w-56 rounded-2xl bg-white dark:bg-lavender-900 shadow-lg shadow-baltic-900/10 border border-lavender-200 dark:border-lavender-700 py-2 dropdown-enter">
            {/* Name header */}
            <div className="px-4 py-2 border-b border-lavender-100 dark:border-lavender-800 mb-1">
              <p className="text-sm font-semibold text-baltic-800 dark:text-baltic-100 truncate">
                {name || "—"}
              </p>
            </div>

            {/* Settings link */}
            <button
              onClick={() => {
                setMenuOpen(false);
                router.push("/settings");
              }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-2 text-sm font-medium transition-colors",
                pathname === "/settings"
                  ? "text-baltic-700 dark:text-baltic-200 bg-baltic-50 dark:bg-baltic-900/40"
                  : "text-steel-600 dark:text-steel-300 hover:bg-baltic-50 dark:hover:bg-baltic-900/30"
              )}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="8" cy="8" r="2" />
                <path d="M12.5 8a4.5 4.5 0 0 0-.1-.9l1.4-1.1-1.4-2.4-1.7.6a4.5 4.5 0 0 0-1.5-.9L8.9 1.5h-2.8L5.8 3.3a4.5 4.5 0 0 0-1.5.9l-1.7-.6-1.4 2.4 1.4 1.1a4.5 4.5 0 0 0 0 1.8l-1.4 1.1 1.4 2.4 1.7-.6a4.5 4.5 0 0 0 1.5.9l.3 1.8h2.8l.3-1.8a4.5 4.5 0 0 0 1.5-.9l1.7.6 1.4-2.4-1.4-1.1c.07-.3.1-.6.1-.9Z" />
              </svg>
              Settings
            </button>
          </div>
        )}
      </div>
    </header>

    {/* Phones: the same four pages in a bar along the bottom, where a
        thumb reaches. An underline marks the current page (a pill
        would not fit "Dashboard" in a quarter of a 320px screen).
        Focus mode's full-screen canvas (z-50) covers it. */}
    <nav
      aria-label="Pages"
      className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-baltic-50 dark:bg-baltic-950 border-t border-lavender-200/80 dark:border-lavender-800/50"
    >
      <ul className="grid grid-cols-4">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className="w-full h-14 flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-baltic-500"
              >
                <span
                  className={cn(
                    "relative text-[13px] transition-colors duration-200",
                    active
                      ? "font-semibold text-baltic-800 dark:text-baltic-100"
                      : "font-medium text-steel-600 dark:text-steel-400"
                  )}
                >
                  {item.label}
                  {active && <NavMarker />}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
    </>
  );
}

/* The current page's mark: a 2px rule under its name, on both bars (and
   the same weight as the selected Tasks tab's edge). */
function NavMarker() {
  return (
    <span
      aria-hidden
      className="absolute inset-x-0 -bottom-2 h-[2px] rounded-full bg-baltic-600 dark:bg-baltic-400"
    />
  );
}

/* A page name that keeps its width when it turns semibold: an invisible
   semibold copy holds the space, so the names beside it don't shift as
   you move between pages. */
function NavLabel({ label, active }: { label: string; active: boolean }) {
  return (
    <span className="relative inline-grid text-center">
      <span aria-hidden className="invisible col-start-1 row-start-1 font-semibold">
        {label}
      </span>
      <span className="col-start-1 row-start-1">{label}</span>
      {active && <NavMarker />}
    </span>
  );
}
