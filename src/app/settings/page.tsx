"use client";

import { useState } from "react";
import { useAuth, useTheme } from "@/lib/contexts";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { user, updateProfile, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [saved, setSaved] = useState(false);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim() && email.trim()) {
      updateProfile({ name: name.trim(), email: email.trim() });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-display text-baltic-800 dark:text-baltic-100">Settings</h1>
        <p className="text-body text-steel-500 dark:text-steel-400 mt-1">Manage your account and preferences</p>
      </div>

      {/* Profile */}
      <Card>
        <h2 className="text-title text-baltic-800 dark:text-baltic-100 mb-4">Profile</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 rounded-full bg-baltic-100 dark:bg-baltic-800 flex items-center justify-center">
              <span className="text-lg font-semibold text-baltic-600 dark:text-baltic-300">
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-baltic-800 dark:text-baltic-100">{user?.name}</p>
              <p className="text-xs text-steel-400">{user?.email}</p>
            </div>
          </div>

          <Input
            id="settings-name"
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            id="settings-email"
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <div className="flex items-center gap-3">
            <Button type="submit" size="sm">Save changes</Button>
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
          {/* Toggle switch */}
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
          Your data is stored locally in your browser. Clearing browser data will remove all tasks and session history.
        </p>
        <div className="flex gap-3">
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              if (confirm("This will clear all your tasks and sessions. Are you sure?")) {
                localStorage.removeItem("meridian_tasks");
                localStorage.removeItem("meridian_sessions");
                window.location.reload();
              }
            }}
          >
            Clear all data
          </Button>
        </div>
      </Card>

      {/* Sign out */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-baltic-800 dark:text-baltic-100">Sign out</p>
            <p className="text-xs text-steel-400 mt-0.5">You can sign back in anytime</p>
          </div>
          <Button variant="ghost" size="sm" onClick={logout}>
            Sign out
          </Button>
        </div>
      </Card>
    </div>
  );
}
