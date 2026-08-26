import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { getEnv } from "@/lib/env";
import { AppError, redactSecrets } from "@/lib/errors";
import { wrapUntrustedSource } from "@/lib/security/sanitize";
import { businessFactsSchema, type BusinessFacts } from "@/lib/facts/schema";
import { normalizeFacts } from "@/lib/facts/normalize";
import {
  DESIGN_SYSTEM_PROMPT,
  EXTRACTION_SYSTEM_PROMPT,
  IMAGE_REVIEW_PROMPT,
  SITE_SYSTEM_PROMPT,
} from "@/lib/ai/prompts";
import { stripUnsupportedJsonSchemaFormats } from "@/lib/ai/structured-schema";
import type {
  AIProvider,
  DesignInput,
  ExtractionInput,
  SitePlanInput,
  StructuredResult,
} from "@/lib/ai/types";
import { imageReviewSchema, type ImageReview, type ImageReviewInput } from "@/lib/assets/review-schema";
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

function openaiFailed(error: unknown): AppError {
  return new AppError({
    code: "OPENAI_FAILED",
    status: 502,
    message: error instanceof Error ? error.message : "OpenAI failed",
    userMessage: `OpenAI poziv nije uspeo: ${describeAiError(error)}`,
  });
}

function textFormat(schema: Parameters<typeof zodTextFormat>[0], name: string) {
  const format = zodTextFormat(schema, name);
  stripUnsupportedJsonSchemaFormats(format);
  return format;
}

async function parseResponse(options: {
  model: string;
  input: Parameters<OpenAI["responses"]["parse"]>[0]["input"];
  format: ReturnType<typeof zodTextFormat>;
}) {
  const env = getEnv();
  const openai = client();
  const base = {
    model: options.model,
    store: Boolean(env.OPENAI_STORE_RESPONSES),
    input: options.input,
    text: { format: options.format },
  };
  try {
    return await openai.responses.parse({
      ...base,
      reasoning: { effort: "low" },
    });
  } catch (error) {
    console.error("[ai.parse.reasoning]", error);
    return await openai.responses.parse(base);
  }
}

export class OpenAIProvider implements AIProvider {
  readonly name = "openai" as const;

  async extractFacts(
    input: ExtractionInput,
  ): Promise<StructuredResult<BusinessFacts>> {
    const env = getEnv();
    const sources = input.sources
      .map((source) => wrapUntrustedSource(source.content, source.url))
      .join("\n\n");
    try {
      const response = await parseResponse({
        model: env.OPENAI_MODEL_EXTRACTOR,
        input: [
          { role: "system", content: EXTRACTION_SYSTEM_PROMPT },
          {
            role: "user",
            content: `Company hint: ${input.companyName ?? "unknown"}\nLocale: ${input.locale}\n\n${sources}`,
          },
        ],
        format: textFormat(businessFactsSchema, "business_facts"),
      });
      if (!response.output_parsed) {
        throw new Error("Extractor returned no structured output.");
      }
      return {
        data: normalizeFacts(response.output_parsed),
        usage: usageFrom(response),
      };
    } catch (error) {
      console.error("[ai.extractFacts]", error);
      throw openaiFailed(error);
    }
  }

  async analyzeBrand(
    input: DesignInput,
  ): Promise<StructuredResult<DesignProfile>> {
    const env = getEnv();
    try {
      const response = await parseResponse({
        model: env.OPENAI_MODEL_DESIGNER,
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
        format: textFormat(designProfileSchema, "design_profile"),
      });
      if (!response.output_parsed) {
        throw new Error("Designer returned no structured output.");
      }
      return {
        data: designProfileSchema.parse(response.output_parsed),
        usage: usageFrom(response),
      };
    } catch (error) {
      console.error("[ai.analyzeBrand]", error);
      throw openaiFailed(error);
    }
  }

  async reviewImages(input: ImageReviewInput): Promise<StructuredResult<ImageReview>> {
    if (input.images.length === 0) {
      return { data: { decisions: [] }, usage: { inputTokens: 0, outputTokens: 0 } };
    }
    const env = getEnv();
    const photos = input.images.slice(0, 8);
    try {
      const response = await parseResponse({
        model: env.OPENAI_MODEL_EXTRACTOR,
        input: [
          { role: "system", content: IMAGE_REVIEW_PROMPT },
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: JSON.stringify({
                  businessName: input.businessName,
                  description: input.description,
                  products: input.products,
                  images: photos.map(({ imageBase64: _image, ...meta }) => meta),
                }),
              },
              ...photos.map((photo) => ({
                type: "input_image" as const,
                image_url: `data:image/jpeg;base64,${photo.imageBase64}`,
                detail: "low" as const,
              })),
            ],
          },
        ],
        format: textFormat(imageReviewSchema, "image_review"),
      });
      if (!response.output_parsed) {
        throw new Error("Image reviewer returned no structured output.");
      }
      return {
        data: imageReviewSchema.parse(response.output_parsed),
        usage: usageFrom(response),
      };
    } catch (error) {
      console.error("[ai.reviewImages]", error);
      throw openaiFailed(error);
    }
  }

  async planSite(input: SitePlanInput): Promise<StructuredResult<SiteSpec>> {
    const env = getEnv();
    try {
      const response = await parseResponse({
        model: env.OPENAI_MODEL_DESIGNER,
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
              assets: input.assets,
              recentFingerprints: input.recentFingerprints,
            }),
          },
        ],
        format: textFormat(siteSpecSchema, "site_spec"),
      });
      if (!response.output_parsed) {
        throw new Error("Site planner returned no structured output.");
      }
      return { data: siteSpecSchema.parse(response.output_parsed), usage: usageFrom(response) };
    } catch (error) {
      console.error("[ai.planSite]", error);
      throw openaiFailed(error);
    }
  }

  async regenerateSection(input: {
    spec: SiteSpec;
    sectionId: string;
    facts: BusinessFacts;
    mode: "section" | "copy" | "design";
  }): Promise<StructuredResult<SiteSpec>> {
    const env = getEnv();
    try {
      const response = await parseResponse({
        model: env.OPENAI_MODEL_DESIGNER,
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
        format: textFormat(siteSpecSchema, "site_spec"),
      });
      if (!response.output_parsed) {
        throw new Error("Section regeneration returned no structured output.");
      }
      return { data: siteSpecSchema.parse(response.output_parsed), usage: usageFrom(response) };
    } catch (error) {
      console.error("[ai.regenerateSection]", error);
      throw openaiFailed(error);
    }
  }
}
