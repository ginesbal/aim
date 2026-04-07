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
    <div className="min-h-screen bg-baltic-50 dark:bg-baltic-950">
      <TopNav />
      <main className="pt-24 pb-12 px-8 max-w-6xl mx-auto">
        {children}
      </main>
    </div>
  );
}
