import OpenAI from "openai";
import { IdeaProvider } from "./anthropic";

export class OpenRouterProvider implements IdeaProvider {
  name = "openrouter";
  model = "meta-llama/llama-3-70b-instruct"; // Default, customizable

  constructor(model?: string) {
    if (model) {
      this.model = model;
    }
  }

  async generate(prompt: string): Promise<string> {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error("Missing OPENROUTER_API_KEY environment variable.");
    }

    const openai = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: apiKey,
      defaultHeaders: {
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "https://spark.srivedanthtek.com",
        "X-Title": "Spark Daily Idea Journal",
      },
    });

    const completion = await openai.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: "system",
          content: prompt,
        },
        {
          role: "user",
          content: "Generate a brilliant business idea using today's actual date.",
        },
      ],
      max_tokens: 4000,
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("OpenRouter response did not contain content.");
    }
    return content;
  }
}