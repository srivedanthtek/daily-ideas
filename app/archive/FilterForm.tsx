"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface FilterFormProps {
  modelFilter: string;
  modelLabels: string[];
}

export default function FilterForm({ modelFilter, modelLabels }: FilterFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("model", value);
    } else {
      params.delete("model");
    }
    router.push(`/archive?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-2 font-sans">
      <label htmlFor="model-filter" className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
        Filter:
      </label>
      <select
        id="model-filter"
        name="model"
        value={modelFilter}
        onChange={handleChange}
        className="rounded-full border border-neutral-200 bg-white px-3.5 py-1.5 text-xs font-medium text-neutral-700 outline-none focus:border-black transition-colors cursor-pointer"
      >
        <option value="">All Models</option>
        {modelLabels.map((label) => (
          <option key={label} value={label}>
            {label.replace("claude-", "").replace("gemini-", "").replace("openrouter-", "")}
          </option>
        ))}
      </select>
    </div>
  );
}