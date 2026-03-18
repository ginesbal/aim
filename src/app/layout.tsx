import type { Metadata } from "next";
import "./globals.css";
import { PreferencesProvider, TasksProvider, FocusProvider, ThemeProvider } from "@/lib/contexts";
import AppShell from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "Meridian — Find your focus",
  description: "A calm, purposeful study planner for students who want to stay on track.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <PreferencesProvider>
            <TasksProvider>
              <FocusProvider>
                <AppShell>{children}</AppShell>
              </FocusProvider>
            </TasksProvider>
          </PreferencesProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
