import { supabaseServer } from "@/lib/supabase-server";
import type { Idea } from "@/lib/supabase";
import { IdeaRenderer } from "@/components/IdeaRenderer";
import IdeaSidebar from "@/components/IdeaSidebar";
import IdeaArchiveList from "@/components/IdeaArchiveList";
import { isAuthenticated } from "@/lib/auth";

export const revalidate = 0; // Fetch latest content always on home

export default async function Home() {
  const authenticated = await isAuthenticated();
  const isLocked = !authenticated;

  // Fetch latest idea
  const { data: latestIdeas, error } = await supabaseServer
    .from("ideas")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1);

  if (error || !latestIdeas || latestIdeas.length === 0) {
    return (
      <div className="max-w-[1192px] w-full mx-auto px-6 py-24 lg:py-32">
        <div className="flex flex-col lg:flex-row gap-16 items-start">
          {/* Empty Main Column */}
          <article className="flex-1 lg:max-w-[720px] space-y-8 animate-fadeIn">
            <div className="border-b border-neutral-100 pb-12">
              <div className="flex items-center gap-2 mb-4">
                <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest font-sans">Latest Spark</p>
              </div>
              <div className="space-y-4">
                <div className="h-12 bg-neutral-100 rounded animate-pulse w-3/4"></div>
                <div className="h-8 bg-neutral-100 rounded animate-pulse w-1/2"></div>
                <div className="h-6 bg-neutral-100 rounded animate-pulse w-1/3"></div>
              </div>
            </div>
            <div className="prose max-w-none">
              <div className="space-y-4 animate-pulse">
                <div className="h-6 bg-neutral-100 rounded w-full"></div>
                <div className="h-6 bg-neutral-100 rounded w-5/6"></div>
                <div className="h-6 bg-neutral-100 rounded w-4/5"></div>
                <div className="h-6 bg-neutral-100 rounded w-3/4"></div>
              </div>
            </div>
          </article>

          {/* Medium-style Staff Picks Sidebar - Empty State */}
          <aside className="w-full lg:w-[320px] shrink-0 border-t lg:border-t-0 lg:border-l border-neutral-100 pt-10 lg:pt-0 lg:pl-8 sticky top-28">
            <div className="w-full lg:w-[320px] flex-shrink-0">
              <div className="border-b border-neutral-100 pb-3 mb-6">
                <h3 className="font-sans font-bold text-xs uppercase tracking-wider text-neutral-900">
                  Staff Picks & Recommendations
                </h3>
              </div>
              <ul className="space-y-6 animate-pulse">
                {[1, 2, 3].map((i) => (
                  <li key={i} className="flex gap-4 items-start">
                    <span className="text-neutral-200 font-sans font-extrabold text-2xl leading-none w-8 select-none">
                      {String(i).padStart(2, "0")}
                    </span>
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="h-5 bg-neutral-100 rounded w-3/4"></div>
                      <div className="h-4 bg-neutral-100 rounded w-1/2"></div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    );
  }

  const idea: Idea = latestIdeas[0];

  // Strip duplicated title/date header from AI-generated content (first line is 📅 YYYY-MM-DD — Title)
  let bodyContent = idea.content.replace(/^📅\s+\d{4}-\d{2}-\d{2}\s+[—–-]\s+.*(\n|$)/, "").trim();

  // Strip Phase 1 Discovery content if the model accidentally outputs it (should be internal only)
  bodyContent = bodyContent.replace(/## PHASE 1 — DISCOVERY[\s\S]*?## PHASE 2 — OUTPUT\s*/i, "").trim();
  // Also strip any "Running Phase 1 Discovery..." or "silently working through..." commentary
  bodyContent = bodyContent.replace(/Running Phase 1 Discovery.*\(silently working through.*?\)/gi, "").trim();

  // Normalize markdown to prevent hydration errors.
  // ReactMarkdown wraps block-level elements in <p> if they're not separated by blank lines.
  // This is invalid HTML (<pre>, <table>, <div> inside <p>) and causes hydration failures.
  // The fixes below only fire when there's a missing blank line — they won't double-space.
  bodyContent = bodyContent
    // 1. Blank line before code fences (```) - prevents <pre> inside <p>
    .replace(/([^\n])\n```/g, "$1\n\n```")
    // 2. Blank line before table rows (| ... |) - prevents <table> inside <p>
    //    Only fires when preceding line does NOT end with '|' (avoiding table row chaining)
    .replace(/([^|\n])\n\|/g, "$1\n\n|")
    // 3. Blank line before standalone horizontal rules (---, ***, ___) - prevents <hr> inside <p>
    //    Only matches ---/***/___ on their own line, NOT table separators (|---|---|)
    .replace(/([^\n])\n(---|\*\*\*|___)\s*\n/g, "$1\n\n$2\n");

  // Estimate a realistic reading time based on content length
  const wordCount = bodyContent.split(/\s+/).length;
  const readTime = Math.max(1, Math.round(wordCount / 200));

  return (
    <div className="max-w-[1400px] w-full mx-auto py-10 lg:py-14">
      <div className="flex flex-col lg:flex-row gap-6 xl:gap-8 items-start">
        {/* Left Sidebar — All Ideas by Date (collapsible, flush to left edge) */}
        <aside className="w-full lg:w-[260px] shrink-0 hidden lg:block sticky top-28 max-h-[calc(100vh-10rem)] overflow-y-auto pl-4 sm:pl-6">
          <IdeaArchiveList />
        </aside>

        {/* Main Article Content Column — flex-1 fills what remains */}
        <article className="flex-1 min-w-0 max-w-[760px] mx-auto space-y-8 animate-fadeIn px-4 sm:px-0">
          <div className="border-b border-neutral-100 pb-12">
            <div className="flex items-center gap-2 mb-4">
              <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest font-sans">Latest Spark</p>
              <span className="text-neutral-300 select-none font-sans text-xs">&middot;</span>
              <span className="text-xs font-semibold text-neutral-500 font-sans">{readTime} min read</span>
            </div>
            
            <h1 className="font-serif font-extrabold text-3xl sm:text-[40px] text-neutral-900 tracking-tight leading-[1.1] mb-6">
              {idea.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-neutral-500 font-sans">
              <span className="font-medium text-neutral-700">{idea.date_label || new Date(idea.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
              <span className="text-neutral-300 select-none">&middot;</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-800">
                {idea.model_label?.replace("claude-", "").replace("gemini-", "").replace("openrouter-", "") || "AI Engine"}
              </span>
            </div>
          </div>

          <IdeaRenderer content={bodyContent} isLocked={isLocked} />
        </article>

        {/* Right Sidebar — Staff Picks (thinner, pushed right) */}
        <aside className="w-full lg:w-[280px] shrink-0 hidden lg:block sticky top-28">
          <IdeaSidebar />
        </aside>
      </div>
    </div>
  );
}