import type { BusinessFacts } from "@/lib/facts/schema";
import { businessFactsSchema, emptyBusinessFacts } from "@/lib/facts/schema";

const INVENTED_PATTERNS = [
  /lorem ipsum/i,
  /nagrade? koje nisu/i,
  /\b100%\s*(organsko|prirodno)\b/i,
];

export function normalizeFacts(input: unknown): BusinessFacts {
  const parsed = businessFactsSchema.safeParse(coerceFactsInput(input));
  const facts = parsed.success ? parsed.data : emptyBusinessFacts();
  return {
    ...facts,
    businessName: facts.businessName?.trim() || null,
    shortName: facts.shortName?.trim() || null,
    description: facts.description?.trim() || null,
    brandStory: facts.brandStory?.trim() || null,
    productCategories: uniqueStrings(facts.productCategories),
    products: facts.products.filter((product) => product.name.trim().length > 0),
    awards: uniqueStrings(facts.awards),
    certifications: uniqueStrings(facts.certifications),
    missingInformation: uniqueStrings(facts.missingInformation),
    warnings: uniqueStrings([
      ...facts.warnings,
      ...detectInventedLanguage(facts),
      parsed.success ? "" : "Neki izvučeni podaci nisu prošli validaciju i odbačeni su.",
    ]),
  };
}

function httpUrlOrNull(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

function coerceFactsInput(input: unknown): unknown {
  if (!input || typeof input !== "object") return input;
  const value = input as Record<string, unknown>;
  const products = Array.isArray(value.products)
    ? value.products.map((product) => {
        if (!product || typeof product !== "object") return product;
        const row = product as Record<string, unknown>;
        const price = typeof row.price === "number" && Number.isFinite(row.price) ? row.price : null;
        return { ...row, price, sourceUrl: httpUrlOrNull(row.sourceUrl) };
      })
    : [];
  const testimonials = Array.isArray(value.testimonials)
    ? value.testimonials.map((item) => {
        if (!item || typeof item !== "object") return item;
        const row = item as Record<string, unknown>;
        return { ...row, sourceUrl: httpUrlOrNull(row.sourceUrl) };
      })
    : [];
  const importantClaims = Array.isArray(value.importantClaims)
    ? value.importantClaims.map((item) => {
        if (!item || typeof item !== "object") return item;
        const row = item as Record<string, unknown>;
        return { ...row, sourceUrl: httpUrlOrNull(row.sourceUrl) };
      })
    : [];
  const socialProfiles = Array.isArray(value.socialProfiles)
    ? value.socialProfiles
        .map((item) => {
          if (!item || typeof item !== "object") return null;
          const row = item as Record<string, unknown>;
          const url = httpUrlOrNull(row.url);
          if (!url || typeof row.network !== "string") return null;
          return { network: row.network, url };
        })
        .filter(Boolean)
    : [];
  const provenance = Array.isArray(value.provenance)
    ? value.provenance
        .map((item) => {
          if (!item || typeof item !== "object") return null;
          const row = item as Record<string, unknown>;
          const sourceUrl = httpUrlOrNull(row.sourceUrl);
          if (!sourceUrl) return null;
          return {
            sourceUrl,
            excerpt: typeof row.excerpt === "string" ? row.excerpt : null,
          };
        })
        .filter(Boolean)
    : [];
  const confidence =
    typeof value.confidence === "number" && Number.isFinite(value.confidence)
      ? Math.min(1, Math.max(0, value.confidence))
      : 0;
  return {
    ...value,
    products,
    testimonials,
    importantClaims,
    socialProfiles,
    provenance,
    confidence,
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
