import { emptyBusinessFacts, type BusinessFacts } from "@/lib/facts/schema";
import { normalizeFacts } from "@/lib/facts/normalize";
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
    const blob = input.sources.map((source) => source.content).join("\n");
    const facts = normalizeFacts({
      ...emptyBusinessFacts(),
      businessName: input.companyName || extractField(blob, /Mlekara [A-Za-zčćžšđČĆŽŠĐ]+/) || "Mlekara Jović",
      shortName: "Jović",
      description:
        "Porodična mlekara koja proizvodi kajmak, sir i jogurt od mleka sa okolnih pašnjaka.",
      brandStory:
        "Mlekara Jović radi kao porodična radionica. Recepti se prenose kroz generacije, a mleko stiže od lokalnih gazdinstava.",
      productCategories: ["Mlečni proizvodi"],
      products: [
        {
          name: "Kajmak",
          description: "Domaći kajmak od punomasnog mleka.",
          category: "Mlečni proizvodi",
          price: 750,
          currency: "RSD",
          unit: "500g",
          sourceUrl: input.sources[0]?.url ?? "https://example.com",
        },
        {
          name: "Beli sir",
          description: "Tradicionalni beli sir.",
          category: "Mlečni proizvodi",
          price: 890,
          currency: "RSD",
          unit: "kg",
          sourceUrl: input.sources[0]?.url ?? "https://example.com",
        },
        {
          name: "Jogurt 2.8%",
          description: "Sveži jogurt od punomasnog mleka.",
          category: "Mlečni proizvodi",
          price: 180,
          currency: "RSD",
          unit: "l",
          sourceUrl: input.sources[0]?.url ?? "https://example.com",
        },
      ],
      address: "Vojvode Mišića 12",
      city: "Ljubovija",
      region: "Mačva",
      phone: "+381 64 123 4567",
      email: "kontakt@mlekara-jovic.example",
      workingHours: "Ponedeljak–subota 07:00–18:00",
      socialProfiles: [],
      orderingMethods: ["Lično preuzimanje", "Porudžbina telefonom"],
      deliveryInformation: "Dostava u okolini Loznice i Ljubovije.",
      provenance: input.sources.map((source) => ({
        sourceUrl: source.url,
        excerpt: source.content.slice(0, 180),
      })),
      confidence: 0.82,
      missingInformation: ["Zvanične nagrade nisu navedene na izvorima."],
      warnings: [],
    });
    return { data: facts, usage: noUsage };
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
    const heroes = [
      "cinematic",
      "editorial-split",
      "story-first",
      "asymmetric-product",
    ] as const;
    const profile: DesignProfile = {
      brandPersonality: "Topla, zemljana, zanatska i pouzdana.",
      industry: "Prehrambena proizvodnja",
      targetCustomer: "Porodice i restorani koji traže lokalne mlečne proizvode.",
      visualArchetype: "Craft pastoral",
      primaryColor: ["#3F2A1D", "#1F3A34", "#4A2C5A", "#2C3E50"][hash % 4] ?? "#3F2A1D",
      secondaryColor: "#C4A574",
      foregroundColor: "#1A1612",
      backgroundColor: "#F6F1E8",
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
        "delivery",
        "contact",
      ],
      clichesToAvoid: [
        "Generic three-card grid",
        "Gradient hero text",
        "Stock handshake photos",
      ],
      navigationStyle: "solid-editorial",
      buttonStyle: "soft-rounded",
      heroVariant: heroes[hash % heroes.length] ?? "editorial-split",
      productVariant: "editorial-grid",
      storyVariant: "magazine",
      galleryVariant: "offset-editorial",
      processVariant: "horizontal-steps",
      contactVariant: "split-location",
    };
    return { data: profile, usage: noUsage };
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
          section.content.heading = `${section.content.heading ?? "Sekcija"} — nova verzija`;
          section.content.body = `${section.content.body ?? ""} Ažurirano na osnovu proverenih činjenica.`.trim();
        }
        if (input.mode === "design" || input.mode === "section") {
          section.variant = rotateVariant(section.type, section.variant);
        }
      }
    }
    return { data: spec, usage: noUsage };
  }
}

function extractField(blob: string, pattern: RegExp): string | null {
  return blob.match(pattern)?.[0] ?? null;
}

function hashCode(value: string): number {
  return Math.abs(
    [...value].reduce((acc, char) => acc + char.charCodeAt(0), 0),
  );
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
