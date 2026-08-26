import { z } from "zod";
import { assertPublicHttpUrl } from "@/lib/security/url-guards";
import { validateSlug } from "@/lib/validation/slug";

export const sourceTypeSchema = z.enum([
  "WEBSITE",
  "INSTAGRAM",
  "FACEBOOK",
  "GOOGLE_MAPS",
  "MARKETPLACE",
  "OTHER",
]);

export const companyWizardSchema = z
  .object({
    name: z.string().trim().max(160).optional().or(z.literal("")),
    slug: z.string().trim().min(2).max(80),
    contactName: z.string().trim().max(120).optional().or(z.literal("")),
    contactEmail: z
      .string()
      .trim()
      .email("Unesite ispravan email.")
      .optional()
      .or(z.literal("")),
    contactPhone: z.string().trim().max(40).optional().or(z.literal("")),
    notes: z.string().trim().max(4000).optional().or(z.literal("")),
    dealValueMinor: z.number().int().min(0).max(10_000_000).default(12000),
    preferredLanguage: z.string().default("sr-Latn"),
    sourceUrls: z.array(z.string().trim()).min(1).max(5),
    instagramUrl: z.string().trim().optional().or(z.literal("")),
    facebookUrl: z.string().trim().optional().or(z.literal("")),
    googleMapsUrl: z.string().trim().optional().or(z.literal("")),
    marketplaceUrl: z.string().trim().optional().or(z.literal("")),
    generateImmediately: z.boolean().default(true),
    preferredCta: z.string().trim().max(80).optional().or(z.literal("")),
    designNotes: z.string().trim().max(2000).optional().or(z.literal("")),
    contentNotes: z.string().trim().max(2000).optional().or(z.literal("")),
    permissionConfirmed: z.boolean(),
  })
  .superRefine((value, ctx) => {
    const slug = validateSlug(value.slug);
    if (!slug.ok) {
      ctx.addIssue({
        code: "custom",
        path: ["slug"],
        message: slug.error,
      });
    }

    if (!value.permissionConfirmed) {
      ctx.addIssue({
        code: "custom",
        path: ["permissionConfirmed"],
        message: "Potvrdite da imate pravo da koristite javni sadržaj i slike.",
      });
    }

    const urls = [
      ...value.sourceUrls,
      value.instagramUrl,
      value.facebookUrl,
      value.googleMapsUrl,
      value.marketplaceUrl,
    ].filter((url): url is string => Boolean(url && url.length > 0));

    const unique = new Set<string>();
    for (const url of urls) {
      try {
        const parsed = assertPublicHttpUrl(url);
        if (unique.has(parsed.href)) {
          ctx.addIssue({
            code: "custom",
            path: ["sourceUrls"],
            message: "Isti URL je unet više puta.",
          });
        }
        unique.add(parsed.href);
      } catch {
        ctx.addIssue({
          code: "custom",
          path: ["sourceUrls"],
          message: `URL nije bezbedan ili validan: ${url}`,
        });
      }
    }

    if (unique.size > 5) {
      ctx.addIssue({
        code: "custom",
        path: ["sourceUrls"],
        message: "Maksimalno pet početnih URL-ova je dozvoljeno.",
      });
    }
  });

export type CompanyWizardInput = z.infer<typeof companyWizardSchema>;

export function parseUrlList(raw: string): string[] {
  return raw
    .split(/[\s,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function detectSourceType(url: string): z.infer<typeof sourceTypeSchema> {
  const host = new URL(url).hostname.toLowerCase();
  if (host.includes("instagram.com")) return "INSTAGRAM";
  if (host.includes("facebook.com") || host.includes("fb.com")) return "FACEBOOK";
  if (host.includes("google.") && url.includes("/maps")) return "GOOGLE_MAPS";
  if (
    host.includes("kupujemprodajem") ||
    host.includes("limundo") ||
    host.includes("etsy.com")
  ) {
    return "MARKETPLACE";
  }
  return "WEBSITE";
}
