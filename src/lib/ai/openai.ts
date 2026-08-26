import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { getEnv } from "@/lib/env";
import { redactSecrets } from "@/lib/errors";
import { wrapUntrustedSource } from "@/lib/security/sanitize";
import { businessFactsSchema, type BusinessFacts } from "@/lib/facts/schema";
import { normalizeFacts } from "@/lib/facts/normalize";
import { factsFromSources, MockAIProvider } from "@/lib/ai/mock";
import {
  DESIGN_SYSTEM_PROMPT,
  EXTRACTION_SYSTEM_PROMPT,
  SITE_SYSTEM_PROMPT,
} from "@/lib/ai/prompts";
import type {
  AIProvider,
  DesignInput,
  ExtractionInput,
  SitePlanInput,
  StructuredResult,
} from "@/lib/ai/types";
import {
  designProfileSchema,
  siteSpecSchema,
  type DesignProfile,
  type SiteSpec,
} from "@/lib/site-spec/schema";

function client(): OpenAI {
  const env = getEnv();
  if (!env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }
  return new OpenAI({ apiKey: env.OPENAI_API_KEY });
}

function usageFrom(response: {
  usage?: { input_tokens?: number; output_tokens?: number } | null;
  id?: string;
}) {
  return {
    inputTokens: response.usage?.input_tokens ?? 0,
    outputTokens: response.usage?.output_tokens ?? 0,
    requestId: response.id,
  };
}

function describeAiError(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return redactSecrets(error.message).slice(0, 240);
  }
  return "nepoznata greška";
}

export class OpenAIProvider implements AIProvider {
  readonly name = "openai" as const;
  private readonly fallback = new MockAIProvider();

  async extractFacts(
    input: ExtractionInput,
  ): Promise<StructuredResult<BusinessFacts>> {
    const heuristic = factsFromSources(input);
    try {
      const env = getEnv();
      const sources = input.sources
        .map((source) => wrapUntrustedSource(source.content, source.url))
        .join("\n\n");
      const response = await client().responses.parse({
        model: env.OPENAI_MODEL_EXTRACTOR,
        store: Boolean(env.OPENAI_STORE_RESPONSES),
        reasoning: { effort: "low" },
        input: [
          { role: "system", content: EXTRACTION_SYSTEM_PROMPT },
          {
            role: "user",
            content: `Company hint: ${input.companyName ?? "unknown"}\nLocale: ${input.locale}\n\n${sources}`,
          },
        ],
        text: { format: zodTextFormat(businessFactsSchema, "business_facts") },
      });
      const usage = usageFrom(response);
      if (!response.output_parsed) {
        return {
          data: {
            ...heuristic,
            warnings: [
              ...heuristic.warnings,
              "OpenAI nije vratio strukturirane činjenice; korišćen je sadržaj sa sajta.",
            ],
          },
          usage,
        };
      }
      return {
        data: normalizeFacts(response.output_parsed),
        usage,
      };
    } catch (error) {
      console.error("[ai.extractFacts]", error);
      return {
        data: {
          ...heuristic,
          warnings: [
            ...heuristic.warnings,
            `OpenAI extract nije uspeo (${describeAiError(error)}); korišćen je sadržaj sa sajta.`,
          ],
        },
        usage: { inputTokens: 0, outputTokens: 0, requestId: "openai-fallback" },
      };
    }
  }

  async analyzeBrand(
    input: DesignInput,
  ): Promise<StructuredResult<DesignProfile>> {
    try {
      const env = getEnv();
      const response = await client().responses.parse({
        model: env.OPENAI_MODEL_DESIGNER,
        store: Boolean(env.OPENAI_STORE_RESPONSES),
        reasoning: { effort: "low" },
        input: [
          { role: "system", content: DESIGN_SYSTEM_PROMPT },
          {
            role: "user",
            content: JSON.stringify({
              facts: input.facts,
              dominantColors: input.dominantColors,
              recentFingerprints: input.recentFingerprints,
            }),
          },
        ],
        text: { format: zodTextFormat(designProfileSchema, "design_profile") },
      });
      if (!response.output_parsed) {
        throw new Error("Designer returned no structured output.");
      }
      return { data: response.output_parsed, usage: usageFrom(response) };
    } catch (error) {
      console.error("[ai.analyzeBrand]", error);
      return this.fallback.analyzeBrand(input);
    }
  }

  async planSite(input: SitePlanInput): Promise<StructuredResult<SiteSpec>> {
    try {
      const env = getEnv();
      const response = await client().responses.parse({
        model: env.OPENAI_MODEL_DESIGNER,
        store: Boolean(env.OPENAI_STORE_RESPONSES),
        reasoning: { effort: "low" },
        input: [
          { role: "system", content: SITE_SYSTEM_PROMPT },
          {
            role: "user",
            content: JSON.stringify({
              facts: input.facts,
              profile: input.profile,
              locale: input.locale,
              preferredCta: input.preferredCta,
              designNotes: input.designNotes,
              contentNotes: input.contentNotes,
              assetIds: input.assetIds,
              recentFingerprints: input.recentFingerprints,
            }),
          },
        ],
        text: { format: zodTextFormat(siteSpecSchema, "site_spec") },
      });
      if (!response.output_parsed) {
        throw new Error("Site planner returned no structured output.");
      }
      return { data: siteSpecSchema.parse(response.output_parsed), usage: usageFrom(response) };
    } catch (error) {
      console.error("[ai.planSite]", error);
      return this.fallback.planSite(input);
    }
  }

  async regenerateSection(input: {
    spec: SiteSpec;
    sectionId: string;
    facts: BusinessFacts;
    mode: "section" | "copy" | "design";
  }): Promise<StructuredResult<SiteSpec>> {
    try {
      const env = getEnv();
      const response = await client().responses.parse({
        model: env.OPENAI_MODEL_DESIGNER,
        store: Boolean(env.OPENAI_STORE_RESPONSES),
        reasoning: { effort: "low" },
        input: [
          { role: "system", content: SITE_SYSTEM_PROMPT },
          {
            role: "user",
            content: JSON.stringify({
              instruction: `Regenerate ${input.mode} for section ${input.sectionId}. Keep other sections. Do not invent facts.`,
              spec: input.spec,
              facts: input.facts,
            }),
          },
        ],
        text: { format: zodTextFormat(siteSpecSchema, "site_spec") },
      });
      if (!response.output_parsed) {
        throw new Error("Section regeneration returned no structured output.");
      }
      return { data: siteSpecSchema.parse(response.output_parsed), usage: usageFrom(response) };
    } catch (error) {
      console.error("[ai.regenerateSection]", error);
      return this.fallback.regenerateSection(input);
    }
  }
}
