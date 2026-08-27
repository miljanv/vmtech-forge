import { emptyBusinessFacts, type BusinessFacts } from "@/lib/facts/schema";
import { normalizeFacts } from "@/lib/facts/normalize";
import type { ImageReview, ImageReviewInput } from "@/lib/assets/review-schema";
import type {
  AIProvider,
  DesignInput,
  ExtractionInput,
  SitePlanInput,
  StructuredResult,
} from "@/lib/ai/types";
import type { DesignProfile, SiteSpec } from "@/lib/site-spec/schema";
import { buildMockSiteSpec } from "@/lib/ai/mock-spec";

const noUsage = { inputTokens: 0, outputTokens: 0, requestId: "mock" };

export class MockAIProvider implements AIProvider {
  readonly name = "mock" as const;

  async extractFacts(
    input: ExtractionInput,
  ): Promise<StructuredResult<BusinessFacts>> {
    return { data: factsFromSources(input), usage: noUsage };
  }

  async analyzeBrand(input: DesignInput): Promise<StructuredResult<DesignProfile>> {
    const hash = hashCode(input.facts.businessName ?? "studio");
    const pairings = [
      "instrument",
      "fraunces-figtree",
      "newsreader-source",
      "cormorant-karla",
      "dm",
    ] as const;
    const name = input.facts.businessName ?? "studio";
    const profile: DesignProfile = {
      brandPersonality: `Samouveren, taktilan i lokalni glas za ${name}.`,
      industry: input.facts.productCategories[0] ?? "Zanatska proizvodnja",
      targetCustomer: "Kupci koji traže autentičan, lokalni rad umesto masovne ponude.",
      visualArchetype: "Editorial craft",
      primaryColor: ["#1F1A16", "#16332E", "#3B1D2A", "#1C2C4A"][hash % 4] ?? "#1F1A16",
      secondaryColor: ["#C9A36A", "#D7C4A3", "#E2B4A0", "#8EB5C0"][hash % 4] ?? "#C9A36A",
      foregroundColor: "#14110F",
      backgroundColor: "#F4EFE6",
      fontPairingId: pairings[hash % pairings.length] ?? "instrument",
      spacingCharacter: "airy",
      radiusStyle: "soft",
      shadowStyle: "soft",
      surfaceStyle: "linen",
      imageTreatment: "warm-grade",
      patternDirection: "Fine grain over warm paper.",
      motionProfile: "subtle",
      contentDensity: "balanced",
      recommendedSectionOrder: [
        "hero",
        "trust",
        "products",
        "story",
        "process",
        "gallery",
        "contact",
      ],
      clichesToAvoid: [
        "Generic three-card grid as the whole identity",
        "Gradient hero text",
        "Stock handshake photos",
        "Welcome to our website",
      ],
      navigationStyle: "transparent-overlay",
      buttonStyle: "solid-pill",
      heroVariant: "editorial-split",
      productVariant: "editorial-grid",
      storyVariant: "magazine",
      galleryVariant: "full-carousel",
      processVariant: "horizontal-steps",
      contactVariant: "split-location",
    };
    return { data: profile, usage: noUsage };
  }

  async reviewImages(input: ImageReviewInput): Promise<StructuredResult<ImageReview>> {
    return {
      data: {
        decisions: input.images.map((image, index) => ({
          index: image.index,
          keep: true,
          kind: index === 0 ? "hero" : "product",
          reason: "mock",
        })),
      },
      usage: noUsage,
    };
  }

  async planSite(input: SitePlanInput): Promise<StructuredResult<SiteSpec>> {
    return {
      data: buildMockSiteSpec(input),
      usage: noUsage,
    };
  }

  async regenerateSection(input: {
    spec: SiteSpec;
    sectionId: string;
    facts: BusinessFacts;
    mode: "section" | "copy" | "design";
  }): Promise<StructuredResult<SiteSpec>> {
    const spec: SiteSpec = structuredClone(input.spec);
    for (const page of spec.pages) {
      for (const section of page.sections) {
        if (section.id !== input.sectionId) continue;
        if (input.mode === "copy" || input.mode === "section") {
          section.content.heading = section.content.heading;
          section.content.body = section.content.body;
        }
        if (input.mode === "design" || input.mode === "section") {
          section.variant = rotateVariant(section.type, section.variant);
        }
      }
    }
    return { data: spec, usage: noUsage };
  }
}

export function factsFromSources(input: ExtractionInput): BusinessFacts {
  const blob = input.sources.map((source) => source.content).join("\n");
  const sourceUrl = input.sources[0]?.url ?? "https://example.com";
  const hostName = hostToName(sourceUrl);
  const name = input.companyName?.trim() || firstMeaningfulLine(blob) || hostName;
  const email = blob.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ?? null;
  const phone = blob.match(/\+?\d[\d\s/().-]{7,}\d/)?.[0]?.trim() ?? null;
  const city = matchAfter(blob, /(?:grad|mesto|sedište)[:\s]+([A-ZČĆŽŠĐ][\wčćžšđČĆŽŠĐ-]+)/i);
  const products = extractProducts(blob, sourceUrl);
  const description =
    firstParagraph(blob) ||
    `${name} je lokalna radionica. Sadržaj sajta je složen samo iz javnih izvora.`;

  return normalizeFacts({
    ...emptyBusinessFacts(),
    businessName: name,
    shortName: name.split(/\s+/)[0] ?? name,
    description,
    brandStory: firstParagraph(blob) || description,
    productCategories: products[0]?.category ? [products[0].category] : [],
    products,
    city,
    phone,
    email,
    workingHours: matchLine(blob, /radno vreme|ponedeljak|subota|nedelja/i),
    orderingMethods: ["Lično preuzimanje", "Porudžbina telefonom"].filter(Boolean),
    deliveryInformation: matchLine(blob, /dostav/i),
    provenance: input.sources.map((source) => ({
      sourceUrl: source.url,
      excerpt: source.content.slice(0, 180),
    })),
    confidence: blob.length > 200 ? 0.7 : 0.4,
    missingInformation: [
      products.length === 0 ? "Proizvodi nisu jasno navedeni na izvorima." : "",
    ].filter(Boolean),
    warnings: [],
  });
}

function hostToName(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "").split(".")[0] ?? "Studio";
  } catch {
    return "Studio";
  }
}

function firstMeaningfulLine(blob: string) {
  return (
    blob
      .split("\n")
      .map((line) => line.replace(/^#+\s*/, "").trim())
      .find((line) => line.length > 3 && line.length < 80) ?? null
  );
}

function firstParagraph(blob: string) {
  const text = blob.replace(/\s+/g, " ").trim();
  if (text.length < 40) return null;
  return text.slice(0, 280).replace(/\s+\S*$/, "");
}

function matchAfter(blob: string, pattern: RegExp) {
  return blob.match(pattern)?.[1]?.trim() ?? null;
}

function matchLine(blob: string, pattern: RegExp) {
  return blob.split("\n").find((line) => pattern.test(line))?.trim() ?? null;
}

function extractProducts(blob: string, sourceUrl: string) {
  const lines = blob.split("\n").map((line) => line.trim()).filter(Boolean);
  const products = [];
  for (const line of lines) {
    const price = line.match(/(\d+[.,]?\d*)\s*(RSD|EUR|€)/i);
    if (!price) continue;
    const name = line.replace(price[0], "").replace(/[-–—:|]/g, " ").trim();
    if (name.length < 2 || name.length > 80) continue;
    products.push({
      name,
      description: null,
      category: null,
      price: Number(price[1].replace(",", ".")),
      currency: price[2].toUpperCase() === "€" ? "EUR" : price[2].toUpperCase(),
      unit: null,
      sourceUrl,
    });
    if (products.length >= 6) break;
  }
  return products;
}

function hashCode(value: string): number {
  return Math.abs([...value].reduce((acc, char) => acc + char.charCodeAt(0), 0));
}

function rotateVariant(type: string, current: string): string {
  const map: Record<string, string[]> = {
    hero: [
      "cinematic",
      "editorial-split",
      "asymmetric-product",
      "layered-collage",
      "minimal-centered",
      "bold-typographic",
      "story-first",
    ],
    products: [
      "editorial-grid",
      "masonry-catalog",
      "horizontal-rail",
      "category-led",
      "featured-split",
      "compact-catalog",
    ],
  };
  const options = map[type] ?? [current];
  const index = options.indexOf(current);
  return options[(index + 1) % options.length] ?? current;
}
