import { load } from "cheerio";
import { htmlToPlainText, sanitizeSourceText } from "@/lib/security/sanitize";
import { assertPublicHttpUrl } from "@/lib/security/ssrf";
import type { CrawledPage, CrawlRequest, CrawlerProvider } from "@/lib/crawler/types";
import { hashBuffer, safeFetch } from "@/lib/crawler/safe-fetch";

const RELEVANT_PATH_HINTS = [
  "/",
  "/o-nama",
  "/about",
  "/proizvodi",
  "/products",
  "/katalog",
  "/catalog",
  "/kontakt",
  "/contact",
  "/dostava",
  "/delivery",
];

async function robotsAllows(origin: string, pathname: string): Promise<boolean> {
  try {
    const robotsUrl = new URL("/robots.txt", origin).toString();
    const response = await safeFetch(robotsUrl, { timeoutMs: 5000, maxBytes: 50_000 });
    if (response.status >= 400) {
      return true;
    }
    const text = response.body.toString("utf8");
    const lines = text.split("\n").map((line) => line.trim());
    let applies = false;
    const disallows: string[] = [];
    for (const line of lines) {
      if (line.toLowerCase().startsWith("user-agent:")) {
        applies = line.toLowerCase().includes("*");
      } else if (applies && line.toLowerCase().startsWith("disallow:")) {
        disallows.push(line.slice("disallow:".length).trim());
      }
    }
    return !disallows.some(
      (rule) => rule !== "" && pathname.startsWith(rule),
    );
  } catch {
    return true;
  }
}

function extractImages(html: string, baseUrl: string): string[] {
  const $ = load(html);
  const urls = new Set<string>();
  $("img").each((_, el) => {
    const src = $(el).attr("src") || $(el).attr("data-src");
    if (!src) return;
    try {
      urls.add(new URL(src, baseUrl).toString());
    } catch {
      // ignore invalid
    }
  });
  return [...urls];
}

function extractLogo(html: string, baseUrl: string): string | null {
  const $ = load(html);
  const logo =
    $('img[alt*="logo" i]').attr("src") ||
    $('link[rel="apple-touch-icon"]').attr("href") ||
    $('meta[property="og:image"]').attr("content");
  if (!logo) return null;
  try {
    return new URL(logo, baseUrl).toString();
  } catch {
    return null;
  }
}

export class NativeCrawlerProvider implements CrawlerProvider {
  readonly name = "native" as const;

  async crawl(request: CrawlRequest): Promise<CrawledPage[]> {
    const maxPages = request.maxPages ?? 8;
    const allowed = new Set(
      request.allowedHostnames.map((host) => host.toLowerCase()),
    );
    const queue = [...request.startUrls];
    const seen = new Set<string>();
    const pages: CrawledPage[] = [];

    while (queue.length > 0 && pages.length < maxPages) {
      const next = queue.shift();
      if (!next || seen.has(next)) continue;
      seen.add(next);

      const parsed = assertPublicHttpUrl(next);
      if (!allowed.has(parsed.hostname)) continue;
      const allowedByRobots = await robotsAllows(
        `${parsed.protocol}//${parsed.hostname}`,
        new URL(parsed.href).pathname,
      );
      if (!allowedByRobots) continue;

      try {
        const response = await safeFetch(parsed.href);
        if (!response.contentType.includes("html") && response.status >= 400) {
          continue;
        }
        const html = response.body.toString("utf8");
        const $ = load(html);
        $("script, style, noscript, iframe, form").remove();
        const title = $("title").first().text().trim() || null;
        const markdown = sanitizeSourceText(
          $("main").text() || $("article").text() || $("body").text(),
        );
        const text = htmlToPlainText(html);
        const imageUrls = extractImages(html, response.url);
        const logoUrl = extractLogo(html, response.url);
        const faviconHref =
          $('link[rel="icon"]').attr("href") ||
          $('link[rel="shortcut icon"]').attr("href") ||
          "/favicon.ico";
        const faviconUrl = new URL(faviconHref, response.url).toString();

        pages.push({
          url: parsed.href,
          finalUrl: response.url,
          title,
          markdown,
          text,
          htmlHash: hashBuffer(response.body),
          imageUrls,
          logoUrl,
          faviconUrl,
          status: response.status,
        });

        $("a[href]").each((_, el) => {
          const href = $(el).attr("href");
          if (!href) return;
          try {
            const absolute = new URL(href, response.url);
            if (allowed.has(absolute.hostname.toLowerCase())) {
              const score = RELEVANT_PATH_HINTS.some((hint) =>
                absolute.pathname.includes(hint.replace(/^\//, "")),
              );
              if (score) {
                queue.unshift(absolute.toString());
              } else {
                queue.push(absolute.toString());
              }
            }
          } catch {
            // ignore
          }
        });
      } catch {
        continue;
      }
    }

    return pages;
  }
}
