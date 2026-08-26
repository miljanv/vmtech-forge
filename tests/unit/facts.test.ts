import { describe, expect, it } from "vitest";
import { normalizeFacts } from "@/lib/facts/normalize";
import { emptyBusinessFacts } from "@/lib/facts/schema";

describe("fact normalization", () => {
  it("trims empty names and deduplicates categories", () => {
    const facts = normalizeFacts({
      ...emptyBusinessFacts(),
      businessName: "  Mlekara Jović  ",
      productCategories: ["Sir", "Sir", " Kajmak "],
      products: [
        {
          name: "Kajmak",
          description: null,
          category: null,
          price: 750,
          currency: "RSD",
          unit: "500g",
          sourceUrl: "https://example.com",
        },
        {
          name: "   ",
          description: null,
          category: null,
          price: null,
          currency: null,
          unit: null,
          sourceUrl: null,
        },
      ],
    });
    expect(facts.businessName).toBe("Mlekara Jović");
    expect(facts.productCategories).toEqual(["Sir", "Kajmak"]);
    expect(facts.products).toHaveLength(1);
  });

  it("drops invalid URLs instead of throwing", () => {
    const facts = normalizeFacts({
      ...emptyBusinessFacts(),
      businessName: "Šinkina teglica",
      socialProfiles: [{ network: "instagram", url: "nije-url" }],
      products: [
        {
          name: "Tegla",
          description: null,
          category: null,
          price: Number("bad"),
          currency: "RSD",
          unit: null,
          sourceUrl: "instagram.com/sinkina",
        },
      ],
      provenance: [{ sourceUrl: "not-a-url", excerpt: "x" }],
      confidence: 1.4,
    });
    expect(facts.businessName).toBe("Šinkina teglica");
    expect(facts.socialProfiles).toEqual([]);
    expect(facts.products[0]?.sourceUrl).toBeNull();
    expect(facts.products[0]?.price).toBeNull();
    expect(facts.provenance).toEqual([]);
    expect(facts.confidence).toBe(1);
  });
});

describe("OpenAI structured fact schema", () => {
  it("does not emit JSON Schema format: uri", async () => {
    const { zodTextFormat } = await import("openai/helpers/zod");
    const { businessFactsSchema } = await import("@/lib/facts/schema");
    const { stripUnsupportedJsonSchemaFormats } = await import(
      "@/lib/ai/structured-schema"
    );
    const format = zodTextFormat(businessFactsSchema, "business_facts");
    stripUnsupportedJsonSchemaFormats(format);
    expect(JSON.stringify(format)).not.toContain('"uri"');
  });
});
