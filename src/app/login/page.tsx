"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function LoginPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setError("Please fill in all fields");
      return;
    }
    login(email.trim(), name.trim());
    router.replace("/dashboard");
  }

  return (
    <div className="min-h-screen bg-baltic-50 dark:bg-baltic-950 flex">
      {/* Left panel — brand */}
      <div className="hidden lg:flex lg:w-[45%] bg-baltic-800 dark:bg-baltic-900 relative overflow-hidden flex-col justify-between p-12">
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle, #fff 1px, transparent 1px)`,
            backgroundSize: "24px 24px",
          }}
        />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-xl bg-baltic-500 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
                <path d="M8 1L14 5v6l-6 4-6-4V5l6-4z" stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
                <circle cx="8" cy="8" r="2" fill="white" />
              </svg>
            </div>
            <span className="text-xl font-semibold text-white tracking-tight">Meridian</span>
          </div>

          <h1 className="text-4xl font-semibold text-white leading-tight tracking-tight mb-4">
            Find your
            <br />
            focus.
          </h1>
          <p className="text-baltic-300 text-base max-w-sm leading-relaxed">
            A calm space to plan your studies, track your progress, and build
            consistent habits — without the noise.
          </p>
        </div>

        {/* Stats at bottom — social proof */}
        <div className="relative z-10 flex gap-10">
          {[
            { value: "2.4k", label: "Active students" },
            { value: "94%", label: "Task completion" },
            { value: "4.8h", label: "Avg. daily focus" },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="text-2xl font-semibold text-white">{stat.value}</p>
              <p className="text-sm text-baltic-400 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* Mobile brand */}
          <div className="lg:hidden flex items-center gap-2.5 mb-10">
            <div className="w-8 h-8 rounded-lg bg-baltic-500 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 1L14 5v6l-6 4-6-4V5l6-4z" stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
                <circle cx="8" cy="8" r="2" fill="white" />
              </svg>
            </div>
            <span className="text-base font-semibold text-baltic-800 dark:text-baltic-100 tracking-tight">Meridian</span>
          </div>

          <h2 className="text-display text-baltic-800 dark:text-baltic-100 mb-1">Welcome back</h2>
          <p className="text-body text-steel-500 dark:text-steel-400 mb-8">
            Pick up where you left off.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="name"
              label="Name"
              placeholder="Your name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError("");
              }}
              autoComplete="name"
            />
            <Input
              id="email"
              label="Email"
              type="email"
              placeholder="you@university.edu"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              autoComplete="email"
            />

            {error && (
              <p className="text-xs text-red-500 font-medium">{error}</p>
            )}

            <Button type="submit" className="w-full mt-2" size="lg">
              Sign in
            </Button>
          </form>

          <p className="text-center text-sm text-steel-400 mt-6">
            New here?{" "}
            <button
              onClick={() => router.push("/signup")}
              className="text-baltic-500 hover:text-baltic-700 font-medium transition-smooth"
            >
              Create an account
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
