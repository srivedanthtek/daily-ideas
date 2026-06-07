"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { supabase, Idea } from "@/lib/supabase";

interface GroupedIdeas {
  [yearMonth: string]: { label: string; ideas: Idea[] };
}

export default function IdeaArchiveList() {
  const [grouped, setGrouped] = useState<GroupedIdeas>({});
  const [loading, setLoading] = useState(true);
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchAllIdeas() {
      const { data, error } = await supabase
        .from("ideas")
        .select("id,title,created_at,date_label")
        .order("created_at", { ascending: false });

      if (cancelled) return;

      if (error) {
        console.error("Error fetching archive ideas:", error);
        setError(error.message);
        setLoading(false);
        return;
      }

      if (!data || data.length === 0) {
        setLoading(false);
        return;
      }

      // Group by year-month
      const groups: GroupedIdeas = {};
      for (const idea of data as Idea[]) {
        const d = new Date(idea.created_at);
        const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        const label = d.toLocaleDateString("en-US", { year: "numeric", month: "long" });
        if (!groups[yearMonth]) {
          groups[yearMonth] = { label, ideas: [] };
        }
        groups[yearMonth].ideas.push(idea);
      }

      setGrouped(groups);
      // Auto-expand the first (latest) month
      const keys = Object.keys(groups).sort().reverse();
      if (keys.length > 0) {
        setExpandedMonths(new Set([keys[0]]));
      }
      setLoading(false);
    }

    fetchAllIdeas();
    return () => { cancelled = true; };
  }, []);

  const toggleMonth = useCallback((yearMonth: string) => {
    setExpandedMonths((prev) => {
      const next = new Set(prev);
      if (next.has(yearMonth)) {
        next.delete(yearMonth);
      } else {
        next.add(yearMonth);
      }
      return next;
    });
  }, []);

  const sortedKeys = Object.keys(grouped).sort().reverse();

  return (
    <div className="w-full">
      <div className="border-b border-neutral-100 pb-3 mb-5">
        <h3 className="font-sans font-bold text-xs uppercase tracking-wider text-neutral-900 flex items-center gap-2">
          <svg className="w-3.5 h-3.5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          All Ideas
        </h3>
      </div>

      {loading && (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 bg-neutral-100 rounded w-2/3"></div>
              <div className="pl-4 space-y-1.5">
                <div className="h-3 bg-neutral-100 rounded w-4/5"></div>
                <div className="h-3 bg-neutral-100 rounded w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="text-center py-6">
          <p className="text-xs text-neutral-400 font-sans">Could not load archive.</p>
        </div>
      )}

      {!loading && !error && sortedKeys.length === 0 && (
        <div className="py-6">
          <p className="text-xs text-neutral-400 font-sans text-center">No ideas yet.</p>
        </div>
      )}

      {!loading && sortedKeys.length > 0 && (
        <nav className="space-y-0.5" aria-label="Idea archive by month">
          {sortedKeys.map((yearMonth) => {
            const group = grouped[yearMonth];
            const isExpanded = expandedMonths.has(yearMonth);
            const ideaCount = group.ideas.length;

            return (
              <div key={yearMonth}>
                <button
                  onClick={() => toggleMonth(yearMonth)}
                  className="w-full flex items-center justify-between px-2 py-2 rounded-md hover:bg-neutral-50 transition-colors text-left group"
                >
                  <span className="text-xs font-semibold text-neutral-700 group-hover:text-neutral-900 font-sans tracking-tight">
                    {group.label}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="text-[10px] text-neutral-400 font-mono">{ideaCount}</span>
                    <svg
                      className={`w-3 h-3 text-neutral-400 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </button>

                <div
                  className={`overflow-hidden transition-all duration-200 ease-in-out ${
                    isExpanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
                  }`}
                >
                  <ul className="space-y-0.5 pb-1">
                    {group.ideas.map((idea) => {
                      const shortDate = new Date(idea.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      });
                      return (
                        <li key={idea.id}>
                          <Link
                            href={`/ideas/${idea.id}`}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-neutral-50 transition-colors group/link"
                          >
                            <span className="text-[10px] text-neutral-400 font-mono w-7 shrink-0 tabular-nums">
                              {shortDate}
                            </span>
                            <span className="text-xs text-neutral-600 leading-snug line-clamp-1 group-hover/link:text-neutral-900 transition-colors font-sans">
                              {idea.title}
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            );
          })}
        </nav>
      )}
    </div>
  );
}