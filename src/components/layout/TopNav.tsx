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
    <header className="fixed top-0 left-0 right-0 z-40 h-16 bg-white/80 dark:bg-lavender-950/80 backdrop-blur-md border-b border-lavender-100/60 dark:border-lavender-800/60">
      <div className="max-w-5xl mx-auto h-full px-6 flex items-center justify-between">
        {/* Logo */}
        <button
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-2.5 group"
        >
          <div className="w-9 h-9 rounded-xl bg-baltic-500 flex items-center justify-center group-hover:scale-105 transition-smooth">
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
              <path d="M8 1L14 5v6l-6 4-6-4V5l6-4z" stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
              <circle cx="8" cy="8" r="2" fill="white" />
            </svg>
          </div>
          <span className="text-lg font-bold text-baltic-800 dark:text-baltic-100 tracking-tight">
            Meridian
          </span>
        </button>

        {/* Navigation pills */}
        <nav className="flex items-center gap-1 bg-lavender-50/80 dark:bg-lavender-900/50 rounded-full px-1.5 py-1.5">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm font-medium transition-smooth",
                  active
                    ? "bg-white dark:bg-lavender-800 text-baltic-700 dark:text-baltic-200 shadow-sm"
                    : "text-steel-500 dark:text-steel-400 hover:text-baltic-600 dark:hover:text-baltic-300"
                )}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* User avatar */}
        <div className="w-9 h-9 rounded-full bg-cream-100 dark:bg-cream-900/50 flex items-center justify-center">
          <span className="text-sm font-bold text-baltic-600 dark:text-baltic-300">
            {name?.charAt(0)?.toUpperCase() || "U"}
          </span>
        </div>
      </div>
    </header>
  );
}
