"use client";

import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { usePreferences } from "@/lib/contexts";
import AnimatedAimLogo from "./AnimatedAimLogo";

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
    <header className="fixed top-0 left-0 right-0 h-16 bg-white/80 dark:bg-baltic-950/80 backdrop-blur-md border-b border-lavender-200/60 dark:border-lavender-800/40 z-40 flex items-center px-6">
      {/* Logo */}
      <button
        onClick={() => router.push("/dashboard")}
        className="flex-shrink-0 mr-8"
        aria-label="Go to dashboard"
      >
        <AnimatedAimLogo />
      </button>

      {/* Nav links — center */}
      <nav className="flex-1 flex items-center justify-center">
        <div className="flex items-center gap-1 bg-baltic-50 dark:bg-baltic-900/50 rounded-full p-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200",
                  active
                    ? "bg-baltic-600 text-white dark:bg-baltic-500 shadow-sm"
                    : "text-steel-500 hover:text-baltic-700 dark:text-steel-400 dark:hover:text-baltic-200"
                )}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* User avatar — right */}
      <div className="flex-shrink-0">
        {name && (
          <div className="w-8 h-8 rounded-full bg-baltic-600 dark:bg-baltic-500 flex items-center justify-center text-sm font-semibold text-white">
            {name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
    </header>
  );
}
