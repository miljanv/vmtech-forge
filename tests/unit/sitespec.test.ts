import { describe, expect, it } from "vitest";
import { validateSiteSpec } from "@/lib/site-spec/validate";
import { buildMockSiteSpec } from "@/lib/ai/mock-spec";
import { MockAIProvider } from "@/lib/ai/mock";
import { emptyBusinessFacts } from "@/lib/facts/schema";

describe("SiteSpec validation", () => {
  it("accepts a mock generated spec", async () => {
    const ai = new MockAIProvider();
    const facts = emptyBusinessFacts();
    facts.businessName = "Mlekara Jović";
    facts.shortName = "Jović";
    facts.description = "Porodična mlekara";
    facts.brandStory = "Porodična priča";
    facts.products = [
      {
        name: "Kajmak",
        description: "Domaći kajmak",
        category: "Mleko",
        price: 750,
        currency: "RSD",
        unit: "500g",
        sourceUrl: "https://example.com",
      },
    ];
    facts.provenance = [{ sourceUrl: "https://example.com", excerpt: "Kajmak" }];
    const brand = await ai.analyzeBrand({
      facts,
      dominantColors: ["#3F2A1D"],
      recentFingerprints: [],
    });
    const spec = buildMockSiteSpec({
      facts,
      profile: brand.data,
      locale: "sr-Latn",
      assetIds: ["asset-1"],
      recentFingerprints: [],
    });
    expect(() =>
      validateSiteSpec(spec, { allowedAssetIds: new Set(["asset-1"]) }),
    ).not.toThrow();
  });
});
