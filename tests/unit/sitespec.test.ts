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

  it("repairs common GPT mistakes instead of failing the job", async () => {
    const ai = new MockAIProvider();
    const facts = emptyBusinessFacts();
    facts.businessName = "Šinkina teglica";
    facts.description = "Zanatska radionica";
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
    const hero = spec.pages[0]?.sections[0];
    if (!hero) throw new Error("missing hero");
    hero.variant = "not-a-real-variant";
    hero.content.heading = null;
    hero.assetIds = ["stolen-asset"];
    hero.content.ctaHref = "/gde-kupiti";
    spec.theme.colors.foreground = "#EEEEEE";
    spec.theme.colors.background = "#FFFFFF";

    const repaired = validateSiteSpec(spec, { allowedAssetIds: new Set(["asset-1"]) });
    const repairedHero = repaired.pages[0]?.sections[0];
    expect(repairedHero?.variant).not.toBe("not-a-real-variant");
    expect(repairedHero?.content.heading).toBeTruthy();
    expect(repairedHero?.assetIds).not.toContain("stolen-asset");
    expect(repairedHero?.assetIds).toContain("asset-1");
    expect(repairedHero?.content.ctaHref).toBe("/gde-kupiti");
  });
});
