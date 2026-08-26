import { load } from "cheerio";

export type ImageCandidate = {
  url: string;
  pageUrl: string;
  alt: string;
  width: number | null;
  height: number | null;
  role: "content" | "logo" | "og";
  context: string;
};

const NEVER_IMAGE_HOSTS = [
  "google.com",
  "google.rs",
  "googleusercontent.com",
  "gstatic.com",
  "ggpht.com",
  "maps.google.com",
  "tripadvisor.com",
  "tripadvisor.rs",
  "yelp.com",
  "wikipedia.org",
  "wikimedia.org",
  "apr.gov.rs",
  "nbs.rs",
  "doubleclick.net",
  "googlesyndication.com",
  "youtube.com",
  "ytimg.com",
  "schema.org",
];

const JUNK_PATTERN =
  /sprite|favicon|pixel|1x1|tracking|badge|button|payment|visa|mastercard|paypal|cookie|widget|avatar|emoji|spacer|blank|placeholder|gravatar|wp-includes|plugins\/|adsense|icon[-_./]|logo[-_./]|banner-ad/i;

const PRODUCT_HINT =
  /product|proizvod|katalog|catalog|shop|gallery|galerija|jam|pekmez|teglic|workshop|radion|craft|ingredient|sastoj/i;

export function hostnameOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

export function isNeverImageHost(host: string) {
  return NEVER_IMAGE_HOSTS.some(
    (blocked) => host === blocked || host.endsWith(`.${blocked}`),
  );
}

export function inferPrimaryImageHosts(
  sources: Array<{ url: string; sourceType: string }>,
  options?: { slug?: string | null; companyName?: string | null },
) {
  const allowedTypes = new Set(["WEBSITE", "INSTAGRAM", "FACEBOOK", "MARKETPLACE"]);
  const fromType = sources
    .filter((source) => allowedTypes.has(source.sourceType))
    .map((source) => hostnameOf(source.url))
    .filter((host) => host && !isNeverImageHost(host));
  if (fromType.length > 0) {
    return [...new Set(fromType)];
  }

  const tokens = [
    options?.slug,
    ...(options?.companyName?.toLowerCase().split(/[^a-z0-9čćžšđ]+/i) ?? []),
  ]
    .filter((token): token is string => Boolean(token && token.length > 3))
    .map((token) => token.toLowerCase());

  const matched = sources
    .map((source) => hostnameOf(source.url))
    .filter((host) => host && !isNeverImageHost(host) && tokens.some((token) => host.includes(token)));
  if (matched.length > 0) {
    return [...new Set(matched)];
  }

  return [
    ...new Set(
      sources.map((source) => hostnameOf(source.url)).filter((host) => host && !isNeverImageHost(host)),
    ),
  ];
}

export function scoreImageCandidate(candidate: ImageCandidate, primaryHosts: string[]) {
  const imageHost = hostnameOf(candidate.url);
  const pageHost = hostnameOf(candidate.pageUrl);
  if (!pageHost || isNeverImageHost(pageHost) || isNeverImageHost(imageHost)) {
    return -100;
  }
  if (primaryHosts.length > 0 && !hostMatches(pageHost, primaryHosts)) {
    return -80;
  }
  const haystack = `${candidate.url} ${candidate.alt} ${candidate.context}`;
  if (JUNK_PATTERN.test(haystack) || candidate.role === "logo") {
    return -40;
  }
  if (
    (candidate.width && candidate.width < 120) ||
    (candidate.height && candidate.height < 120)
  ) {
    return -30;
  }

  let score = 10;
  if (hostMatches(pageHost, primaryHosts)) score += 40;
  if (PRODUCT_HINT.test(haystack) || PRODUCT_HINT.test(candidate.pageUrl)) score += 28;
  if (candidate.role === "og") score += 12;
  if (/header|nav|footer|cookie|menu/.test(candidate.context)) score -= 24;
  return score;
}

export function rankImageCandidates(
  candidates: ImageCandidate[],
  primaryHosts: string[],
  limit = 16,
) {
  const seen = new Set<string>();
  return candidates
    .map((candidate) => ({ candidate, score: scoreImageCandidate(candidate, primaryHosts) }))
    .filter((row) => {
      if (row.score <= 0 || seen.has(row.candidate.url)) return false;
      seen.add(row.candidate.url);
      return true;
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((row) => row.candidate);
}

function hostMatches(host: string, allowed: string[]) {
  return allowed.some((item) => host === item || host.endsWith(`.${item}`) || item.endsWith(`.${host}`));
}

export function extractImageCandidates(html: string, pageUrl: string): ImageCandidate[] {
  const $ = load(html);
  const found: ImageCandidate[] = [];

  $("img").each((_, el) => {
    const node = $(el);
    const src =
      pickLargestSrc(node.attr("srcset"), pageUrl) ||
      absoluteUrl(node.attr("src") || node.attr("data-src") || node.attr("data-lazy-src") || "", pageUrl);
    if (!src) return;
    const alt = (node.attr("alt") ?? "").trim();
    const width = Number(node.attr("width")) || null;
    const height = Number(node.attr("height")) || null;
    const context = [
      node.attr("class"),
      node.parent().attr("class"),
      node.closest("header, nav, footer, aside, [class*='cookie']").prop("tagName"),
      node.closest("[class*='product'], [id*='product'], [class*='gallery']").attr("class"),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    found.push({
      url: src,
      pageUrl,
      alt,
      width,
      height,
      role: /logo/i.test(alt) || /logo/.test(context) ? "logo" : "content",
      context,
    });
  });

  const og = $("meta[property='og:image']").attr("content");
  const ogUrl = absoluteUrl(og ?? "", pageUrl);
  if (ogUrl) {
    found.push({
      url: ogUrl,
      pageUrl,
      alt: $("meta[property='og:title']").attr("content") ?? "",
      width: null,
      height: null,
      role: "og",
      context: "og-image",
    });
  }

  return found;
}

function absoluteUrl(src: string, base: string) {
  if (!src || src.startsWith("data:")) return null;
  try {
    const url = new URL(src, base);
    if (!/^https?:$/.test(url.protocol)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

function pickLargestSrc(srcset: string | undefined, base: string) {
  if (!srcset) return null;
  const parts = srcset
    .split(",")
    .map((part) => part.trim())
    .map((part) => {
      const [value, size] = part.split(/\s+/);
      return {
        url: value,
        width: size?.endsWith("w") ? Number(size.slice(0, -1)) : 0,
      };
    })
    .filter((part) => part.url);
  parts.sort((a, b) => b.width - a.width);
  return parts[0] ? absoluteUrl(parts[0].url, base) : null;
}
