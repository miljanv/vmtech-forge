import { getEnv } from "@/lib/env";
import { FirecrawlProvider } from "@/lib/crawler/firecrawl";
import { MockCrawlerProvider } from "@/lib/crawler/mock";
import { NativeCrawlerProvider } from "@/lib/crawler/native";
import { PlaywrightCrawlerProvider } from "@/lib/crawler/playwright";
import type { CrawlerProvider } from "@/lib/crawler/types";

export function getCrawlerProvider(): CrawlerProvider {
  const env = getEnv();
  if (process.env.NODE_ENV === "test") {
    return new MockCrawlerProvider();
  }
  if (env.firecrawlEnabled) {
    return new FirecrawlProvider();
  }
  return new NativeCrawlerProvider();
}

export function getPlaywrightFallback(): CrawlerProvider {
  return new PlaywrightCrawlerProvider();
}

export { MockCrawlerProvider, NativeCrawlerProvider, FirecrawlProvider };
