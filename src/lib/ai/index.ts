import { getEnv } from "@/lib/env";
import { MockAIProvider } from "@/lib/ai/mock";
import { OpenAIProvider } from "@/lib/ai/openai";
import type { AIProvider } from "@/lib/ai/types";

export function getAIProvider(): AIProvider {
  if (getEnv().openaiEnabled) {
    return new OpenAIProvider();
  }
  return new MockAIProvider();
}

export { MockAIProvider, OpenAIProvider };
