"use client";

import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { usePreferences } from "@/lib/contexts";
import AnimatedAimLogo from "./AnimatedAimLogo";

const NAV_ITEMS = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 5h14M3 10h14M3 15h9" />
        <path d="M15 13l2 2 3-4" />
      </svg>
    ),
  },
  {
    href: "/focus",
    label: "Focus",
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="10" cy="10" r="8" />
        <path d="M10 5v5l3 3" />
      </svg>
    ),
  },
  {
    href: "/journal",
    label: "Journal",
    icon: (
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 2h12a1 1 0 011 1v14a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z" />
        <path d="M7 6h6M7 10h6M7 14h3" />
      </svg>
    ),
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { name } = usePreferences();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[220px] bg-baltic-800 dark:bg-baltic-950 flex flex-col z-40">
      {/* Brand */}
      <div className="px-5 pt-7 pb-8">
        <AnimatedAimLogo />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <li key={item.href}>
                <button
                  onClick={() => router.push(item.href)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-smooth",
                    active
                      ? "text-white bg-white/10"
                      : "text-baltic-300 hover:text-white hover:bg-white/5"
                  )}
                >
                  <span className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-md transition-smooth",
                    active
                      ? "bg-baltic-500 text-white"
                      : "text-baltic-400"
                  )}>
                    {item.icon}
                  </span>
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom section */}
      <div className="px-3 pb-4 mt-auto">
        <div className="border-t border-white/10 pt-4">
          <div className="flex items-center gap-2 px-3 py-2">
            {name && (
              <>
                <div className="w-8 h-8 rounded-full bg-baltic-600 flex items-center justify-center text-sm font-semibold text-baltic-100">
                  {name.charAt(0).toUpperCase()}
                </div>
                <p className="text-sm font-medium text-baltic-200 truncate flex-1">
                  {name}
                </p>
              </>
            )}
            <button
              onClick={() => router.push("/settings")}
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center transition-smooth",
                pathname === "/settings"
                  ? "text-white bg-white/10"
                  : "text-baltic-400 hover:text-white hover:bg-white/5"
              )}
              title="Settings"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
