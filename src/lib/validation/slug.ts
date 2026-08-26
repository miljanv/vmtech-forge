import slugify from "slugify";

export const RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "login",
  "sign-in",
  "sign-up",
  "privacy",
  "settings",
  "companies",
  "pipeline",
  "generations",
  "analytics",
  "media",
  "static",
  "health",
  "sitemap",
  "robots",
  "favicon",
  "studioforge",
  "app",
  "dashboard",
  "webhook",
  "webhooks",
  "assets",
  "public",
  "internal",
  "system",
  "docs",
  "test",
  "tests",
  "preview",
  "clerk",
  "auth",
  "account",
  "next",
  "_next",
  "cdn",
  "status",
]);

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function normalizeSlug(input: string): string {
  return slugify(input, {
    lower: true,
    strict: true,
    locale: "sr",
    trim: true,
  });
}

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug.toLowerCase());
}

export function isValidSlug(slug: string): boolean {
  return SLUG_PATTERN.test(slug) && !isReservedSlug(slug) && slug.length >= 2;
}

export function validateSlug(slug: string): {
  ok: boolean;
  slug: string;
  error?: string;
} {
  const normalized = normalizeSlug(slug);
  if (!normalized || normalized.length < 2) {
    return {
      ok: false,
      slug: normalized,
      error: "Slug mora imati najmanje dva karaktera.",
    };
  }
  if (isReservedSlug(normalized)) {
    return {
      ok: false,
      slug: normalized,
      error: "Ovaj slug je rezervisan za sistemske rute.",
    };
  }
  if (!SLUG_PATTERN.test(normalized)) {
    return {
      ok: false,
      slug: normalized,
      error: "Slug može sadržati samo mala slova, brojeve i crtice.",
    };
  }
  return { ok: true, slug: normalized };
}
