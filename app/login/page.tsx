"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/auth-client";

export default function LoginPage() {
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
        router.push("/");
        router.refresh();
      } else {
        setError("Invalid access key. Please try again.");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-[#fafafa] px-6 py-24">
      <div className="max-w-[400px] w-full bg-white rounded-2xl border border-neutral-100 p-10 shadow-sm text-center">
        <span className="text-3xl text-black block mb-4 select-none">✦</span>
        <h1 className="font-serif font-bold text-2xl text-neutral-900 tracking-tight mb-2">
          Unlock your Spark Journal
        </h1>
        <p className="text-neutral-500 text-sm font-sans mb-8">
          Enter your private passcode to gain full access to all daily micro-SaaS ideas.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              placeholder="Enter passcode..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-3 rounded-lg border border-neutral-200 focus:outline-none focus:border-black focus:ring-1 focus:ring-black text-sm text-center transition-all bg-neutral-50"
              required
            />
          </div>

          {error && (
            <p className="text-red-500 text-xs font-medium bg-red-50 py-2 px-3 rounded-md">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-black text-white hover:bg-neutral-800 disabled:bg-neutral-300 rounded-lg text-sm font-semibold tracking-wide transition-all select-none"
          >
            {loading ? "Verifying..." : "Unlock Access"}
          </button>
        </form>

        <p className="text-xs text-neutral-400 font-sans mt-8">
          To modify your passcode, update your `SPARK_PASSWORD` environment variable.
        </p>
      </div>
    </div>
  );
}