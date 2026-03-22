"use client";

import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { usePreferences } from "@/lib/contexts";
import AimLogo from "./AimLogo";

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
        <button
          onClick={() => router.push("/dashboard")}
          className="flex items-center group"
        >
          <AimLogo size="md" />
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
