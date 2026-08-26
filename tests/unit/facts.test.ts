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
});
