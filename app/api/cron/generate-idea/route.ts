import { NextRequest, NextResponse } from "next/server";
import { runIdeaGenerationAndEmailPipeline } from "@/lib/claude";

// Force dynamic execution for API route
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    // Authenticate Cron Request
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      const searchParams = req.nextUrl.searchParams;
      const keyParam = searchParams.get("secret");
      if (keyParam !== cronSecret) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const result = await runIdeaGenerationAndEmailPipeline();

    if (!result.success) {
      return NextResponse.json(
        { error: "Generation failed", details: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Idea successfully generated, stored, and emailed!",
      idea: result.idea,
    });
  } catch (error: any) {
    console.error("Cron handler exception:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}