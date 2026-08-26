import { AppError } from "@/lib/errors";
import { hasUsefulContrast } from "@/lib/site-spec/contrast";
import type { SiteSpec } from "@/lib/site-spec/schema";
import { siteSpecSchema } from "@/lib/site-spec/schema";
import { getFontPairing } from "@/lib/site-spec/variants";
import { variantsForType } from "@/lib/site-spec/variants";

const INTERNAL_PATHS = new Set(["/", "/proizvodi", "/o-nama", "/kontakt"]);

export function validateSiteSpec(
  input: unknown,
  options?: { allowedAssetIds?: Set<string> },
): SiteSpec {
  const spec = siteSpecSchema.parse(input);
  const errors: string[] = [];

  if (!getFontPairing(spec.theme.fontPairingId)) {
    errors.push("Nepodržano slaganje fontova.");
  }

  const colors = spec.theme.colors;
  if (!hasUsefulContrast(colors.foreground, colors.background)) {
    errors.push("Nedovoljan kontrast između teksta i pozadine.");
  }
  if (!hasUsefulContrast(colors.primaryForeground, colors.primary)) {
    errors.push("Nedovoljan kontrast na primarnom dugmetu.");
  }

  const home = spec.pages.find((page) => page.path === "/");
  if (!home) {
    errors.push("Nedostaje početna stranica.");
  }

  const ids = new Set<string>();
  for (const page of spec.pages) {
    if (!INTERNAL_PATHS.has(page.path) && !page.path.startsWith("/")) {
      errors.push(`Neispravna internа putanja: ${page.path}`);
    }
    if (page.sections.length === 0) {
      errors.push(`Stranica ${page.path} nema sekcije.`);
    }
    for (const section of page.sections) {
      if (ids.has(section.id)) {
        errors.push(`Duplikat ID sekcije: ${section.id}`);
      }
      ids.add(section.id);
      const allowed = variantsForType(section.type);
      if (!allowed.includes(section.variant)) {
        errors.push(
          `Nepoznata varijanta ${section.variant} za sekciju ${section.type}.`,
        );
      }
      if (section.visible && !section.content.heading && section.type !== "social") {
        errors.push(`Sekcija ${section.id} nema naslov.`);
      }
      for (const assetId of section.assetIds) {
        if (options?.allowedAssetIds && !options.allowedAssetIds.has(assetId)) {
          errors.push(`Sekcija ${section.id} koristi tuđi ili nepoznat asset.`);
        }
      }
      for (const href of [section.content.ctaHref]) {
        if (href && href.startsWith("/") && !INTERNAL_PATHS.has(href)) {
          errors.push(`Neispravan interni link: ${href}`);
        }
      }
    }
  }

  if (errors.length > 0) {
    throw new AppError({
      code: "INVALID_SITE_SPEC",
      message: errors.join(" "),
      userMessage: "Generisani sajt nije prošao proveru kvaliteta.",
      details: { errors },
    });
  }

  return spec;
}
