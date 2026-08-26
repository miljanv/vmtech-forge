import type { SiteSpec } from "@/lib/site-spec/schema";
import { siteSpecSchema } from "@/lib/site-spec/schema";
import { hasUsefulContrast } from "@/lib/site-spec/contrast";
import { FONT_PAIRINGS, variantsForType, type SectionType } from "@/lib/site-spec/variants";

const SECTION_HEADINGS: Record<SectionType, string> = {
  hero: "Dobrodošli",
  trust: "Zašto kupci biraju nas",
  products: "Proizvodi",
  story: "Naša priča",
  process: "Kako radimo",
  gallery: "Galerija",
  features: "Šta nas izdvaja",
  materials: "Materijali",
  testimonials: "Utisci",
  faq: "Česta pitanja",
  delivery: "Dostava",
  location: "Gde nas naći",
  social: "Društvene mreže",
  cta: "Sledeći korak",
  contact: "Kontakt",
};

export function isSafeInternalPath(path: string) {
  return path === "/" || /^\/[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)?$/.test(path);
}

export function repairSiteSpec(
  input: unknown,
  options?: { allowedAssetIds?: Set<string> },
): SiteSpec {
  const spec = structuredClone(siteSpecSchema.parse(input));
  if (!FONT_PAIRINGS.some((pairing) => pairing.id === spec.theme.fontPairingId)) {
    spec.theme.fontPairingId = FONT_PAIRINGS[0]?.id ?? "instrument";
  }

  const colors = spec.theme.colors;
  if (!hasUsefulContrast(colors.foreground, colors.background)) {
    colors.foreground = "#14110F";
    colors.background = "#F4EFE6";
  }
  if (!hasUsefulContrast(colors.primaryForeground, colors.primary)) {
    colors.primaryForeground = "#FAF7F2";
    colors.primary = "#1F1A16";
  }

  const seenIds = new Set<string>();
  for (const page of spec.pages) {
    if (!isSafeInternalPath(page.path)) {
      page.path = page.path.startsWith("/") ? "/" : `/${page.path.replace(/[^a-z0-9-]/gi, "").toLowerCase()}`;
      if (!isSafeInternalPath(page.path)) page.path = "/";
    }
    for (const section of page.sections) {
      section.id = uniqueSectionId(section.id, seenIds);
      const allowed = variantsForType(section.type);
      if (!allowed.includes(section.variant)) {
        section.variant = allowed[0] ?? "default";
      }
      if (section.visible && !section.content.heading?.trim() && section.type !== "social") {
        section.content.heading = SECTION_HEADINGS[section.type];
      }
      section.assetIds = section.assetIds.filter((assetId) =>
        options?.allowedAssetIds ? options.allowedAssetIds.has(assetId) : true,
      );
      for (const item of section.content.items) {
        if (item.assetId && options?.allowedAssetIds && !options.allowedAssetIds.has(item.assetId)) {
          item.assetId = null;
        }
      }
      section.content.ctaHref = repairHref(section.content.ctaHref);
    }
  }

  for (const item of spec.navigation.items) {
    item.href = repairHref(item.href) ?? "/";
  }

  if (!spec.pages.some((page) => page.path === "/")) {
    const [first] = spec.pages;
    if (first) first.path = "/";
  }

  return spec;
}

function uniqueSectionId(id: string, seen: Set<string>) {
  let next = id.trim() || "section";
  let suffix = 2;
  while (seen.has(next)) {
    next = `${id}-${suffix}`;
    suffix += 1;
  }
  seen.add(next);
  return next;
}

function repairHref(href: string | null) {
  if (!href) return href;
  if (href.startsWith("http://") || href.startsWith("https://") || href.startsWith("tel:") || href.startsWith("mailto:")) {
    return href;
  }
  if (href.startsWith("#")) return href;
  if (isSafeInternalPath(href)) return href;
  if (href.startsWith("/")) return "/kontakt";
  return href;
}

export function collectSiteSpecIssues(
  spec: SiteSpec,
  options?: { allowedAssetIds?: Set<string> },
): string[] {
  const errors: string[] = [];
  if (!spec.pages.some((page) => page.path === "/")) {
    errors.push("Nedostaje početna stranica.");
  }
  const ids = new Set<string>();
  for (const page of spec.pages) {
    if (!isSafeInternalPath(page.path)) {
      errors.push(`Neispravna interna putanja: ${page.path}`);
    }
    if (page.sections.length === 0) {
      errors.push(`Stranica ${page.path} nema sekcije.`);
    }
    for (const section of page.sections) {
      if (ids.has(section.id)) errors.push(`Duplikat ID sekcije: ${section.id}`);
      ids.add(section.id);
      if (!variantsForType(section.type).includes(section.variant)) {
        errors.push(`Nepoznata varijanta ${section.variant} za sekciju ${section.type}.`);
      }
      if (section.visible && !section.content.heading && section.type !== "social") {
        errors.push(`Sekcija ${section.id} nema naslov.`);
      }
      for (const assetId of section.assetIds) {
        if (options?.allowedAssetIds && !options.allowedAssetIds.has(assetId)) {
          errors.push(`Sekcija ${section.id} koristi tuđi ili nepoznat asset.`);
        }
      }
      const href = section.content.ctaHref;
      if (href?.startsWith("/") && !isSafeInternalPath(href)) {
        errors.push(`Neispravan interni link: ${href}`);
      }
    }
  }
  return errors;
}
