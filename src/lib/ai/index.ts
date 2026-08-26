import { getEnv } from "@/lib/env";
import { MockAIProvider } from "@/lib/ai/mock";
import { OpenAIProvider } from "@/lib/ai/openai";
import type { AIProvider } from "@/lib/ai/types";

export function getAIProvider(): AIProvider {
  const env = getEnv();
  if (env.demoMode || !env.openaiEnabled) {
    return new MockAIProvider();
  }
  return new OpenAIProvider();
}

export { MockAIProvider, OpenAIProvider };
