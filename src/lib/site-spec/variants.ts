export const FONT_PAIRINGS = [
  {
    id: "instrument",
    heading: "Instrument Serif",
    body: "Instrument Sans",
    googleHeading: "Instrument Serif",
    googleBody: "Instrument Sans",
  },
  {
    id: "fraunces-figtree",
    heading: "Fraunces",
    body: "Figtree",
    googleHeading: "Fraunces",
    googleBody: "Figtree",
  },
  {
    id: "newsreader-source",
    heading: "Newsreader",
    body: "Source Sans 3",
    googleHeading: "Newsreader",
    googleBody: "Source Sans 3",
  },
  {
    id: "playfair-lato",
    heading: "Playfair Display",
    body: "Lato",
    googleHeading: "Playfair Display",
    googleBody: "Lato",
  },
  {
    id: "cormorant-karla",
    heading: "Cormorant Garamond",
    body: "Karla",
    googleHeading: "Cormorant Garamond",
    googleBody: "Karla",
  },
  {
    id: "libre-nunito",
    heading: "Libre Baskerville",
    body: "Nunito Sans",
    googleHeading: "Libre Baskerville",
    googleBody: "Nunito Sans",
  },
  {
    id: "dm",
    heading: "DM Serif Display",
    body: "DM Sans",
    googleHeading: "DM Serif Display",
    googleBody: "DM Sans",
  },
  {
    id: "literata-plex",
    heading: "Literata",
    body: "IBM Plex Sans",
    googleHeading: "Literata",
    googleBody: "IBM Plex Sans",
  },
  {
    id: "young-outfit",
    heading: "Young Serif",
    body: "Outfit",
    googleHeading: "Young Serif",
    googleBody: "Outfit",
  },
  {
    id: "source-serif",
    heading: "Source Serif 4",
    body: "Source Sans 3",
    googleHeading: "Source Serif 4",
    googleBody: "Source Sans 3",
  },
] as const;

export type FontPairingId = (typeof FONT_PAIRINGS)[number]["id"];

export const fontPairingIds = FONT_PAIRINGS.map((pairing) => pairing.id) as [
  FontPairingId,
  ...FontPairingId[],
];

export function getFontPairing(id: string) {
  return FONT_PAIRINGS.find((pairing) => pairing.id === id) ?? FONT_PAIRINGS[0];
}

export const HERO_VARIANTS = [
  "cinematic",
  "editorial-split",
  "asymmetric-product",
  "layered-collage",
  "minimal-centered",
  "bold-typographic",
  "story-first",
] as const;

export const PRODUCT_VARIANTS = [
  "editorial-grid",
  "masonry-catalog",
  "horizontal-rail",
  "category-led",
  "featured-split",
  "compact-catalog",
] as const;

export const STORY_VARIANTS = [
  "magazine",
  "timeline",
  "image-split",
  "quote-led",
] as const;

export const GALLERY_VARIANTS = [
  "masonry",
  "offset-editorial",
  "filmstrip",
  "full-carousel",
] as const;

export const PROCESS_VARIANTS = [
  "horizontal-steps",
  "vertical-timeline",
  "alternating-story",
  "icon-led",
] as const;

export const CONTACT_VARIANTS = [
  "minimal-panel",
  "full-bleed-cta",
  "split-location",
  "compact-sticky",
  "map-led",
] as const;

export const NAVIGATION_STYLES = [
  "transparent-overlay",
  "solid-editorial",
  "minimal-left",
  "centered-logo",
] as const;

export const BUTTON_STYLES = [
  "solid-pill",
  "sharp-rect",
  "outline-underline",
  "soft-rounded",
] as const;

export const MOTION_PROFILES = ["still", "subtle", "editorial"] as const;
export const SURFACE_STYLES = ["paper", "ink", "linen", "stone"] as const;
export const RADIUS_PROFILES = ["none", "soft", "round"] as const;
export const IMAGE_TREATMENTS = [
  "natural",
  "warm-grade",
  "high-contrast",
  "soft-film",
] as const;

export const SECTION_TYPES = [
  "hero",
  "trust",
  "products",
  "story",
  "process",
  "gallery",
  "features",
  "materials",
  "testimonials",
  "faq",
  "delivery",
  "location",
  "social",
  "cta",
  "contact",
] as const;

export type SectionType = (typeof SECTION_TYPES)[number];

export function variantsForType(type: SectionType): readonly string[] {
  switch (type) {
    case "hero":
      return HERO_VARIANTS;
    case "products":
      return PRODUCT_VARIANTS;
    case "story":
      return STORY_VARIANTS;
    case "gallery":
      return GALLERY_VARIANTS;
    case "process":
      return PROCESS_VARIANTS;
    case "contact":
    case "cta":
      return CONTACT_VARIANTS;
    default:
      return ["default"];
  }
}

export function availableComponentsCatalog() {
  return SECTION_TYPES.map((type) => ({
    type,
    variants: [...variantsForType(type)],
  }));
}

export function supportedFontsCatalog() {
  return FONT_PAIRINGS.map((pairing) => ({
    id: pairing.id,
    heading: pairing.heading,
    body: pairing.body,
  }));
}
