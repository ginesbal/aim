"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { usePreferences } from "@/lib/contexts";
import AnimatedAimLogo from "./AnimatedAimLogo";

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
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Click-outside to close
  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  return (
    <>
    <header className="fixed top-0 left-0 right-0 h-16 bg-white/80 dark:bg-baltic-950/80 backdrop-blur-md border-b border-lavender-200/60 dark:border-lavender-800/40 z-40 flex items-center px-4 sm:px-6">
      {/* Logo */}
      <button
        onClick={() => router.push("/dashboard")}
        className="flex-shrink-0 mr-8"
        aria-label="Go to dashboard"
      >
        <AnimatedAimLogo />
      </button>

      {/* Nav links — center. On phones they move to the bottom bar. */}
      <nav aria-label="Pages" className="hidden sm:flex flex-1 items-center justify-center">
        <div className="flex items-center gap-1 bg-baltic-50 dark:bg-baltic-900/50 rounded-full p-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm font-medium transition-[background-color,color,box-shadow] duration-200",
                  active
                    ? "bg-baltic-600 text-white dark:bg-baltic-500 shadow-sm"
                    : "text-steel-600 hover:text-baltic-700 dark:text-steel-400 dark:hover:text-baltic-200"
                )}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Profile dropdown — right */}
      <div className="flex-shrink-0 relative ml-auto" ref={menuRef}>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className={cn(
            "tap-target w-9 h-9 rounded-full bg-baltic-600 dark:bg-baltic-500 flex items-center justify-center text-sm font-semibold text-white transition-[transform,box-shadow] duration-150 [@media(hover:hover)]:hover:scale-105 hover:shadow-md",
            menuOpen && "ring-2 ring-baltic-300 dark:ring-baltic-400 ring-offset-2 ring-offset-white dark:ring-offset-baltic-950"
          )}
          aria-label="Open profile menu"
          aria-expanded={menuOpen}
        >
          {name ? name.charAt(0).toUpperCase() : "?"}
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-12 w-56 rounded-2xl bg-white dark:bg-lavender-900 shadow-lg shadow-baltic-900/10 border border-lavender-200 dark:border-lavender-700 py-2 dropdown-enter">
            {/* Name header */}
            <div className="px-4 py-2 border-b border-lavender-100 dark:border-lavender-800 mb-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-steel-600 dark:text-steel-400">
                Signed in as
              </p>
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
      className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-baltic-950/90 backdrop-blur-md border-t border-lavender-200/60 dark:border-lavender-800/40"
    >
      <ul className="grid grid-cols-4">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <li key={item.href}>
              <button
                onClick={() => router.push(item.href)}
                aria-current={active ? "page" : undefined}
                className="w-full h-14 flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-baltic-400/70"
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
                  {active && (
                    <span
                      aria-hidden
                      className="absolute inset-x-0 -bottom-2 h-[3px] rounded-full bg-baltic-600 dark:bg-baltic-400"
                    />
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
    </>
  );
}
