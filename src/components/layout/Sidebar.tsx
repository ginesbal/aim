"use client";

import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { usePreferences } from "@/lib/contexts";
import AimLogo from "./AimLogo";

const NAV_ITEMS = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="7" height="8" rx="1.5" />
        <rect x="11" y="2" width="7" height="5" rx="1.5" />
        <rect x="2" y="12" width="7" height="6" rx="1.5" />
        <rect x="11" y="9" width="7" height="9" rx="1.5" />
      </svg>
    ),
  },
  {
    href: "/tasks",
    label: "Tasks",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 5h14M3 10h14M3 15h9" />
        <path d="M15 13l2 2 3-4" />
      </svg>
    ),
  },
  {
    href: "/focus",
    label: "Focus",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="10" cy="10" r="8" />
        <path d="M10 5v5l3 3" />
      </svg>
    ),
  },
  {
    href: "/journal",
    label: "Journal",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 2h12a1 1 0 011 1v14a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z" />
        <path d="M7 6h6M7 10h6M7 14h3" />
      </svg>
    ),
  },
  {
    href: "/settings",
    label: "Settings",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="10" cy="10" r="2.5" />
        <path d="M10 1.5v2M10 16.5v2M1.5 10h2M16.5 10h2M3.4 3.4l1.4 1.4M15.2 15.2l1.4 1.4M3.4 16.6l1.4-1.4M15.2 4.8l1.4-1.4" />
      </svg>
    ),
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { name } = usePreferences();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[220px] bg-white dark:bg-lavender-950 border-r border-lavender-100 dark:border-lavender-800 flex flex-col z-40">
      {/* Brand */}
      <div className="px-5 pt-6 pb-4">
        <AimLogo size="md" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 mt-2">
        <ul className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <li key={item.href}>
                <button
                  onClick={() => router.push(item.href)}
                  className={cn(
                    "relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-smooth",
                    active
                      ? "text-baltic-700 dark:text-baltic-200 bg-baltic-50 dark:bg-baltic-900/50"
                      : "text-steel-500 dark:text-steel-400 hover:text-baltic-600 dark:hover:text-baltic-300 hover:bg-lavender-50 dark:hover:bg-lavender-900"
                  )}
                >
                  {active && <span className="nav-active-indicator" />}
                  <span className={cn(active && "text-baltic-500 dark:text-baltic-400")}>
                    {item.icon}
                  </span>
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User section */}
      {name && (
        <div className="px-3 pb-4 mt-auto">
          <div className="border-t border-lavender-100 dark:border-lavender-800 pt-4">
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-8 h-8 rounded-full bg-lavender-100 dark:bg-lavender-800 flex items-center justify-center text-sm font-semibold text-baltic-600 dark:text-baltic-300">
                {name.charAt(0).toUpperCase()}
              </div>
              <p className="text-sm font-medium text-baltic-800 dark:text-baltic-200 truncate">
                {name}
              </p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
