import { supabase, Idea } from "@/lib/supabase";
import { IdeaRenderer } from "@/components/IdeaRenderer";

export const revalidate = 0; // Fetch latest content always on home

export default async function Home() {
  // Fetch latest idea
  const { data: latestIdeas, error } = await supabase
    .from("ideas")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1);

  if (error || !latestIdeas || latestIdeas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-20">
        <span className="text-4xl mb-4">✦</span>
        <h2 className="font-sans font-bold text-xl mb-2">No Ideas Found Yet</h2>
        <p className="text-muted text-sm max-w-sm font-sans mb-6">
          The database is currently empty. Run the cron job or manual trigger to generate the first Spark micro-SaaS idea.
        </p>
      </div>
    );
  }

  const idea: Idea = latestIdeas[0];

  return (
    <article className="space-y-8 animate-fadeIn">
      <div className="border-b border-gray-100 pb-8">
        <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2 font-sans">Latest Idea</p>
        <h1 className="font-serif font-bold text-3xl sm:text-4xl text-[#1a1a1a] tracking-tight leading-tight mb-4">
          {idea.title}
        </h1>
        <div className="flex items-center gap-3 text-sm text-muted font-sans">
          <span>{idea.date_label}</span>
          <span>&middot;</span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {idea.model_label}
          </span>
        </div>
      </div>

      <IdeaRenderer content={idea.content} />
    </article>
  );
}