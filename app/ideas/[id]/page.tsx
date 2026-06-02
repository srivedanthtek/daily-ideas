import { notFound } from "next/navigation";
import { supabase, Idea } from "@/lib/supabase";
import { IdeaRenderer } from "@/components/IdeaRenderer";

export const revalidate = 0; // always fresh

export default async function IdeaPage({ params }: { params: { id: string } }) {
  const { id } = params;

  const { data: ideas, error } = await supabase
    .from("ideas")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !ideas) {
    notFound();
  }

  const idea: Idea = ideas as Idea;

  return (
    <article className="space-y-8">
      <header className="border-b border-gray-100 pb-8">
        <h1 className="font-serif font-bold text-3xl sm:text-4xl text-[#1a1a1a] tracking-tight leading-tight mb-4">
          {idea.title}
        </h1>
        <div className="flex items-center gap-3 text-sm text-[#6b7280]">
          <span>{idea.date_label}</span>
          <span>&middot;</span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {idea.model_label}
          </span>
        </div>
      </header>

      <IdeaRenderer content={idea.content} />
    </article>
  );
}