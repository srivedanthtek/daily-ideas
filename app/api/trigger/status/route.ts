import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/**
 * GET /api/trigger/status
 *
 * Returns the most recent idea generation status.
 * If an idea exists, we consider the generation "ready".
 * The client can poll this endpoint after calling /api/trigger
 * to know when a new idea has been stored.
 */
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    // Fetch the latest idea (if any)
    const { data: latest, error } = await supabase
      .from("ideas")
      .select("id, created_at, title, model_label")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      // No ideas yet
      return NextResponse.json(
        { status: "none", message: "No ideas have been generated yet." },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        status: "ready",
        idea: {
          id: latest.id,
          created_at: latest.created_at,
          title: latest.title,
          model_label: latest.model_label,
        },
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Status endpoint error:", err);
    return NextResponse.json(
      { status: "error", message: err?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}