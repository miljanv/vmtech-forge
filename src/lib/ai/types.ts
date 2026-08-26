import type { BusinessFacts } from "@/lib/facts/schema";
import type { DesignFingerprint, DesignProfile, SiteSpec } from "@/lib/site-spec/schema";
import type { ImageReview, ImageReviewInput } from "@/lib/assets/review-schema";

export type ExtractionInput = {
  companyName?: string | null;
  locale: string;
  sources: Array<{ url: string; content: string }>;
};

export type DesignInput = {
  facts: BusinessFacts;
  dominantColors: string[];
  recentFingerprints: DesignFingerprint[];
};

export type SitePlanInput = {
  facts: BusinessFacts;
  profile: DesignProfile;
  locale: string;
  preferredCta?: string | null;
  designNotes?: string | null;
  contentNotes?: string | null;
  assetIds: string[];
  assets?: Array<{
    id: string;
    type: string;
    kind: string;
    sourceUrl: string | null;
  }>;
  recentFingerprints: DesignFingerprint[];
};

export type AIUsage = {
  inputTokens: number;
  outputTokens: number;
  requestId?: string;
};

export type StructuredResult<T> = {
  data: T;
  usage: AIUsage;
};

export interface AIProvider {
  readonly name: "openai" | "mock";
  extractFacts(input: ExtractionInput): Promise<StructuredResult<BusinessFacts>>;
  analyzeBrand(input: DesignInput): Promise<StructuredResult<DesignProfile>>;
  reviewImages(input: ImageReviewInput): Promise<StructuredResult<ImageReview>>;
  planSite(input: SitePlanInput): Promise<StructuredResult<SiteSpec>>;
  regenerateSection(input: {
    spec: SiteSpec;
    sectionId: string;
    facts: BusinessFacts;
    mode: "section" | "copy" | "design";
  }): Promise<StructuredResult<SiteSpec>>;
}
