import { sanitizeSourceText } from "@/lib/security/sanitize";
import { hashBuffer } from "@/lib/crawler/safe-fetch";
import type { CrawledPage, CrawlRequest, CrawlerProvider } from "@/lib/crawler/types";

const MOCK_COPY = `
Mlekara Jović je porodična mlekara iz sela Ljubovija. Proizvodimo kajmak, sir, jogurt i sveže mleko od krava sa okolnih pašnjaka.
Radno vreme: ponedeljak–subota 07:00–18:00.
Adresa: Vojvode Mišića 12, Ljubovija.
Telefon: +381 64 123 4567.
Email: kontakt@mlekara-jovic.example
Dostava: lično preuzimanje i dostava u okolini Loznice.
Proizvodi: Kajmak (750 RSD / 500g), Beli sir (890 RSD / kg), Jogurt 2.8% (180 RSD / l).
`.trim();

export class MockCrawlerProvider implements CrawlerProvider {
  readonly name = "mock" as const;

  async crawl(request: CrawlRequest): Promise<CrawledPage[]> {
    return request.startUrls.map((url) => ({
      url,
      finalUrl: url,
      title: "Mlekara Jović — porodična mlekara",
      markdown: sanitizeSourceText(MOCK_COPY),
      text: MOCK_COPY,
      htmlHash: hashBuffer(`${url}:${MOCK_COPY}`),
      imageUrls: [],
      imageCandidates: [],
      logoUrl: null,
      faviconUrl: null,
      status: 200,
    }));
  }
}
