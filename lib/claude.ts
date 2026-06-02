import { ROTATION, ModelConfig } from "./modelRotation";
import { generateIdea } from "./providers";
import { supabase, Idea } from "./supabase";
import { sendEmail } from "./email";

export const CLAUDE_SYSTEM_PROMPT = `Act as a pragmatic Micro-SaaS and B2B automation strategist for a solo founder with 15 years of software engineering experience. Deliver exactly one business idea. Use today's actual date.

The 6 Non-Negotiable Constraints — every idea must satisfy all six:
1. High-Pain Problem — urgent, expensive, or compliance-driven problems actively costing businesses time and money today.
2. Solo-Founder Buildable — full MVP achievable by one senior engineer in 1–2 weeks including auth, billing, and core functionality.
3. Zero-Marketing Distribution — must live inside an existing ecosystem: Shopify App Store, Salesforce AppExchange, Atlassian Marketplace, Slack App Directory, Chrome Web Store, Raycast Store, MCP servers, or similar.
4. Monetization-First — clear pricing on day one: flat monthly subscription, usage-based billing, or one-time licensing. No "grow first, charge later."
5. Technical Moat — requires genuine engineering depth: complex API orchestration, real-time data pipelines, multi-system sync, or domain‑specific automation. No generic AI wrappers.
6. Narrow ICP — specific, reachable business segment. Not "SMBs" or "developers." Example: Shopify merchants running 3PL fulfillment, or SOC 2‑audited SaaS companies with 10–50 engineers.

Output format — use this exactly:

### 📅 [Today's Date] — [Product Name]: [One-Line Value Proposition]

**🎯 1. Who's Bleeding & Why**
- **ICP:** [Specific business type, size, role of buyer]
- **The Pain:** [Exact daily workflow failure]
- **The Cost of Inaction:** [What it costs them in time, money, or risk]

**📦 2. Distribution Channel**
- **Primary:** [Exact marketplace or ecosystem]
- **Why They'll Find It:** [Search behavior or trigger that leads to listing]

**🔧 3. Solution & Build Architecture**
- **Core Mechanic:** [What the product actually does, in plain terms]
- **Tech Stack:** [Specific, opinionated recommendation]
- **Hardest Part:** [The one technical challenge that creates the moat]

**💰 4. Pricing Model**
- **Structure:** [Flat / tiered / usage-based with exact price points]
- **Rationale:** [Why this pricing fits the buyer's willingness to pay]

**🧪 5. Pre-Build Validation (3 Steps)**
1. [First concrete action]
2. [Second action]
3. [Third action]

**⚠️ 6. Biggest Risk**
- [The one thing most likely to kill this idea and how to test for early]`;

export async function runIdeaGenerationAndEmailPipeline(): Promise<{ success: boolean; idea?: Idea; error?: string }> {
  try {
    // 0. Verify the ideas table exists (simple sanity check)
    const { error: tableError } = await supabase.from("ideas").select("id", { count: "exact", head: true });
    if (tableError) {
      console.error("Supabase table 'ideas' does not exist or is inaccessible:", tableError);
      return { success: false, error: "Supabase table 'ideas' does not exist or is inaccessible" };
    }

    // 1. Fetch total count of existing ideas to perform round‑robin deterministic selection
    const { count, error: countError } = await supabase
      .from("ideas")
      .select("*", { count: "exact", head: true });

    if (countError) {
      console.error("Failed to fetch count of existing ideas, defaulting to 0:", countError);
    }

    const ideasCount = count || 0;
    const rotationIndex = ideasCount % ROTATION.length;
    const chosenModel: ModelConfig = ROTATION[rotationIndex];

    console.log(`Ideas count: ${ideasCount}. Chosen model index ${rotationIndex}: ${chosenModel.label} via ${chosenModel.provider}`);

    // 2. Generate the idea content
    const content = await generateIdea(chosenModel, CLAUDE_SYSTEM_PROMPT);

    // 3. Parse Title & Date from generated content
    // Expected format: ### 📅 [Date] — [Product Name]: [Value Proposition]
    let title = "Daily Innovation Idea";
    let dateLabel = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const titleLineMatch = content.match(/### 📅\s*([^-—]+)[-—]\s*([^:]+):/i) || content.match(/###\s*📅?\s*([^-—\n]+)[-—]\s*([^:\n]+)/i);
    if (titleLineMatch) {
      dateLabel = titleLineMatch[1].trim();
      title = titleLineMatch[2].trim();
    } else {
      const fallbackMatch = content.match(/###\s*(.*)/i);
      if (fallbackMatch) {
        const parts = fallbackMatch[1].split(/[-—:]/);
        if (parts.length >= 2) {
          title = parts[1].trim();
          dateLabel = parts[0].replace(/[📅\s]/g, "").trim() || dateLabel;
        } else {
          title = fallbackMatch[1].trim();
        }
      }
    }

    // Clean any stray markdown symbols from the title
    title = title.replace(/^[📅\s*#—-]+|[📅\s*#—-]+$/g, "").trim();

    // 4. Save the new idea to Supabase
    const { data: newIdea, error: insertError } = await supabase
      .from("ideas")
      .insert({
        title,
        date_label: dateLabel,
        content,
        provider: chosenModel.provider,
        model_label: chosenModel.label,
        sent_email: false,
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Failed to save new idea to Supabase: ${insertError.message}`);
    }

    const savedIdea = newIdea as Idea;

    // 5. Send the notification email via Resend
    console.log("Sending email notification to recipient...");
    const emailSent = await sendEmail({
      title: savedIdea.title,
      dateLabel: savedIdea.date_label,
      content: savedIdea.content,
      modelLabel: savedIdea.model_label,
      ideaId: savedIdea.id,
    });

    if (emailSent) {
      // Mark the idea as emailed
      await supabase.from("ideas").update({ sent_email: true }).eq("id", savedIdea.id);
      savedIdea.sent_email = true;
    }

    return { success: true, idea: savedIdea };
  } catch (err: any) {
    console.error("Error running daily generation pipeline:", err);
    return { success: false, error: err?.message || String(err) };
  }
}