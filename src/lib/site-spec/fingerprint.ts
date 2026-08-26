import { colorDistance } from "@/lib/site-spec/contrast";
import type { DesignFingerprint, SiteSpec } from "@/lib/site-spec/schema";
import { designFingerprintSchema } from "@/lib/site-spec/schema";

export function fingerprintFromSpec(
  spec: SiteSpec,
  extras?: { archetype?: string; buttonStyle?: string },
): DesignFingerprint {
  const home = spec.pages[0];
  const sequence = home.sections.filter((section) => section.visible).map(
    (section) => `${section.type}:${section.variant}`,
  );
  const hero = home.sections.find((section) => section.type === "hero");
  const products = home.sections.find((section) => section.type === "products");

  return designFingerprintSchema.parse({
    archetype: extras?.archetype ?? spec.theme.surfaceStyle,
    heroVariant: hero?.variant ?? "unknown",
    sectionSequence: sequence,
    productVariant: products?.variant ?? "none",
    typographyPair: spec.theme.fontPairingId,
    mainPalette: [
      spec.theme.colors.background,
      spec.theme.colors.primary,
      spec.theme.colors.accent,
    ],
    radiusProfile: spec.theme.radius,
    surfaceProfile: spec.theme.surfaceStyle,
    navigationStyle: spec.navigation.style,
    buttonStyle: extras?.buttonStyle ?? spec.theme.borderStyle,
    motionProfile: spec.theme.motionIntensity,
    imageTreatment: spec.theme.imageTreatment,
  });
}

function overlap(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) {
    return 0;
  }
  const right = new Set(b);
  const hits = a.filter((item) => right.has(item)).length;
  return hits / Math.max(a.length, b.length);
}

export function similarityScore(
  current: DesignFingerprint,
  other: DesignFingerprint,
): number {
  const variantOverlap =
    (current.heroVariant === other.heroVariant ? 1 : 0) * 0.2 +
    (current.productVariant === other.productVariant ? 1 : 0) * 0.12 +
    (current.typographyPair === other.typographyPair ? 1 : 0) * 0.12 +
    (current.navigationStyle === other.navigationStyle ? 1 : 0) * 0.08 +
    (current.buttonStyle === other.buttonStyle ? 1 : 0) * 0.06 +
    (current.radiusProfile === other.radiusProfile ? 1 : 0) * 0.06 +
    (current.surfaceProfile === other.surfaceProfile ? 1 : 0) * 0.06 +
    (current.motionProfile === other.motionProfile ? 1 : 0) * 0.04 +
    (current.imageTreatment === other.imageTreatment ? 1 : 0) * 0.04;

  const sequence = overlap(current.sectionSequence, other.sectionSequence) * 0.14;
  const palette =
    averagePaletteDistance(current.mainPalette, other.mainPalette) * 0.08;

  return Number((variantOverlap + sequence + (1 - palette) * 0.08).toFixed(4));
}

function averagePaletteDistance(a: string[], b: string[]): number {
  const length = Math.min(a.length, b.length);
  if (length === 0) {
    return 1;
  }
  let total = 0;
  for (let i = 0; i < length; i += 1) {
    total += colorDistance(a[i], b[i]);
  }
  return total / length;
}

export function maxSimilarity(
  current: DesignFingerprint,
  recent: DesignFingerprint[],
): number {
  return recent.reduce(
    (highest, fingerprint) =>
      Math.max(highest, similarityScore(current, fingerprint)),
    0,
  );
}
