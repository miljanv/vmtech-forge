import { describe, expect, it } from "vitest";
import { companyWizardSchema } from "@/lib/validation/company";
import { buildSalesEmail } from "@/server/services/email";
import { GENERATION_STEPS } from "@/lib/generation/steps";
import { validateSiteSpec } from "@/lib/site-spec/validate";
import { buildMockSiteSpec } from "@/lib/ai/mock-spec";
import { MockAIProvider } from "@/lib/ai/mock";
import { emptyBusinessFacts } from "@/lib/facts/schema";
import { canTransition } from "@/lib/sales/status";

const validWizard = {
  name: "Mlekara Jović",
  slug: "mlekara-jovic",
  contactName: "Ana",
  contactEmail: "ana@example.com",
  contactPhone: "+381641234567",
  notes: "",
  dealValueMinor: 12000,
  preferredLanguage: "sr-Latn",
  sourceUrls: ["https://mlekara.example"],
  instagramUrl: "",
  facebookUrl: "",
  googleMapsUrl: "",
  marketplaceUrl: "",
  generateImmediately: true,
  preferredCta: "Poručite",
  designNotes: "",
  contentNotes: "",
  permissionConfirmed: true,
};

describe("company creation", () => {
  it("accepts a valid wizard payload", () => {
    const parsed = companyWizardSchema.parse(validWizard);
    expect(parsed.slug).toBe("mlekara-jovic");
    expect(parsed.sourceUrls).toHaveLength(1);
  });

  it("requires permission and public URLs", () => {
    expect(() =>
      companyWizardSchema.parse({ ...validWizard, permissionConfirmed: false }),
    ).toThrow();
    expect(() =>
      companyWizardSchema.parse({
        ...validWizard,
        sourceUrls: ["http://127.0.0.1/secret"],
      }),
    ).toThrow();
  });
});

describe("generation job contract", () => {
  it("defines the live progress stages", () => {
    expect(GENERATION_STEPS.map((step) => step.key)).toEqual([
      "QUEUED",
      "SOURCE_CHECK",
      "PAGE_COLLECTION",
      "FACT_EXTRACTION",
      "IMAGE_DOWNLOAD",
      "BRAND_ANALYSIS",
      "DESIGN_PLANNING",
      "CONTENT_GENERATION",
      "SITE_CREATION",
      "QUALITY_CHECK",
      "READY",
    ]);
  });
});

describe("publishing a site version", () => {
  it("validates a generated spec before publish", async () => {
    const ai = new MockAIProvider();
    const facts = emptyBusinessFacts();
    facts.businessName = "Mlekara Jović";
    facts.shortName = "Jović";
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
    const published = validateSiteSpec(spec);
    expect(published.pages[0]?.path).toBe("/");
  });
});

describe("sales status updates", () => {
  it("moves a ready company to emailed", () => {
    expect(canTransition("READY_TO_CONTACT", "EMAIL_SENT")).toBe(true);
  });
});

describe("email draft creation", () => {
  it("includes the preview URL", () => {
    const draft = buildSalesEmail({
      companyName: "Mlekara Jović",
      previewUrl: "https://my-domain.com/mlekara-jovic",
    });
    expect(draft.subject).toContain("Mlekara Jović");
    expect(draft.body).toContain("https://my-domain.com/mlekara-jovic");
    expect(draft.body).not.toContain("120");
  });
});
