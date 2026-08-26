import type { SitePlanInput } from "@/lib/ai/types";
import type { SiteSpec } from "@/lib/site-spec/schema";

export function buildMockSiteSpec(input: SitePlanInput): SiteSpec {
  const facts = input.facts;
  const profile = input.profile;
  const name = facts.businessName ?? "Porodična radionica";
  const shortName = facts.shortName ?? name;
  const city = facts.city ?? null;
  const assetId = input.assetIds[0] ?? null;
  const productAssets = input.assetIds.slice(1, 4);
  const cta = input.preferredCta || "Poručite";
  const reasons = [
    {
      title: city ? `Iz ${city}` : "Lokalni rad",
      body: city
        ? `Radiona je vezana za ${city} i okolinu.`
        : "Sve što piše na sajtu dolazi iz javnih izvora o ovoj firmi.",
      meta: null,
      assetId: null,
    },
    {
      title: facts.deliveryInformation ? "Dostava" : "Direktan dogovor",
      body:
        facts.deliveryInformation ??
        "Porudžbina ide kroz direktan kontakt, bez izmišljenih rokova.",
      meta: null,
      assetId: null,
    },
    {
      title: "Po meri radionice",
      body: "Predlog sajta prati stvarnu ponudu, ne generički katalog.",
      meta: null,
      assetId: null,
    },
  ];

  const productItems = facts.products.map((product, index) => ({
    title: product.name,
    body: product.description,
    meta:
      product.price != null
        ? `${product.price} ${product.currency ?? "RSD"} / ${product.unit ?? "kom"}`
        : null,
    assetId: productAssets[index] ?? assetId,
  }));

  return {
    schemaVersion: 1,
    locale: input.locale,
    business: {
      name,
      shortName,
      tagline: facts.description,
      description:
        facts.brandStory ??
        facts.description ??
        "Lokalni proizvođač sa pažljivo čuvanim zanatskim pristupom.",
      city,
      phone: facts.phone,
      email: facts.email,
      address: facts.address,
    },
    seo: {
      title: `${name}${city ? ` — ${city}` : ""}`,
      description:
        facts.description ??
        `Predlog sajta za ${name}. Ovo nije zvanični sajt firme.`,
      keywords: facts.productCategories,
    },
    theme: {
      colors: {
        background: profile.backgroundColor,
        foreground: profile.foregroundColor,
        muted: "#EFE6D8",
        mutedForeground: "#5C5348",
        primary: profile.primaryColor,
        primaryForeground: "#F8F3EA",
        accent: profile.secondaryColor,
        accentForeground: profile.foregroundColor,
        border: "#D9CBB6",
        surface: "#FFFBF4",
      },
      fontPairingId: profile.fontPairingId,
      fontScale: "editorial",
      spacingScale: profile.spacingCharacter,
      radius: profile.radiusStyle,
      borderStyle: "hairline",
      shadowStyle: profile.shadowStyle,
      surfaceStyle: profile.surfaceStyle,
      containerWidth: "default",
      imageTreatment: profile.imageTreatment,
      sectionRhythm: "alternating",
      motionIntensity: profile.motionProfile,
      backgroundPattern: "grain",
    },
    navigation: {
      style: profile.navigationStyle,
      items: [
        { label: "Početna", href: "/" },
        ...(facts.products.length > 0
          ? [{ label: "Proizvodi", href: "/proizvodi" }]
          : []),
        { label: "O nama", href: "/o-nama" },
        { label: "Kontakt", href: "/kontakt" },
      ],
    },
    pages: [
      {
        path: "/",
        title: name,
        description: facts.description ?? name,
        sections: [
          {
            id: "hero-home",
            type: "hero",
            variant: "cinematic",
            visible: true,
            animation: "fade-up",
            content: {
              eyebrow: city ? `Iz ${city}` : "Porodična proizvodnja",
              heading: name,
              body:
                facts.description ??
                "Pažljivo rađeni proizvodi, bez izmišljenih obećanja.",
              ctaLabel: cta,
              ctaHref: "/kontakt",
              items: [],
            },
            assetIds: assetId ? [assetId] : [],
            layout: { fullBleed: true, inverted: false },
          },
          {
            id: "trust-home",
            type: "trust",
            variant: "default",
            visible: true,
            animation: "fade-up",
            content: {
              eyebrow: null,
              heading: "Zašto baš ova radionica",
              body: null,
              ctaLabel: null,
              ctaHref: null,
              items: reasons,
            },
            assetIds: [],
            layout: { fullBleed: false, inverted: false },
          },
          ...(productItems.length
            ? [
                {
                  id: "products-home",
                  type: "products" as const,
                  variant: profile.productVariant,
                  visible: true,
                  animation: "fade-up" as const,
                  content: {
                    eyebrow: "Ponuda",
                    heading: "Šta zaista nudimo",
                    body: "Opisi dolaze samo iz javnih izvora. Ako nešto nije navedeno, nismo to dodavali.",
                    ctaLabel: "Cela ponuda",
                    ctaHref: "/proizvodi",
                    items: productItems,
                  },
                  assetIds: productAssets,
                  layout: { fullBleed: false, inverted: false },
                },
              ]
            : []),
          {
            id: "story-home",
            type: "story",
            variant: profile.storyVariant,
            visible: Boolean(facts.brandStory),
            animation: "reveal",
            content: {
              eyebrow: "Priča",
              heading: "Priča iza imena",
              body: facts.brandStory,
              ctaLabel: "Više o nama",
              ctaHref: "/o-nama",
              items: [],
            },
            assetIds: assetId ? [assetId] : [],
            layout: { fullBleed: false, inverted: false },
          },
          {
            id: "process-home",
            type: "process",
            variant: profile.processVariant,
            visible: true,
            animation: "fade-up",
            content: {
              eyebrow: "Proces",
              heading: "Kako radimo",
              body: null,
              ctaLabel: null,
              ctaHref: null,
              items: [
                {
                  title: "Prikupljanje",
                  body: "Javni izvori i stvarni kontakt podaci ulaze u predlog sajta.",
                  meta: "01",
                  assetId: null,
                },
                {
                  title: "Oblikovanje",
                  body: "Dizajn i copy se slažu oko činjenica, ne oko šablona.",
                  meta: "02",
                  assetId: null,
                },
                {
                  title: "Porudžbina",
                  body: facts.deliveryInformation ?? "Kupac se javlja direktno radionici.",
                  meta: "03",
                  assetId: null,
                },
              ],
            },
            assetIds: [],
            layout: { fullBleed: false, inverted: false },
          },
          {
            id: "gallery-home",
            type: "gallery",
            variant: profile.galleryVariant,
            visible: true,
            animation: "fade-up",
            content: {
              eyebrow: "Materijal",
              heading: "Ambijent i rad",
              body: null,
              ctaLabel: null,
              ctaHref: null,
              items: [],
            },
            assetIds: input.assetIds.slice(0, 6),
            layout: { fullBleed: true, inverted: false },
          },
          {
            id: "cta-home",
            type: "cta",
            variant: profile.contactVariant,
            visible: true,
            animation: "fade-up",
            content: {
              eyebrow: null,
              heading: "Poručite ili svratite",
              body: facts.workingHours,
              ctaLabel: cta,
              ctaHref: "/kontakt",
              items: [],
            },
            assetIds: assetId ? [assetId] : [],
            layout: { fullBleed: true, inverted: true },
          },
        ],
      },
      ...(facts.products.length
        ? [
            {
              path: "/proizvodi",
              title: `Proizvodi — ${name}`,
              description: "Ponuda preuzeta iz javnih izvora.",
              sections: [
                {
                  id: "products-page",
                  type: "products" as const,
                  variant: "masonry-catalog",
                  visible: true,
                  animation: "fade-up" as const,
                  content: {
                    eyebrow: "Katalog",
                    heading: "Šta trenutno nudimo",
                    body: "Nismo dodavali proizvode koji nisu navedeni na izvorima.",
                    ctaLabel: "Poručite",
                    ctaHref: "/kontakt",
                    items: productItems,
                  },
                  assetIds: productAssets,
                  layout: { fullBleed: false, inverted: false },
                },
              ],
            },
          ]
        : []),
      {
        path: "/o-nama",
        title: `O nama — ${name}`,
        description: facts.brandStory ?? name,
        sections: [
          {
            id: "story-about",
            type: "story",
            variant: "image-split",
            visible: true,
            animation: "reveal",
            content: {
              eyebrow: shortName,
              heading: "Ko smo",
              body: facts.brandStory ?? facts.description,
              ctaLabel: null,
              ctaHref: null,
              items: [],
            },
            assetIds: assetId ? [assetId] : [],
            layout: { fullBleed: false, inverted: false },
          },
        ],
      },
      {
        path: "/kontakt",
        title: `Kontakt — ${name}`,
        description: "Kontakt podaci preuzeti iz javnih izvora.",
        sections: [
          {
            id: "contact-page",
            type: "contact",
            variant: profile.contactVariant,
            visible: true,
            animation: "fade-up",
            content: {
              eyebrow: city,
              heading: "Javite nam se",
              body: [facts.address, facts.phone, facts.email, facts.workingHours]
                .filter(Boolean)
                .join(" · "),
              ctaLabel: facts.phone ? "Pozovite" : null,
              ctaHref: facts.phone ? `tel:${facts.phone.replace(/\s+/g, "")}` : null,
              items: [
                {
                  title: "Adresa",
                  body: [facts.address, city].filter(Boolean).join(", "),
                  meta: null,
                  assetId: null,
                },
                {
                  title: "Telefon",
                  body: facts.phone,
                  meta: null,
                  assetId: null,
                },
                {
                  title: "Email",
                  body: facts.email,
                  meta: null,
                  assetId: null,
                },
              ],
            },
            assetIds: [],
            layout: { fullBleed: false, inverted: false },
          },
        ],
      },
    ],
    footer: {
      heading: name,
      body: city ? `Lokalna proizvodnja, ${city}.` : "Lokalna proizvodnja.",
      copyright: `© ${new Date().getFullYear()} ${name}. Ovo je predlog sajta, ne zvanični sajt firme.`,
    },
    provenance: {
      sourceUrls: facts.provenance.map((item) => item.sourceUrl),
      generatedAt: new Date().toISOString(),
      warnings: facts.warnings,
    },
    warnings: facts.missingInformation,
  };
}
