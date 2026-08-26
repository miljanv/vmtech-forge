import type { SiteSpec } from "@/lib/site-spec/schema";

const SECTION_NAV: Array<{ types: string[]; label: string }> = [
  { types: ["products"], label: "Proizvodi" },
  { types: ["story"], label: "O nama" },
  { types: ["gallery"], label: "Galerija" },
  { types: ["process"], label: "Proces" },
  { types: ["contact", "cta"], label: "Kontakt" },
];

export function buildNavigationItems(spec: SiteSpec) {
  const home = spec.pages.find((page) => page.path === "/") ?? spec.pages[0];
  const items: Array<{ label: string; href: string }> = [{ label: "Početna", href: "/" }];
  const seen = new Set(["/"]);

  if (spec.pages.length > 1) {
    for (const page of spec.pages) {
      if (page.path === "/" || seen.has(page.path)) continue;
      seen.add(page.path);
      items.push({
        label: navLabelFromPage(page.path, page.title),
        href: page.path,
      });
    }
  } else if (home) {
    for (const def of SECTION_NAV) {
      const section = home.sections.find((item) => item.visible && def.types.includes(item.type));
      if (!section || seen.has(`#${section.id}`)) continue;
      seen.add(`#${section.id}`);
      items.push({ label: def.label, href: `#${section.id}` });
    }
  }

  return items.slice(0, 6);
}

export function ensureReachableLinks(spec: SiteSpec) {
  const paths = new Set(spec.pages.map((page) => page.path));
  const home = spec.pages.find((page) => page.path === "/") ?? spec.pages[0];
  const hashFor = (types: string[]) => {
    const section = home?.sections.find((item) => item.visible && types.includes(item.type));
    return section ? `#${section.id}` : "/";
  };

  const rewrite = (href: string | null) => {
    if (!href || href.startsWith("http") || href.startsWith("tel:") || href.startsWith("mailto:") || href.startsWith("#")) {
      return href;
    }
    if (href.startsWith("/") && paths.has(href)) return href;
    if (/proizvod|katalog|ponuda/.test(href)) return hashFor(["products"]);
    if (/o-nama|about|prica|story/.test(href)) return hashFor(["story"]);
    if (/kontakt|contact/.test(href)) return hashFor(["contact", "cta"]);
    return href;
  };

  spec.navigation.items = spec.navigation.items
    .map((item) => ({ ...item, href: rewrite(item.href) ?? "/" }))
    .filter((item, index, all) => all.findIndex((row) => row.href === item.href) === index);

  for (const page of spec.pages) {
    for (const section of page.sections) {
      section.content.ctaHref = rewrite(section.content.ctaHref);
    }
  }
}

export function assignAvailableAssets(spec: SiteSpec, assetIds: string[]) {
  if (assetIds.length === 0) return;
  const unique = [...new Set(assetIds)];
  const home = spec.pages.find((page) => page.path === "/") ?? spec.pages[0];
  if (!home) return;

  const hero = home.sections.find((section) => section.type === "hero");
  if (hero && hero.assetIds.length < 3) {
    hero.assetIds = [...new Set([...hero.assetIds, ...unique])].slice(0, 8);
  }

  const products = home.sections.find((section) => section.type === "products");
  if (products) {
    products.content.items.forEach((item, index) => {
      if (!item.assetId) {
        item.assetId = unique[Math.min(index + 1, unique.length - 1)] ?? unique[0] ?? null;
      }
    });
    if (products.assetIds.length === 0) {
      products.assetIds = unique.slice(0, 6);
    }
  }

  const gallery = home.sections.find((section) => section.type === "gallery");
  if (gallery && gallery.assetIds.length < 3) {
    gallery.assetIds = unique.slice(0, 8);
  }
}

export function polishSiteNavigation(spec: SiteSpec, assetIds?: string[]) {
  const paths = new Set(spec.pages.map((page) => page.path));
  spec.navigation.items = spec.navigation.items.filter(
    (item) => item.href.startsWith("#") || item.href.startsWith("http") || paths.has(item.href),
  );
  if (spec.navigation.items.length < 2) {
    spec.navigation.items = buildNavigationItems(spec);
  }
  ensureReachableLinks(spec);
  if (assetIds) assignAvailableAssets(spec, assetIds);
  return spec;
}

function navLabelFromPage(path: string, title: string) {
  if (path === "/proizvodi") return "Proizvodi";
  if (path === "/o-nama") return "O nama";
  if (path === "/kontakt") return "Kontakt";
  const cleaned = title.split("—")[0]?.trim();
  return cleaned && cleaned.length < 24 ? cleaned : path.replace(/^\//, "").replace(/-/g, " ");
}
