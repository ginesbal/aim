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
      <main className="pt-20 pb-12">
        <div className="max-w-5xl mx-auto px-6">
          {children}
        </div>
      </main>
    </div>
  );
}
