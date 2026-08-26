export type CrawledPage = {
  url: string;
  finalUrl: string;
  title: string | null;
  markdown: string;
  text: string;
  htmlHash: string;
  imageUrls: string[];
  logoUrl: string | null;
  faviconUrl: string | null;
  status: number;
};

export type CrawlRequest = {
  startUrls: string[];
  maxPages?: number;
  allowedHostnames: string[];
};

export interface CrawlerProvider {
  readonly name: "firecrawl" | "native" | "playwright" | "mock";
  crawl(request: CrawlRequest): Promise<CrawledPage[]>;
}
