import { htmlToPlainText, sanitizeSourceText } from "@/lib/security/sanitize";
import { assertPublicHttpUrl, resolveAndAssertPublicHost } from "@/lib/security/ssrf";
import type { CrawledPage, CrawlRequest, CrawlerProvider } from "@/lib/crawler/types";
import { hashBuffer } from "@/lib/crawler/safe-fetch";

export class PlaywrightCrawlerProvider implements CrawlerProvider {
  readonly name = "playwright" as const;

  async crawl(request: CrawlRequest): Promise<CrawledPage[]> {
    const { chromium } = await import("playwright");
    const browser = await chromium.launch({ headless: true });
    const pages: CrawledPage[] = [];
    const allowed = new Set(request.allowedHostnames.map((h) => h.toLowerCase()));

    try {
      for (const startUrl of request.startUrls.slice(0, request.maxPages ?? 4)) {
        const parsed = assertPublicHttpUrl(startUrl);
        if (!allowed.has(parsed.hostname)) continue;
        await resolveAndAssertPublicHost(parsed.hostname);
        const page = await browser.newPage();
        page.setDefaultTimeout(12_000);
        await page.route("**/*", (route) => {
          const type = route.request().resourceType();
          if (["media", "font", "websocket"].includes(type)) {
            return route.abort();
          }
          return route.continue();
        });
        const response = await page.goto(parsed.href, {
          waitUntil: "domcontentloaded",
        });
        const html = await page.content();
        const title = await page.title();
        pages.push({
          url: parsed.href,
          finalUrl: page.url(),
          title: title || null,
          markdown: sanitizeSourceText(htmlToPlainText(html)),
          text: htmlToPlainText(html),
          htmlHash: hashBuffer(html),
          imageUrls: [],
          logoUrl: null,
          faviconUrl: null,
          status: response?.status() ?? 200,
        });
        await page.close();
      }
    } finally {
      await browser.close();
    }

    return pages;
  }
}
