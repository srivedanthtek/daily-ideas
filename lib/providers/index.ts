import { AnthropicProvider, GenerationResult } from "./anthropic";
import { GeminiProvider } from "./gemini";
import { OpenRouterProvider } from "./openrouter";
import { ModelConfig } from "../modelRotation";
import { supabase } from "../supabase";

export interface IdeaProvider {
  name: string;
  model: string;
  generate(prompt: string): Promise<GenerationResult>;
}

function createProvider(modelConfig: ModelConfig): IdeaProvider {
  switch (modelConfig.provider) {
    case "anthropic":
      return new AnthropicProvider(modelConfig.model);
    case "gemini":
      return new GeminiProvider(modelConfig.model);
    case "openrouter":
      return new OpenRouterProvider(modelConfig.model);
    default:
      return new AnthropicProvider();
  }
}

export interface GenerationAttempt {
  provider: string;
  model: string;
  success: boolean;
  inputTokens: number | null;
  outputTokens: number | null;
  latencyMs: number;
  errorMessage: string | null;
}

/**
 * Generates an idea using a single provider, logs the attempt to Supabase,
 * and returns the result or throws.
 */
export async function generateIdea(
  modelConfig: ModelConfig,
  systemPrompt: string
): Promise<{ text: string; tokenUsage: { input: number; output: number } | null; latencyMs: number }> {
  const provider = createProvider(modelConfig);
  const startTime = Date.now();

  try {
    const result = await provider.generate(systemPrompt);
    const latencyMs = Date.now() - startTime;

    // Log success to Supabase
    await logGeneration({
      provider: provider.name,
      model: provider.model,
      success: true,
      inputTokens: result.tokenUsage?.input ?? null,
      outputTokens: result.tokenUsage?.output ?? null,
      latencyMs,
      errorMessage: null,
    });

    console.log(`[${provider.name}] Generation succeeded in ${latencyMs}ms. Tokens: ${JSON.stringify(result.tokenUsage)}`);

    return {
      text: result.text,
      tokenUsage: result.tokenUsage,
      latencyMs,
    };
  } catch (error: any) {
    const latencyMs = Date.now() - startTime;
    const errorMessage = error?.message || String(error);

    // Log failure to Supabase
    await logGeneration({
      provider: provider.name,
      model: provider.model,
      success: false,
      inputTokens: null,
      outputTokens: null,
      latencyMs,
      errorMessage,
    });

    console.error(`[${provider.name}] Generation failed after ${latencyMs}ms: ${errorMessage}`);
    throw error;
  }
}

/**
 * Inserts a generation attempt record into Supabase.
 */
async function logGeneration(attempt: GenerationAttempt): Promise<void> {
  try {
    const { error } = await supabase.from("generation_logs").insert({
      provider: attempt.provider,
      model: attempt.model,
      success: attempt.success,
      input_tokens: attempt.inputTokens,
      output_tokens: attempt.outputTokens,
      total_tokens:
        attempt.inputTokens !== null && attempt.outputTokens !== null
          ? attempt.inputTokens + attempt.outputTokens
          : null,
      latency_ms: attempt.latencyMs,
      error_message: attempt.errorMessage,
    });

    if (error) {
      console.warn("Failed to log generation to Supabase:", error.message);
    }
  } catch (logError) {
    // Don't let logging failure break the pipeline
    console.warn("Exception while logging generation to Supabase:", logError);
  }
}