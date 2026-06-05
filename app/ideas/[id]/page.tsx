import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase-server";
import type { Idea } from "@/lib/supabase";
import { IdeaRenderer } from "@/components/IdeaRenderer";
import { isAuthenticated } from "@/lib/auth";
import Link from "next/link";

export const revalidate = 0; // always fresh

export default async function IdeaPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const authenticated = await isAuthenticated();
  const isLocked = !authenticated;

  const { data: ideas, error } = await supabaseServer
    .from("ideas")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !ideas) {
    notFound();
  }

  const idea: Idea = ideas as Idea;

  // Strip duplicated title/date header from AI-generated content
  const bodyContent = idea.content.replace(/^📅\s+\d{4}-\d{2}-\d{2}\s+[—–-]\s+.*(\n|$)/, "").trim();

  // Estimate reading time
  const wordCount = bodyContent.split(/\s+/).length;
  const readTime = Math.max(1, Math.round(wordCount / 200));

  return (
    <div className="max-w-[720px] w-full mx-auto px-6 py-12 md:py-16">
      {/* Back button / Breadcrumb navigation */}
      <div className="mb-10">
        <Link 
          href="/" 
          className="text-xs font-semibold text-neutral-400 hover:text-black tracking-wider uppercase font-sans transition-colors flex items-center gap-1.5"
        >
          <span>←</span> Back to home
        </Link>
      </div>

      <article className="space-y-12 animate-fadeIn">
        <header className="border-b border-neutral-100 pb-10">
          <div className="flex items-center gap-2 mb-4">
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
        </header>

        <IdeaRenderer content={bodyContent} isLocked={isLocked} />
      </article>
    </div>
  );
}