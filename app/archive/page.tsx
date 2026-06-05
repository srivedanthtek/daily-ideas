import { supabaseServer } from "@/lib/supabase-server";
import type { Idea } from "@/lib/supabase";
import Link from "next/link";
import FilterForm from "./FilterForm";

export const revalidate = 0; // always fresh

export default async function ArchivePage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  const modelFilter = typeof searchParams?.model === "string" ? searchParams.model : "";

  // Build query
  let query = supabaseServer.from("ideas").select("*").order("created_at", { ascending: false });
  if (modelFilter) {
    query = query.eq("model_label", modelFilter);
  }

  const { data: ideas, error } = await query;

  if (error) {
    return (
      <div className="max-w-[800px] mx-auto px-6 py-20 text-center">
        <p className="text-red-600 font-sans text-sm font-medium">Failed to load archive concepts.</p>
      </div>
    );
  }

  // Get distinct model labels for filter dropdown
  const { data: distinctModels } = await supabaseServer
    .from("ideas")
    .select("model_label", { count: "exact", head: false })
    .order("model_label", { ascending: true });

  const modelLabels = Array.from(new Set(distinctModels?.map((i: any) => i.model_label) ?? []));

  const hasIdeas = ideas && ideas.length > 0 && !error;
  const isEmpty = !hasIdeas && (ideas === null || (ideas && ideas.length === 0 && !modelFilter && !error));
  const isFilteredEmpty = !hasIdeas && !isEmpty && ideas && ideas.length === 0;

  return (
    <div className="max-w-[800px] w-full mx-auto px-6 py-10 lg:py-16">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-100 pb-6 mb-8">
        <div>
          <h1 className="font-serif font-extrabold text-3xl sm:text-4xl text-neutral-900 tracking-tight">Archive</h1>
          <p className="text-neutral-500 text-xs sm:text-sm font-sans mt-1">A historical index of all daily generated SaaS sparks.</p>
        </div>
        
        <FilterForm modelFilter={modelFilter} modelLabels={modelLabels} />
      </header>

      {hasIdeas ? (
        <div className="space-y-0">
          {ideas!.map((idea: Idea) => {
            // Calculate read time
            const wordCount = idea.content.split(/\s+/).length;
            const readTime = Math.max(1, Math.round(wordCount / 200));
            // Truncate preview
            const plainText = idea.content
              .replace(/[#*`_\[\]()]/g, "") // remove simple markdown chars
              .substring(0, 180) + "...";

            return (
              <article key={idea.id} className="py-10 group border-b border-neutral-100 last:border-b-0">
                <div className="flex flex-col gap-6">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-400 font-sans">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-neutral-100 text-neutral-700">
                      {idea.model_label?.replace("claude-", "").replace("gemini-", "").replace("openrouter-", "") || "AI Engine"}
                    </span>
                    <span className="text-neutral-300">&middot;</span>
                    <span>{readTime} min read</span>
                    <span className="text-neutral-300">&middot;</span>
                    <span>{idea.date_label || new Date(idea.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                  </div>

                  <Link href={`/ideas/${idea.id}`} className="block group-hover:opacity-80 transition-opacity">
                    <h2 className="font-serif text-xl sm:text-2xl font-bold text-neutral-900 mb-6 leading-snug tracking-tight">
                      {idea.title}
                    </h2>
                  </Link>

                  <p className="text-sm sm:text-base font-serif text-neutral-600 line-clamp-2 leading-relaxed mb-6">
                    {plainText}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      ) : isEmpty ? (
        <div className="text-center py-20 bg-neutral-50 rounded-xl border border-neutral-200 border-dashed">
          <div className="text-4xl mb-4 text-neutral-300">✦</div>
          <p className="text-neutral-400 font-sans text-sm font-medium mb-1">No sparks yet</p>
          <p className="text-neutral-300 font-sans text-xs">Ideas will appear here once they are generated.</p>
        </div>
      ) : isFilteredEmpty ? (
        <div className="text-center py-20 bg-neutral-50 rounded-xl border border-neutral-200 border-dashed">
          <p className="text-neutral-400 font-sans text-sm">No ideas found matching that model filter.</p>
        </div>
      ) : null}
    </div>
  );
}