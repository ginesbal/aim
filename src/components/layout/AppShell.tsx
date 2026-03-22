"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import Sidebar from "./Sidebar";

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
    <div className="min-h-screen bg-baltic-50 dark:bg-baltic-950 flex">
      <Sidebar />
      <main className="flex-1 ml-[220px] py-8 px-8">
        {children}
      </main>
    </div>
  );
}
