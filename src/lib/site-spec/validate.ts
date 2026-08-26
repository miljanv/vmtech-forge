import { AppError } from "@/lib/errors";
import { hasUsefulContrast } from "@/lib/site-spec/contrast";
import type { SiteSpec } from "@/lib/site-spec/schema";
import { siteSpecSchema } from "@/lib/site-spec/schema";
import { getFontPairing } from "@/lib/site-spec/variants";
import { collectSiteSpecIssues, repairSiteSpec } from "@/lib/site-spec/repair";
import { polishSiteNavigation } from "@/lib/site-spec/navigation";

export function validateSiteSpec(
  input: unknown,
  options?: { allowedAssetIds?: Set<string>; repair?: boolean },
): SiteSpec {
  const spec = options?.repair === false
    ? siteSpecSchema.parse(input)
    : polishSiteNavigation(
        repairSiteSpec(input, options),
        options?.allowedAssetIds ? [...options.allowedAssetIds] : undefined,
      );
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

  errors.push(...collectSiteSpecIssues(spec, options));

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
