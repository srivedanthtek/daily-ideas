import { ROTATION, ModelConfig } from "./modelRotation";
import { generateIdea } from "./providers";
import { supabase, Idea } from "./supabase";
import { sendEmail } from "./email";

export const CLAUDE_SYSTEM_PROMPT = `Act as a pragmatic Micro-SaaS and B2B automation strategist for a solo founder with 15 years of software engineering experience. Deliver exactly one business idea. Use today's actual date.

The 4 Non-Negotiable Constraints — every idea must satisfy all four:

1. High-Pain Problem — urgent, expensive, or compliance-driven problems actively costing businesses time and money today. Solve a real workflow bottleneck or risk that people will pay to eliminate.

2. Solo-Founder Buildable — full MVP achievable by one senior engineer in 1–2 weeks including auth, billing, and core functionality.

3. Technical Moat — requires genuine engineering depth: complex API orchestration, real-time data pipelines, multi-system sync, domain-specific automation, or specialized algorithms. Not a generic AI wrapper or low-code tool.

4. Narrow, Reachable ICP — specific business segment with clear distribution path. Not "SMBs" or "developers." The customer acquisition strategy should be obvious.

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

**💰 4. Monetization Opportunity**
- **Why People Will Pay:** [What value justifies paid access: time saved, risk eliminated, revenue enabled, compliance achieved, etc.]
- **Likely Model:** [Subscription, usage-based, one-time, or embedded—whichever fits naturally. Don't force it.]`;

/**
 * Reads the fallback provider order from the FALLBACK_PROVIDERS env var.
 * Format: comma-separated entries of "provider:model:label"
 * Example: "anthropic:claude-3-5-sonnet-20241022:Claude 3.5 Sonnet,openrouter:meta-llama/llama-3-70b-instruct:Llama 3 70B"
 * Falls back to a sensible default if the env var is not set.
 */
function getFallbackOrder(): ModelConfig[] {
  const envVal = process.env.FALLBACK_PROVIDERS;
  if (!envVal) {
    console.warn("FALLBACK_PROVIDERS env var not set. Using hardcoded default fallback order.");
    return [
      { provider: "anthropic", model: "claude-3-5-sonnet-20241022", label: "Claude 3.5 Sonnet" },
      { provider: "openrouter", model: "meta-llama/llama-3-70b-instruct", label: "Llama 3 70B" },
      { provider: "gemini", model: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
    ];
  }

  const entries = envVal.split(",").map((s) => s.trim()).filter(Boolean);
  const configs: ModelConfig[] = [];

  for (const entry of entries) {
    const parts = entry.split(":");
    if (parts.length < 2) {
      console.warn(`Invalid FALLBACK_PROVIDERS entry: "${entry}". Expected format: "provider:model:label". Skipping.`);
      continue;
    }
    const provider = parts[0].trim() as ModelConfig["provider"];
    const model = parts[1].trim();
    const label = parts[2]?.trim() || model;
    configs.push({ provider, model, label });
  }

  if (configs.length === 0) {
    console.warn("FALLBACK_PROVIDERS env var parsed to empty list. Using hardcoded default.");
    return [
      { provider: "anthropic", model: "claude-3-5-sonnet-20241022", label: "Claude 3.5 Sonnet" },
      { provider: "openrouter", model: "meta-llama/llama-3-70b-instruct", label: "Llama 3 70B" },
      { provider: "gemini", model: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
    ];
  }

  return configs;
}

/**
 * Attempts to parse the title and date from generated content.
 */
function parseTitleAndDate(content: string): { title: string; dateLabel: string } {
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

  return { title, dateLabel };
}

/**
 * Saves a successfully generated idea to Supabase.
 */
async function saveIdea(
  content: string,
  provider: string,
  modelLabel: string
): Promise<Idea | null> {
  const { title, dateLabel } = parseTitleAndDate(content);

  const { data: newIdea, error: insertError } = await supabase
    .from("ideas")
    .insert({
      title,
      date_label: dateLabel,
      content,
      provider,
      model_label: modelLabel,
      sent_email: false,
    })
    .select()
    .single();

  if (insertError) {
    console.error("Failed to save new idea to Supabase:", insertError.message);
    return null;
  }

  return newIdea as Idea;
}

/**
 * Sends the email notification and marks the idea as emailed on success.
 */
async function sendAndMarkEmail(savedIdea: Idea): Promise<void> {
  console.log("Sending email notification to recipient...");
  const emailSent = await sendEmail({
    title: savedIdea.title,
    dateLabel: savedIdea.date_label,
    content: savedIdea.content,
    modelLabel: savedIdea.model_label,
    ideaId: savedIdea.id,
  });

  if (emailSent) {
    await supabase.from("ideas").update({ sent_email: true }).eq("id", savedIdea.id);
    savedIdea.sent_email = true;
  }
}

export async function runIdeaGenerationAndEmailPipeline(): Promise<{ success: boolean; idea?: Idea; error?: string }> {
  try {
    // 0. Verify the ideas table exists (simple sanity check)
    const { error: tableError } = await supabase.from("ideas").select("id", { count: "exact", head: true });
    if (tableError) {
      console.error("Supabase table 'ideas' does not exist or is inaccessible:", tableError);
      return { success: false, error: "Supabase table 'ideas' does not exist or is inaccessible" };
    }

    // 1. Read fallback order from config (env var or hardcoded default)
    const fallbackOrder = getFallbackOrder();
    console.log(`Fallback provider order: ${fallbackOrder.map((m) => m.label).join(" → ")}`);

    // 2. Try providers in strict order, falling through on failure
    let content: string | null = null;
    let usedProvider: string = "";
    let usedModelLabel: string = "";

    for (const modelConfig of fallbackOrder) {
      console.log(`Attempting generation with ${modelConfig.provider} (${modelConfig.label})...`);

      try {
        const result = await generateIdea(modelConfig, CLAUDE_SYSTEM_PROMPT);
        content = result.text;
        usedProvider = modelConfig.provider;
        usedModelLabel = modelConfig.label;
        console.log(`Successfully generated idea with ${modelConfig.provider} (latency: ${result.latencyMs}ms)`);
        break;
      } catch (attemptError: any) {
        console.warn(
          `${modelConfig.provider} (${modelConfig.label}) failed: ${attemptError?.message || attemptError}. Trying next provider...`
        );
        // Continue to next provider in the fallback chain
      }
    }

    if (!content) {
      return {
        success: false,
        error: "All providers failed to generate an idea. Check generation_logs in Supabase for details.",
      };
    }

    // 3. Save the new idea to Supabase
    const savedIdea = await saveIdea(content, usedProvider, usedModelLabel);
    if (!savedIdea) {
      return { success: false, error: "Failed to save idea to Supabase after successful generation" };
    }

    // 4. Send the notification email
    await sendAndMarkEmail(savedIdea);

    return { success: true, idea: savedIdea };
  } catch (err: any) {
    console.error("Error running daily generation pipeline:", err);
    return { success: false, error: err?.message || String(err) };
  }
}