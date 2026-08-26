import { describe, expect, it } from "vitest";
import {
  fingerprintFromSpec,
  similarityScore,
} from "@/lib/site-spec/fingerprint";
import { buildMockSiteSpec } from "@/lib/ai/mock-spec";
import { MockAIProvider } from "@/lib/ai/mock";
import { emptyBusinessFacts } from "@/lib/facts/schema";

describe("design fingerprint similarity", () => {
  it("scores identical fingerprints highly", async () => {
    const ai = new MockAIProvider();
    const facts = emptyBusinessFacts();
    facts.businessName = "Test";
    facts.shortName = "Test";
    facts.description = "Opis";
    facts.brandStory = "Priča";
    facts.provenance = [{ sourceUrl: "https://example.com", excerpt: "x" }];
    const brand = await ai.analyzeBrand({
      facts,
      dominantColors: [],
      recentFingerprints: [],
    });
    const spec = buildMockSiteSpec({
      facts,
      profile: brand.data,
      locale: "sr-Latn",
      assetIds: [],
      recentFingerprints: [],
    });
    const fingerprint = fingerprintFromSpec(spec);
    expect(similarityScore(fingerprint, fingerprint)).toBeGreaterThan(0.8);
  });
});
