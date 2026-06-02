import { supabase, Idea } from "@/lib/supabase";
import Link from "next/link";

export const revalidate = 0; // always fresh

export default async function ArchivePage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  const modelFilter = typeof searchParams?.model === "string" ? searchParams.model : "";

  // Build query
  let query = supabase.from("ideas").select("*").order("created_at", { ascending: false });
  if (modelFilter) {
    query = query.eq("model_label", modelFilter);
  }

  const { data: ideas, error } = await query;

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-600">Failed to load ideas.</p>
      </div>
    );
  }

  // Get distinct model labels for filter dropdown
  const { data: distinctModels } = await supabase
    .from("ideas")
    .select("model_label", { count: "exact", head: false })
    .order("model_label", { ascending: true });

  const modelLabels = Array.from(new Set(distinctModels?.map((i: any) => i.model_label) ?? []));

  return (
    <section className="space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="font-serif text-3xl font-bold text-[#1a1a1a]">Archive</h1>
        <form method="get" className="flex items-center gap-2">
          <label htmlFor="model-filter" className="mr-2 text-sm font-medium text-[#6b7280]">
            Filter by model:
          </label>
          <select
            id="model-filter"
            name="model"
            defaultValue={modelFilter}
            onChange={(e) => e.currentTarget.form?.submit()}
            className="rounded border border-gray-300 bg-white px-2 py-1 text-sm"
          >
            <option value="">All</option>
            {modelLabels.map((label) => (
              <option key={label} value={label}>
                {label}
              </option>
            ))}
          </select>
        </form>
      </header>

      {ideas && ideas.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2">
          {ideas.map((idea: Idea) => (
            <Link key={idea.id} href={`/ideas/${idea.id}`} className="block border border-gray-100 rounded-lg p-4 hover:shadow-md transition-shadow">
              <h2 className="font-serif text-xl font-bold text-[#1a1a1a] mb-2 line-clamp-2">{idea.title}</h2>
              <p className="text-xs text-[#6b7280] mb-2">{idea.date_label}</p>
              <p className="text-sm text-[#1a1a1a] line-clamp-3">{idea.content.split("\n").slice(0, 3).join(" ")}</p>
              <span className="inline-block mt-3 text-xs px-2 py-0.5 bg-gray-100 text-gray-800 rounded">{idea.model_label}</span>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-center text-[#6b7280]">No ideas have been generated yet.</p>
      )}
    </section>
  );
}