"use client";

import { useState } from "react";
import { usePreferences, useTheme } from "@/lib/contexts";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { name, setName } = usePreferences();
  const { dark, toggle } = useTheme();
  const [localName, setLocalName] = useState(name);
  const [saved, setSaved] = useState(false);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (localName.trim()) {
      setName(localName.trim());
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-display text-baltic-800 dark:text-baltic-100">Settings</h1>
        <p className="text-body text-steel-500 dark:text-steel-400 mt-1">Manage your preferences</p>
      </div>

      {/* Profile */}
      <Card>
        <h2 className="text-title text-baltic-800 dark:text-baltic-100 mb-4">Profile</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 rounded-full bg-baltic-100 dark:bg-baltic-800 flex items-center justify-center">
              <span className="text-lg font-semibold text-baltic-600 dark:text-baltic-300">
                {name?.charAt(0)?.toUpperCase() || "U"}
              </span>
            </div>
            <p className="text-sm font-medium text-baltic-800 dark:text-baltic-100">{name || "Not set"}</p>
          </div>

          <Input
            id="settings-name"
            label="Name"
            value={localName}
            onChange={(e) => setLocalName(e.target.value)}
          />

          <div className="flex items-center gap-3">
            <Button type="submit" size="sm">Save</Button>
            {saved && (
              <span className="text-xs text-ash-600 font-medium">Saved</span>
            )}
          </div>
        </form>
      </Card>

      {/* Appearance */}
      <Card>
        <h2 className="text-title text-baltic-800 dark:text-baltic-100 mb-4">Appearance</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-baltic-800 dark:text-baltic-100">Dark mode</p>
            <p className="text-xs text-steel-400 mt-0.5">Reduce eye strain during evening study sessions</p>
          </div>
          <button
            onClick={toggle}
            className={cn(
              "w-11 h-6 rounded-full transition-smooth relative",
              dark ? "bg-baltic-500" : "bg-lavender-300"
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-smooth",
                dark ? "left-[22px]" : "left-0.5"
              )}
            />
          </button>
        </div>
      </Card>

      {/* Data */}
      <Card>
        <h2 className="text-title text-baltic-800 dark:text-baltic-100 mb-4">Data</h2>
        <p className="text-sm text-steel-500 dark:text-steel-400 mb-4">
          Your data is stored locally in your browser. Clearing browser data will remove all tasks,
          sessions, and reflections.
        </p>
        <Button
          variant="danger"
          size="sm"
          onClick={() => {
            if (confirm("This will clear all your data. Are you sure?")) {
              localStorage.removeItem("meridian_tasks");
              localStorage.removeItem("meridian_sessions");
              localStorage.removeItem("meridian_name");
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
