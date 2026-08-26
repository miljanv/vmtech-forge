import { describe, expect, it } from "vitest";
import {
  inferPrimaryImageHosts,
  rankImageCandidates,
  scoreImageCandidate,
  type ImageCandidate,
} from "@/lib/assets/candidates";
import { polishSiteNavigation } from "@/lib/site-spec/navigation";
import { buildMockSiteSpec } from "@/lib/ai/mock-spec";
import { MockAIProvider } from "@/lib/ai/mock";
import { emptyBusinessFacts } from "@/lib/facts/schema";

function candidate(overrides: Partial<ImageCandidate> & Pick<ImageCandidate, "url" | "pageUrl">): ImageCandidate {
  return {
    alt: "",
    width: 1200,
    height: 800,
    role: "content",
    context: "",
    ...overrides,
  };
}

describe("image candidate scoring", () => {
  it("keeps product photos from the business site and drops directory/map chrome", () => {
    const primary = inferPrimaryImageHosts(
      [
        { url: "https://sinkina-teglica.rs", sourceType: "WEBSITE" },
        { url: "https://maps.google.com/?q=sinkina", sourceType: "GOOGLE_MAPS" },
      ],
      { slug: "sinkina-teglica", companyName: "Šinkina teglica" },
    );
    expect(primary).toEqual(["sinkina-teglica.rs"]);

    const ranked = rankImageCandidates(
      [
        candidate({
          url: "https://cdn.shopify.com/jam.webp",
          pageUrl: "https://sinkina-teglica.rs/proizvodi",
          alt: "Šljiva pekmez",
        }),
        candidate({
          url: "https://maps.gstatic.com/pin.png",
          pageUrl: "https://maps.google.com/?q=sinkina",
          alt: "Map pin",
          width: 64,
          height: 64,
        }),
        candidate({
          url: "https://infobel.com/logo.png",
          pageUrl: "https://infobel.com/company/sinkina",
          alt: "directory logo",
          role: "logo",
        }),
      ],
      primary,
    );

    expect(ranked.map((item) => item.url)).toEqual(["https://cdn.shopify.com/jam.webp"]);
  });

  it("rejects tiny icons even on the business host", () => {
    const score = scoreImageCandidate(
      candidate({
        url: "https://sinkina-teglica.rs/wp-includes/icon.png",
        pageUrl: "https://sinkina-teglica.rs",
        width: 32,
        height: 32,
      }),
      ["sinkina-teglica.rs"],
    );
    expect(score).toBeLessThanOrEqual(0);
  });
});

describe("site navigation polish", () => {
  it("rebuilds empty nav from homepage sections", async () => {
    const ai = new MockAIProvider();
    const facts = emptyBusinessFacts();
    facts.businessName = "Šinkina teglica";
    facts.products = [
      {
        name: "Pekmez",
        description: "Od šljive",
        category: "Džem",
        price: null,
        currency: null,
        unit: null,
        sourceUrl: "https://sinkina-teglica.rs",
      },
    ];
    const brand = await ai.analyzeBrand({
      facts,
      dominantColors: ["#3F2A1D"],
      recentFingerprints: [],
    });
    const spec = buildMockSiteSpec({
      facts,
      profile: brand.data,
      locale: "sr-Latn",
      assetIds: ["a1", "a2", "a3"],
      recentFingerprints: [],
    });
    spec.pages = spec.pages.filter((page) => page.path === "/");
    spec.navigation.items = [];

    const polished = polishSiteNavigation(spec, ["a1", "a2", "a3"]);
    expect(polished.navigation.items.length).toBeGreaterThan(2);
    expect(polished.navigation.items.some((item) => item.href.startsWith("#"))).toBe(true);
    expect(polished.pages[0]?.sections.find((section) => section.type === "hero")?.assetIds.length).toBeGreaterThan(1);
  });
});
