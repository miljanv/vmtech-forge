import type { BusinessFacts } from "@/lib/facts/schema";
import { businessFactsSchema } from "@/lib/facts/schema";

const INVENTED_PATTERNS = [
  /lorem ipsum/i,
  /nagrade? koje nisu/i,
  /\b100%\s*(organsko|prirodno)\b/i,
];

export function normalizeFacts(input: unknown): BusinessFacts {
  const parsed = businessFactsSchema.parse(input);
  return {
    ...parsed,
    businessName: parsed.businessName?.trim() || null,
    shortName: parsed.shortName?.trim() || null,
    description: parsed.description?.trim() || null,
    brandStory: parsed.brandStory?.trim() || null,
    productCategories: uniqueStrings(parsed.productCategories),
    products: parsed.products.filter((product) => product.name.trim().length > 0),
    awards: uniqueStrings(parsed.awards),
    certifications: uniqueStrings(parsed.certifications),
    missingInformation: uniqueStrings(parsed.missingInformation),
    warnings: uniqueStrings([
      ...parsed.warnings,
      ...detectInventedLanguage(parsed),
    ]),
  };
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function detectInventedLanguage(facts: BusinessFacts): string[] {
  const blob = JSON.stringify(facts);
  return INVENTED_PATTERNS.filter((pattern) => pattern.test(blob)).map(
    () => "Detektovan je jezik koji liči na izmišljen ili generički sadržaj.",
  );
}
