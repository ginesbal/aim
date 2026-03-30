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
  const [saved, setSaved] = useState(false);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (localName.trim()) {
      setName(localName.trim());
      const goalNum = parseInt(localGoal, 10);
      if (goalNum > 0) setDailyGoal(goalNum);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-display text-baltic-800 dark:text-baltic-100">Settings</h1>
        <p className="text-sm text-steel-400 mt-1">Manage your preferences</p>
      </div>

      {/* Profile */}
      <Card padding="md">
        <h2 className="text-title text-baltic-800 dark:text-baltic-100 mb-4">Profile</h2>
        <form onSubmit={handleSave} className="space-y-3">
          <Input
            id="settings-name"
            label="Name"
            value={localName}
            onChange={(e) => setLocalName(e.target.value)}
          />
          <Input
            id="settings-goal"
            label="Daily focus goal (minutes)"
            type="number"
            min="1"
            value={localGoal}
            onChange={(e) => setLocalGoal(e.target.value)}
          />
          <div className="flex items-center gap-3">
            <Button type="submit" size="sm">Save</Button>
            {saved && (
              <span className="text-xs text-ash-600 font-medium">Saved</span>
            )}
          </div>
        </form>
      </Card>

      {/* Data */}
      <Card padding="md">
        <h2 className="text-title text-baltic-800 dark:text-baltic-100 mb-4">Data</h2>
        <p className="text-sm text-steel-400 mb-3">
          All data is stored locally in your browser.
        </p>
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
      </Card>
    </div>
  );
}
