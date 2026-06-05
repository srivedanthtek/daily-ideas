"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/auth-client";

export function MemberLock() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const success = await login(password);
      if (success) {
        router.refresh();
      } else {
        setError("Invalid passcode. Please try again.");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative mt-[-100px] pt-[150px] pb-12 select-none">
      {/* Smooth Fading Gradient Overlay */}
      <div className="absolute top-0 left-0 right-0 h-[150px] bg-gradient-to-t from-[#ffffff] to-transparent pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 top-[150px] bg-[#ffffff] pointer-events-none" />

      {/* Modern, minimalist lock box */}
      <div className="relative max-w-[540px] mx-auto bg-neutral-50 border border-neutral-100 rounded-2xl p-8 sm:p-10 text-center shadow-sm">
        <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-5">
          <span className="text-xl text-black">✦</span>
        </div>
        
        <h3 className="font-serif font-bold text-xl sm:text-2xl text-neutral-900 tracking-tight mb-3">
          The rest of this Spark is private
        </h3>
        
        <p className="font-sans text-neutral-500 text-sm max-w-sm mx-auto leading-relaxed mb-8">
          This concept is reserved for Spark Journal members. Enter your private passcode to unlock the full specification, database schema, monetization, and growth plan.
        </p>

        <form onSubmit={handleSubmit} className="max-w-[340px] mx-auto space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="password"
              placeholder="Enter passcode"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-lg border border-neutral-200 focus:outline-none focus:border-black focus:ring-1 focus:ring-black text-sm bg-white"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-black text-white hover:bg-neutral-800 disabled:bg-neutral-300 rounded-lg text-sm font-semibold transition-colors"
            >
              {loading ? "Verifying..." : "Unlock"}
            </button>
          </div>

          {error && (
            <p className="text-red-500 text-xs font-semibold text-center mt-2 bg-red-50 py-1.5 px-3 rounded-md">
              {error}
            </p>
          )}
        </form>

        <div className="mt-8 pt-6 border-t border-neutral-200/50 flex items-center justify-center gap-2 text-xs text-neutral-400">
          <span>Daily curation by Claude 3.5 Sonnet & Opus</span>
        </div>
      </div>
    </div>
  );
}