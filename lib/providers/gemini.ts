import { GoogleGenerativeAI } from "@google/generative-ai";
import { IdeaProvider, GenerationResult } from "./anthropic";

export class GeminiProvider implements IdeaProvider {
  name = "gemini";
  model = "gemini-2.0-flash";

  constructor(model?: string) {
    if (model) {
      this.model = model;
    }
  }

  async generate(prompt: string): Promise<GenerationResult> {
    const apiKey = process.env.GEMENI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("Missing GEMENI_API_KEY/GEMINI_API_KEY environment variable.");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const modelInstance = genAI.getGenerativeModel({
      model: this.model,
      systemInstruction: prompt,
    });

    const result = await modelInstance.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: "Generate a brilliant business idea using today's actual date." }],
        },
      ],
      generationConfig: {
        maxOutputTokens: 4000,
        temperature: 0.7,
      },
    });

    const response = result.response;
    const text = response.text();
    if (!text) {
      throw new Error("Gemini response did not contain text.");
    }

    const usageMetadata = response.usageMetadata;
    return {
      text,
      tokenUsage: usageMetadata
        ? { input: usageMetadata.promptTokenCount, output: usageMetadata.candidatesTokenCount }
        : null,
    };
  }
}