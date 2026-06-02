import { AnthropicProvider, IdeaProvider } from "./anthropic";
import { GeminiProvider } from "./gemini";
import { OpenRouterProvider } from "./openrouter";
import { ROTATION, ModelConfig } from "../modelRotation";

export async function generateIdea(modelConfig: ModelConfig, systemPrompt: string): Promise<string> {
  let provider: IdeaProvider;

  switch (modelConfig.provider) {
    case "anthropic":
      provider = new AnthropicProvider(modelConfig.model);
      break;
    case "gemini":
      provider = new GeminiProvider(modelConfig.model);
      break;
    case "openrouter":
      provider = new OpenRouterProvider(modelConfig.model);
      break;
    default:
      // Fallback
      provider = new AnthropicProvider();
  }

  try {
    return await provider.generate(systemPrompt);
  } catch (error) {
    console.error(`Error in provider ${modelConfig.provider} with model ${modelConfig.model}:`, error);
    if (modelConfig.provider !== "anthropic") {
      console.warn("Falling back to Anthropic default provider due to generation error...");
      const fallbackProvider = new AnthropicProvider();
      return await fallbackProvider.generate(systemPrompt);
    }
    throw error;
  }
}