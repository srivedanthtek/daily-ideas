import { supabase } from "./supabase";

export interface ProviderStats {
  provider: string;
  model: string;
  totalAttempts: number;
  successes: number;
  failures: number;
  successRate: number;
  avgLatencyMs: number | null;
  totalInputTokens: number | null;
  totalOutputTokens: number | null;
  lastAttempt: string | null;
}

export interface RecentFailure {
  id: string;
  provider: string;
  model: string;
  errorMessage: string | null;
  latencyMs: number;
  createdAt: string;
}

/**
 * Returns success rate broken down by provider for a given time window.
 */
export async function getSuccessRateByProvider(
  hours: number = 168 // default: last 7 days
): Promise<ProviderStats[]> {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("generation_logs")
    .select("*")
    .gte("created_at", since)
    .order("created_at", { ascending: false });

  if (error || !data) {
    console.error("Failed to fetch generation stats:", error?.message);
    return [];
  }

  // Aggregate by provider+model
  const grouped = new Map<string, ProviderStats>();

  for (const row of data) {
    const key = `${row.provider}|${row.model}`;
    const existing = grouped.get(key) || {
      provider: row.provider,
      model: row.model,
      totalAttempts: 0,
      successes: 0,
      failures: 0,
      successRate: 0,
      avgLatencyMs: null,
      totalInputTokens: null,
      totalOutputTokens: null,
      lastAttempt: null,
    };

    existing.totalAttempts++;
    if (row.success) {
      existing.successes++;
    } else {
      existing.failures++;
    }

    // Track latency
    if (existing.avgLatencyMs === null) {
      existing.avgLatencyMs = row.latency_ms;
    } else {
      existing.avgLatencyMs =
        (existing.avgLatencyMs * (existing.totalAttempts - 1) + row.latency_ms) /
        existing.totalAttempts;
    }

    // Track token usage
    if (row.input_tokens !== null) {
      existing.totalInputTokens = (existing.totalInputTokens || 0) + row.input_tokens;
    }
    if (row.output_tokens !== null) {
      existing.totalOutputTokens = (existing.totalOutputTokens || 0) + row.output_tokens;
    }

    // Track last attempt time
    if (!existing.lastAttempt || row.created_at > existing.lastAttempt) {
      existing.lastAttempt = row.created_at;
    }

    existing.successRate = Math.round((existing.successes / existing.totalAttempts) * 100);

    grouped.set(key, existing);
  }

  return Array.from(grouped.values()).sort((a, b) => b.successRate - a.successRate);
}

/**
 * Returns the most recent failed generation attempts.
 */
export async function getRecentFailures(
  hours: number = 24,
  limit: number = 20
): Promise<RecentFailure[]> {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("generation_logs")
    .select("id, provider, model, error_message, latency_ms, created_at")
    .eq("success", false)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    console.error("Failed to fetch recent failures:", error?.message);
    return [];
  }

  return data.map((row) => ({
    id: row.id,
    provider: row.provider,
    model: row.model,
    errorMessage: row.error_message,
    latencyMs: row.latency_ms,
    createdAt: row.created_at,
  }));
}

/**
 * Returns total token usage across all providers for a given time window.
 * Useful for estimating costs.
 */
export async function getTotalTokenUsage(
  hours: number = 720 // default: last 30 days
): Promise<{ totalInput: number; totalOutput: number; total: number }> {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("generation_logs")
    .select("input_tokens, output_tokens")
    .eq("success", true)
    .gte("created_at", since);

  if (error || !data) {
    console.error("Failed to fetch token usage:", error?.message);
    return { totalInput: 0, totalOutput: 0, total: 0 };
  }

  let totalInput = 0;
  let totalOutput = 0;

  for (const row of data) {
    if (row.input_tokens !== null) totalInput += row.input_tokens;
    if (row.output_tokens !== null) totalOutput += row.output_tokens;
  }

  return { totalInput, totalOutput, total: totalInput + totalOutput };
}

/**
 * Determines which provider+model combination has performed best
 * based on success rate, then average latency.
 */
export async function getBestPerformer(
  hours: number = 168
): Promise<ProviderStats | null> {
  const stats = await getSuccessRateByProvider(hours);
  if (stats.length === 0) return null;

  // Sort by success rate desc, then avg latency asc
  stats.sort((a, b) => {
    if (b.successRate !== a.successRate) return b.successRate - a.successRate;
    return (a.avgLatencyMs ?? Infinity) - (b.avgLatencyMs ?? Infinity);
  });

  return stats[0];
}

/**
 * Prints a formatted summary of generation stats to the console.
 */
export async function printStatsSummary(): Promise<void> {
  console.log("\n=== Provider Generation Stats (last 7 days) ===\n");

  const stats = await getSuccessRateByProvider(168);
  if (stats.length === 0) {
    console.log("No generation logs found yet.");
    return;
  }

  for (const s of stats) {
    console.log(
      `${s.provider}/${s.model}: ${s.successRate}% success (${s.successes}/${s.totalAttempts})` +
        ` | Avg latency: ${s.avgLatencyMs ? Math.round(s.avgLatencyMs) + "ms" : "N/A"}` +
        ` | Tokens: ${s.totalInputTokens ?? 0} in / ${s.totalOutputTokens ?? 0} out`
    );
  }

  const tokenUsage = await getTotalTokenUsage(168);
  console.log(`\nTotal tokens (7d): ${tokenUsage.total} (${tokenUsage.totalInput} in / ${tokenUsage.totalOutput} out)`);

  const failures = await getRecentFailures(24);
  if (failures.length > 0) {
    console.log(`\nRecent failures (last 24h): ${failures.length}`);
    for (const f of failures.slice(0, 5)) {
      console.log(`  ${f.provider}/${f.model}: ${f.errorMessage ?? "Unknown error"}`);
    }
  } else {
    console.log("\nNo failures in the last 24 hours.");
  }

  console.log("");
}