"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import TopNav from "./TopNav";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (pathname === "/") {
      router.replace("/dashboard");
    }
  }, [pathname, router]);

  if (pathname === "/") return null;

  return (
    <div className="min-h-screen bg-baltic-50 dark:bg-baltic-950 relative overflow-hidden">
      {/* Background decorative blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className="blob-1 absolute -top-32 -right-32 w-96 h-96 bg-baltic-200/20 dark:bg-baltic-800/10 animate-float-slow"
        />
        <div
          className="blob-2 absolute top-1/2 -left-48 w-80 h-80 bg-cream-200/15 dark:bg-cream-900/10 animate-float-delay"
        />
        <div
          className="blob-3 absolute bottom-0 right-1/4 w-64 h-64 bg-ash-200/15 dark:bg-ash-900/10 animate-float"
        />
      </div>

      <TopNav />
      <main className="relative z-10 pt-24 pb-12">
        <div className="max-w-5xl mx-auto px-6">
          {children}
        </div>
      </main>
    </div>
  );
}
