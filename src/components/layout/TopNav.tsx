"use client";

import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { usePreferences } from "@/lib/contexts";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/tasks", label: "Tasks" },
  { href: "/focus", label: "Focus" },
  { href: "/journal", label: "Journal" },
  { href: "/settings", label: "Settings" },
];

export default function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { name } = usePreferences();

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-14 bg-white dark:bg-lavender-950 border-b border-lavender-100 dark:border-lavender-800">
      <div className="max-w-5xl mx-auto h-full px-6 flex items-center justify-between">
        {/* Logo — meridian mark: vertical line crossing an arc */}
        <button
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-2 group"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-baltic-600 dark:text-baltic-400">
            {/* Arc — half ellipse representing a globe meridian */}
            <path
              d="M6 18c0-6.627 2.686-12 6-12s6 5.373 6 12"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              fill="none"
            />
            {/* Vertical meridian line */}
            <line x1="12" y1="3" x2="12" y2="21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            {/* Top dot — north point / compass accent */}
            <circle cx="12" cy="3" r="2" fill="currentColor" />
          </svg>
          <span className="text-base font-semibold text-baltic-800 dark:text-baltic-100 tracking-tight">
            Meridian
          </span>
        </button>

        {/* Navigation */}
        <nav className="flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium transition-smooth",
                  active
                    ? "text-baltic-700 dark:text-baltic-200 border-b-2 border-baltic-500"
                    : "text-steel-400 hover:text-baltic-600 dark:hover:text-baltic-300"
                )}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* User initial */}
        <div className="w-8 h-8 rounded-md bg-lavender-100 dark:bg-lavender-800 flex items-center justify-center">
          <span className="text-xs font-semibold text-baltic-600 dark:text-baltic-300">
            {name?.charAt(0)?.toUpperCase() || "U"}
          </span>
        </div>
      </div>
    </header>
  );
}
