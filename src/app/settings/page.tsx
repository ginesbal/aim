"use client";

import { useState } from "react";
import { usePreferences } from "@/lib/contexts";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default function SettingsPage() {
  const { name, dailyGoal, setName, setDailyGoal } = usePreferences();
  const [localName, setLocalName] = useState(name);
  const [localGoal, setLocalGoal] = useState(String(dailyGoal));
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!localName.trim()) {
      setFeedback({ type: "error", message: "Name cannot be empty" });
      setTimeout(() => setFeedback(null), 3000);
      return;
    }
    const goalNum = parseInt(localGoal, 10);
    if (!goalNum || goalNum < 1) {
      setFeedback({ type: "error", message: "Goal must be at least 1 minute" });
      setTimeout(() => setFeedback(null), 3000);
      return;
    }
    setName(localName.trim());
    setDailyGoal(goalNum);
    setFeedback({ type: "success", message: "Saved" });
    setTimeout(() => setFeedback(null), 2000);
  }

  return (
    <div className="relative space-y-6 max-w-2xl mx-auto">
      {/* Decorative blob */}
      <div aria-hidden className="hidden sm:block absolute -top-8 -right-20 w-28 h-28 lg:w-36 lg:h-36 blob-2 bg-ash-200/25 dark:bg-ash-700/20 float-slow pointer-events-none -z-10" />

      <div>
        <h1 className="text-display text-baltic-800 dark:text-baltic-100">Settings</h1>
        <p className="text-sm text-steel-400 mt-1">Manage your preferences</p>
      </div>

      {/* Profile */}
      <Card padding="lg">
        <h2 className="text-title text-baltic-800 dark:text-baltic-100 mb-4">Profile</h2>
        <form onSubmit={handleSave} className="space-y-4 max-w-md">
          <Input
            id="settings-name"
            label="Name"
            value={localName}
            onChange={(e) => setLocalName(e.target.value)}
          />
          <div>
            <Input
              id="settings-goal"
              label="Daily focus target"
              type="number"
              min="1"
              value={localGoal}
              onChange={(e) => setLocalGoal(e.target.value)}
            />
            <p className="mt-1.5 text-xs text-steel-500 dark:text-steel-400">
              Minutes of deep work you&rsquo;re aiming for each day.
            </p>
          </div>
          <div className="space-y-2">
            <Button type="submit" size="sm">Save</Button>
            {feedback && (
              <p
                role="status"
                className={`text-xs font-medium ${feedback.type === "error" ? "text-red-600 dark:text-red-400" : "text-ash-600 dark:text-ash-400"}`}
              >
                {feedback.message}
              </p>
            )}
          </div>
        </form>
      </Card>

      {/* Data */}
      <Card padding="lg">
        <h2 className="text-title text-baltic-800 dark:text-baltic-100 mb-4">Data</h2>
        <p className="text-sm text-steel-500 dark:text-steel-400 mb-4">
          All data is stored locally in your browser.
        </p>
        <div className="space-y-2">
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              if (confirm("This will clear all your data. Are you sure?")) {
                localStorage.removeItem("aim_tasks");
                localStorage.removeItem("aim_sessions");
                localStorage.removeItem("aim_name");
                localStorage.removeItem("aim_daily_goal");
                window.location.reload();
              }
            }}
          >
            Clear all data
          </Button>
          <p className="text-xs text-steel-500 dark:text-steel-400">
            This permanently removes your tasks, sessions, and preferences.
          </p>
        </div>
      </Card>
    </div>
  );
}
