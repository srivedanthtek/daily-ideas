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
 * Normalizes a title string for hashing.
 * Strips special chars, emoji, lowercases, and trims whitespace.
 */
export function normalizeForHash(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, "") // remove punctuation, emoji, special chars
    .replace(/\s+/g, " ")    // collapse whitespace
    .trim();
}

/**
 * Computes a SHA-256 hex hash of a string using the Web Crypto API.
 * Falls back to a simple string hash if crypto is unavailable.
 */
export async function computeHash(input: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch {
    // Fallback: simple hash for environments without Web Crypto
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return Math.abs(hash).toString(16);
  }
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
 * Fetches recent ideas (last 30 or 30 days) to build an avoid list for regeneration.
 */
async function fetchRecentTitles(): Promise<string[]> {
  const { data, error } = await supabase
    .from("ideas")
    .select("title")
    .order("created_at", { ascending: false })
    .limit(30);

  if (error || !data) {
    console.warn("Failed to fetch recent ideas for avoid list:", error?.message);
    return [];
  }

  return data.map((row) => row.title).filter(Boolean);
}

/**
 * Checks if a generated title's hash already exists in the database.
 */
async function isDuplicateTitle(title: string): Promise<boolean> {
  const normalized = normalizeForHash(title);
  const hash = await computeHash(normalized);

  const { data, error } = await supabase
    .from("ideas")
    .select("id")
    .eq("content_hash", hash)
    .limit(1);

  if (error) {
    console.warn("Failed to check for duplicate title:", error.message);
    return false;
  }

  return data !== null && data.length > 0;
}

/**
 * Saves a successfully generated idea to Supabase with a content hash.
 */
async function saveIdea(
  content: string,
  provider: string,
  modelLabel: string
): Promise<Idea | null> {
  const { title, dateLabel } = parseTitleAndDate(content);
  const normalized = normalizeForHash(title);
  const contentHash = await computeHash(normalized);

  const { data: newIdea, error: insertError } = await supabase
    .from("ideas")
    .insert({
      title,
      date_label: dateLabel,
      content,
      provider,
      model_label: modelLabel,
      sent_email: false,
      content_hash: contentHash,
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

/**
 * Attempts to generate content by trying fallback providers in order.
 * Returns { content, provider, modelLabel } or null if all fail.
 */
async function generateWithFallback(prompt: string): Promise<{ content: string; provider: string; modelLabel: string } | null> {
  const fallbackOrder = getFallbackOrder();
  console.log(`Fallback provider order: ${fallbackOrder.map((m) => m.label).join(" → ")}`);

  for (const modelConfig of fallbackOrder) {
    console.log(`Attempting generation with ${modelConfig.provider} (${modelConfig.label})...`);

    try {
      const result = await generateIdea(modelConfig, prompt);
      console.log(`Successfully generated idea with ${modelConfig.provider} (latency: ${result.latencyMs}ms)`);
      return { content: result.text, provider: modelConfig.provider, modelLabel: modelConfig.label };
    } catch (attemptError: any) {
      console.warn(
        `${modelConfig.provider} (${modelConfig.label}) failed: ${attemptError?.message || attemptError}. Trying next provider...`
      );
      // Continue to next provider in the fallback chain
    }
  }

  return null;
}

/**
 * Maximum number of regeneration attempts to find a unique idea.
 */
const MAX_DEDUP_RETRIES = 3;

export async function runIdeaGenerationAndEmailPipeline(): Promise<{ success: boolean; idea?: Idea; error?: string }> {
  try {
    // 0. Verify the ideas table exists (simple sanity check)
    const { error: tableError } = await supabase.from("ideas").select("id", { count: "exact", head: true });
    if (tableError) {
      console.error("Supabase table 'ideas' does not exist or is inaccessible:", tableError);
      return { success: false, error: "Supabase table 'ideas' does not exist or is inaccessible" };
    }

    // 1. Generate with dedup circuit — retry up to MAX_DEDUP_RETRIES times
    let attempt = 0;
    let savedIdea: Idea | null = null;

    while (attempt <= MAX_DEDUP_RETRIES && !savedIdea) {
      let prompt = CLAUDE_SYSTEM_PROMPT;

      // On retry 1+, inject avoid list of recent titles
      if (attempt > 0) {
        const recentTitles = await fetchRecentTitles();
        if (recentTitles.length > 0) {
          const avoidList = recentTitles
            .map((t) => `- ${t}`)
            .join("\n");
          prompt +=
            `\n\nPreviously generated ideas — DO NOT reuse any of these product names or concepts. Generate something completely different:\n${avoidList}`;
          console.log(`Retry ${attempt}: injecting ${recentTitles.length} existing titles into prompt to avoid duplicates.`);
        }
      }

      // 2. Generate content using fallback providers
      const result = await generateWithFallback(prompt);
      if (!result) {
        return {
          success: false,
          error: "All providers failed to generate an idea. Check generation_logs in Supabase for details.",
        };
      }

      const { title } = parseTitleAndDate(result.content);

      // 3. Check if this title is a duplicate (hash lookup against all history)
      const duplicate = await isDuplicateTitle(title);

      if (duplicate) {
        console.warn(`Duplicate detected: "${title}" already exists. Re-generating... (attempt ${attempt + 1}/${MAX_DEDUP_RETRIES})`);
        attempt++;
        continue;
      }

      // 4. Unique! Save the idea
      savedIdea = await saveIdea(result.content, result.provider, result.modelLabel);
      if (!savedIdea) {
        return { success: false, error: "Failed to save idea to Supabase after successful generation" };
      }
    }

    if (!savedIdea) {
      return {
        success: false,
        error: `Failed to generate a unique idea after ${MAX_DEDUP_RETRIES + 1} attempts. Too many duplicates detected.`,
      };
    }

    // 5. Send the notification email
    await sendAndMarkEmail(savedIdea);

    return { success: true, idea: savedIdea };
  } catch (err: any) {
    console.error("Error running daily generation pipeline:", err);
    return { success: false, error: err?.message || String(err) };
  }
}