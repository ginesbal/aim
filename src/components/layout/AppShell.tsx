"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import TopNav from "./TopNav";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (pathname === "/") {
      router.replace("/dashboard");
    }
  }, [pathname, router]);

  // Focus covers the whole screen, but the nav under it would still take
  // Tab presses and clicks from screen readers, and Enter on a link you
  // can't see would leave a running session. `inert` takes the nav out of
  // reach while Focus is up. (React 18 has no `inert` prop, so it's set
  // on the element directly.)
  const onFocusScreen = pathname === "/focus";
  useEffect(() => {
    if (navRef.current) navRef.current.inert = onFocusScreen;
  }, [onFocusScreen]);

  if (pathname === "/") return null;

  return (
    <div className="min-h-screen bg-baltic-50 dark:bg-baltic-950">
      <div ref={navRef}>
        {/* First Tab stop: jump past the nav straight to the page. Hidden
            until focused, and inert with the nav while Focus is up. */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-50 focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-baltic-700 focus:shadow-md"
        >
          Skip to content
        </a>
        <TopNav />
      </div>
      {/* Phones: tighter gutters, and bottom room for the tab bar. */}
      <main
        id="main"
        tabIndex={-1}
        className="pt-20 sm:pt-24 pb-24 sm:pb-12 px-4 sm:px-8 max-w-6xl mx-auto focus:outline-none"
      >
        {children}
      </main>
    </div>
  );
}
