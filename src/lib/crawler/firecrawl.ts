import Firecrawl from "@mendable/firecrawl-js";
import { load } from "cheerio";
import { getEnv } from "@/lib/env";
import { htmlToPlainText, sanitizeSourceText } from "@/lib/security/sanitize";
import { assertPublicHttpUrl } from "@/lib/security/ssrf";
import type { CrawledPage, CrawlRequest, CrawlerProvider } from "@/lib/crawler/types";
import { hashBuffer } from "@/lib/crawler/safe-fetch";

export class FirecrawlProvider implements CrawlerProvider {
  readonly name = "firecrawl" as const;

  async crawl(request: CrawlRequest): Promise<CrawledPage[]> {
    const env = getEnv();
    if (!env.FIRECRAWL_API_KEY) {
      throw new Error("FIRECRAWL_API_KEY is not configured.");
    }
    const client = new Firecrawl({ apiKey: env.FIRECRAWL_API_KEY });
    const pages: CrawledPage[] = [];
    const allowed = new Set(request.allowedHostnames.map((h) => h.toLowerCase()));

    for (const startUrl of request.startUrls) {
      const parsed = assertPublicHttpUrl(startUrl);
      if (!allowed.has(parsed.hostname)) continue;
      const result = await client.scrape(parsed.href, {
        formats: ["markdown", "html"],
        onlyMainContent: true,
      });
      const markdown = sanitizeSourceText(
        (result as { markdown?: string }).markdown ?? "",
      );
      const html = (result as { html?: string }).html ?? markdown;
      const imageUrls: string[] = [];
      const $ = load(html);
      $("img").each((_, el) => {
        const src = $(el).attr("src") || $(el).attr("data-src");
        if (!src) return;
        try {
          imageUrls.push(new URL(src, parsed.href).toString());
        } catch {
          // ignore
        }
      });
      const og = $('meta[property="og:image"]').attr("content");
      if (og) {
        try {
          imageUrls.push(new URL(og, parsed.href).toString());
        } catch {
          // ignore
        }
      }
      pages.push({
        url: parsed.href,
        finalUrl: parsed.href,
        title: (result as { metadata?: { title?: string } }).metadata?.title ?? null,
        markdown,
        text: htmlToPlainText(html),
        htmlHash: hashBuffer(markdown),
        imageUrls: [...new Set(imageUrls)].slice(0, 12),
        logoUrl: null,
        faviconUrl: null,
        status: 200,
      });
    }

    return pages;
  }
}
