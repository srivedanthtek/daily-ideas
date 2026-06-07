import Anthropic from "@anthropic-ai/sdk";

export interface GenerationResult {
  text: string;
  tokenUsage: { input: number; output: number } | null;
}

export interface IdeaProvider {
  name: string;
  model: string;
  generate(prompt: string): Promise<GenerationResult>;
}

export class AnthropicProvider implements IdeaProvider {
  name = "anthropic";
  model = "claude-3-5-sonnet-20241022"; // We'll map 'claude-sonnet-4-20250514' or use latest sonnet fallback

  constructor(model?: string) {
    if (model) {
      this.model = model;
    }
  }

  async generate(prompt: string): Promise<GenerationResult> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("Missing ANTHROPIC_API_KEY environment variable.");
    }

    const anthropic = new Anthropic({ apiKey });

    const message = await anthropic.messages.create({
      model: this.model,
      max_tokens: 4000,
      temperature: 0.7,
      system: prompt,
      messages: [
        {
          role: "user",
          content: "Generate a brilliant business idea using today's actual date.",
        },
      ],
    });

    const contentBlock = message.content[0];
    if (contentBlock && contentBlock.type === "text") {
      return {
        text: contentBlock.text,
        tokenUsage: message.usage
          ? { input: message.usage.input_tokens, output: message.usage.output_tokens }
          : null,
      };
    }
    throw new Error("Anthropic response did not contain text.");
  }
}