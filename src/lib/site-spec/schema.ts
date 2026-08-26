import { z } from "zod";
import {
  BUTTON_STYLES,
  CONTACT_VARIANTS,
  FONT_PAIRINGS,
  GALLERY_VARIANTS,
  HERO_VARIANTS,
  IMAGE_TREATMENTS,
  MOTION_PROFILES,
  NAVIGATION_STYLES,
  PROCESS_VARIANTS,
  PRODUCT_VARIANTS,
  RADIUS_PROFILES,
  SECTION_TYPES,
  STORY_VARIANTS,
  SURFACE_STYLES,
} from "@/lib/site-spec/variants";

export const colorTokenSchema = z.object({
  background: z.string(),
  foreground: z.string(),
  muted: z.string(),
  mutedForeground: z.string(),
  primary: z.string(),
  primaryForeground: z.string(),
  accent: z.string(),
  accentForeground: z.string(),
  border: z.string(),
  surface: z.string(),
});

export const themeSchema = z.object({
  colors: colorTokenSchema,
  fontPairingId: z.enum(
    FONT_PAIRINGS.map((item) => item.id) as [string, ...string[]],
  ),
  fontScale: z.enum(["compact", "comfortable", "editorial"]),
  spacingScale: z.enum(["tight", "regular", "airy"]),
  radius: z.enum(RADIUS_PROFILES),
  borderStyle: z.enum(["hairline", "solid", "none"]),
  shadowStyle: z.enum(["none", "soft", "deep"]),
  surfaceStyle: z.enum(SURFACE_STYLES),
  containerWidth: z.enum(["narrow", "default", "wide"]),
  imageTreatment: z.enum(IMAGE_TREATMENTS),
  sectionRhythm: z.enum(["even", "alternating", "cinematic"]),
  motionIntensity: z.enum(MOTION_PROFILES),
  backgroundPattern: z.enum(["none", "grain", "linen", "dot"]),
});

export const navItemSchema = z.object({
  label: z.string(),
  href: z.string(),
});

export const sectionContentSchema = z.object({
  eyebrow: z.string().nullable(),
  heading: z.string().nullable(),
  body: z.string().nullable(),
  ctaLabel: z.string().nullable(),
  ctaHref: z.string().nullable(),
  items: z.array(
    z.object({
      title: z.string(),
      body: z.string().nullable(),
      meta: z.string().nullable(),
      assetId: z.string().nullable(),
    }),
  ),
});

export const sectionSchema = z.object({
  id: z.string(),
  type: z.enum(SECTION_TYPES),
  variant: z.string(),
  visible: z.boolean(),
  animation: z.enum(["none", "fade-up", "reveal"]).nullable(),
  content: sectionContentSchema,
  assetIds: z.array(z.string()),
  layout: z.object({
    fullBleed: z.boolean(),
    inverted: z.boolean(),
  }),
});

export const pageSchema = z.object({
  path: z.string(),
  title: z.string(),
  description: z.string(),
  sections: z.array(sectionSchema).min(1),
});

export const siteSpecSchema = z.object({
  schemaVersion: z.literal(1),
  locale: z.string(),
  business: z.object({
    name: z.string(),
    shortName: z.string(),
    tagline: z.string().nullable(),
    description: z.string(),
    city: z.string().nullable(),
    phone: z.string().nullable(),
    email: z.string().nullable(),
    address: z.string().nullable(),
  }),
  seo: z.object({
    title: z.string(),
    description: z.string(),
    keywords: z.array(z.string()),
  }),
  theme: themeSchema,
  navigation: z.object({
    style: z.enum(NAVIGATION_STYLES),
    items: z.array(navItemSchema),
  }),
  pages: z.array(pageSchema).min(1),
  footer: z.object({
    heading: z.string().nullable(),
    body: z.string().nullable(),
    copyright: z.string(),
  }),
  provenance: z.object({
    sourceUrls: z.array(z.string()),
    generatedAt: z.string(),
    warnings: z.array(z.string()),
  }),
  warnings: z.array(z.string()),
});

export type SiteSpec = z.infer<typeof siteSpecSchema>;
export type SiteSection = z.infer<typeof sectionSchema>;
export type SiteTheme = z.infer<typeof themeSchema>;

export const designProfileSchema = z.object({
  brandPersonality: z.string(),
  industry: z.string(),
  targetCustomer: z.string(),
  visualArchetype: z.string(),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  foregroundColor: z.string(),
  backgroundColor: z.string(),
  fontPairingId: z.enum(
    FONT_PAIRINGS.map((item) => item.id) as [string, ...string[]],
  ),
  spacingCharacter: z.enum(["tight", "regular", "airy"]),
  radiusStyle: z.enum(RADIUS_PROFILES),
  shadowStyle: z.enum(["none", "soft", "deep"]),
  surfaceStyle: z.enum(SURFACE_STYLES),
  imageTreatment: z.enum(IMAGE_TREATMENTS),
  patternDirection: z.string(),
  motionProfile: z.enum(MOTION_PROFILES),
  contentDensity: z.enum(["sparse", "balanced", "rich"]),
  recommendedSectionOrder: z.array(z.enum(SECTION_TYPES)),
  clichesToAvoid: z.array(z.string()),
  navigationStyle: z.enum(NAVIGATION_STYLES),
  buttonStyle: z.enum(BUTTON_STYLES),
  heroVariant: z.enum(HERO_VARIANTS),
  productVariant: z.enum(PRODUCT_VARIANTS),
  storyVariant: z.enum(STORY_VARIANTS),
  galleryVariant: z.enum(GALLERY_VARIANTS),
  processVariant: z.enum(PROCESS_VARIANTS),
  contactVariant: z.enum(CONTACT_VARIANTS),
});

export type DesignProfile = z.infer<typeof designProfileSchema>;

export const designFingerprintSchema = z.object({
  archetype: z.string(),
  heroVariant: z.string(),
  sectionSequence: z.array(z.string()),
  productVariant: z.string(),
  typographyPair: z.string(),
  mainPalette: z.array(z.string()),
  radiusProfile: z.string(),
  surfaceProfile: z.string(),
  navigationStyle: z.string(),
  buttonStyle: z.string(),
  motionProfile: z.string(),
  imageTreatment: z.string(),
});

export type DesignFingerprint = z.infer<typeof designFingerprintSchema>;
