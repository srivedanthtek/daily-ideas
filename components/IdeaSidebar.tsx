"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase, Idea } from "@/lib/supabase";

export default function IdeaSidebar() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchIdeas() {
      const { data, error } = await supabase
        .from("ideas")
        .select("id,title,created_at,date_label,model_label")
        .order("created_at", { ascending: false })
        .limit(6);

      if (error) {
        console.error("Error fetching ideas:", error);
        setIdeas([]);
      } else {
        setIdeas(data as Idea[]);
      }
      setLoading(false);
    }

    fetchIdeas();
  }, []);

  if (loading) {
    return (
      <aside className="w-full lg:w-[320px] flex-shrink-0 space-y-4">
        <h3 className="font-sans font-bold text-sm uppercase tracking-wider text-neutral-900">
          Recent Sparks
        </h3>
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex gap-4">
              <span className="text-neutral-200 font-sans font-bold text-2xl">0{i}</span>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-neutral-100 rounded w-4/5"></div>
                <div className="h-3 bg-neutral-100 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </aside>
    );
  }

  if (ideas.length === 0) {
    return (
      <aside className="w-full lg:w-[320px] flex-shrink-0">
        <div className="border-b border-neutral-100 pb-3 mb-6">
          <h3 className="font-sans font-bold text-xs uppercase tracking-wider text-neutral-900">
            Staff Picks & Recommendations
          </h3>
        </div>
        <div className="text-center py-12 text-neutral-400 text-sm font-sans">
          No sparks yet. Generate your first idea!
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-full lg:w-[320px] flex-shrink-0">
      <div className="border-b border-neutral-100 pb-3 mb-6">
        <h3 className="font-sans font-bold text-xs uppercase tracking-wider text-neutral-900">
          Staff Picks & Recommendations
        </h3>
      </div>
      <ul className="space-y-6">
        {ideas.map((idea, index) => (
          <li key={idea.id} className="flex gap-4 items-start group">
            <span className="text-neutral-200 font-sans font-extrabold text-2xl leading-none w-8 select-none transition-colors group-hover:text-neutral-400">
              {String(index + 1).padStart(2, "0")}
            </span>
            <div className="flex-1 min-w-0">
              <Link
                href={`/ideas/${idea.id}`}
                className="block text-sm font-sans font-bold text-neutral-900 leading-snug hover:text-neutral-600 transition-colors mb-3"
              >
                {idea.title}
              </Link>
              <div className="flex items-center gap-3 text-[11px] text-neutral-400 font-sans">
                <span>{idea.date_label || new Date(idea.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                <span>&middot;</span>
                <span className="text-neutral-500 font-medium">
                  {idea.model_label?.replace("claude-", "").replace("gemini-", "").replace("openrouter-", "") || "AI Spark"}
                </span>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-8 pt-6 border-t border-neutral-100">
        <Link 
          href="/archive" 
          className="text-xs text-neutral-500 hover:text-black font-semibold tracking-tight transition-colors flex items-center gap-1"
        >
          See full catalog <span className="text-sm">→</span>
        </Link>
      </div>
    </aside>
  );
}