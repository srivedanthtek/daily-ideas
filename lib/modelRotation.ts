export interface ModelConfig {
  provider: "anthropic" | "gemini" | "openrouter";
  model: string;
  label: string;
}

export const ROTATION: ModelConfig[] = [
//   { provider: "anthropic", model: "claude-3-5-sonnet-20241022", label: "Claude Sonnet 4" }, // Using modern sonnet ref (as claude-sonnet-4-20250514 is a future preview code in prompt)
//   { provider: "gemini", model: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
    { provider: "openrouter", model: "openai/gpt-oss-120b:free", label: "GPT-OSS 120B Free" },
    { provider: "openrouter", model: "meta-llama/llama-3-70b-instruct", label: "Llama 4 Maverick" }, // Map to standard meta models or specified tags
    { provider: "openrouter", model: "deepseek/deepseek-r1", label: "DeepSeek R1" },
];