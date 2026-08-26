import { processRasterAsset, createPlaceholderAsset, type ProcessedAsset } from "@/lib/assets/process";
import { safeFetch } from "@/lib/crawler/safe-fetch";

const IMAGE_MAX_BYTES = 2_400_000;

export async function ingestRemoteImages(options: {
  companyId: string;
  urls: string[];
  limit?: number;
}): Promise<ProcessedAsset[]> {
  const unique = [...new Set(options.urls)].filter((url) => {
    try {
      const parsed = new URL(url);
      return /^https?:$/.test(parsed.protocol) && !parsed.hostname.includes("localhost");
    } catch {
      return false;
    }
  });
  const selected = unique.slice(0, options.limit ?? 8);
  const ingested: ProcessedAsset[] = [];

  for (const url of selected) {
    try {
      const response = await safeFetch(url, {
        timeoutMs: 12_000,
        maxBytes: IMAGE_MAX_BYTES,
      });
      const type = response.contentType.toLowerCase();
      if (!type.startsWith("image/") || type.includes("svg") || type.includes("gif")) {
        continue;
      }
      ingested.push(
        await processRasterAsset({
          companyId: options.companyId,
          buffer: response.body,
          filenameHint: url,
        }),
      );
    } catch {
      // Skip images that fail SSRF, type, or decode checks.
    }
  }

  return ingested;
}

export async function ensureVisualAssets(options: {
  companyId: string;
  urls: string[];
}): Promise<ProcessedAsset[]> {
  const ingested = await ingestRemoteImages(options);
  const colors = ["#2B211C", "#C4A574", "#1F3A34", "#E7D7BE", "#4A2C5A", "#1E3A5F"];
  const labels = ["hero", "product-1", "product-2", "process", "gallery-1", "gallery-2"];
  while (ingested.length < 4) {
    const index = ingested.length;
    ingested.push(
      await createPlaceholderAsset({
        companyId: options.companyId,
        label: labels[index] ?? `visual-${index}`,
        color: colors[index] ?? "#C4A574",
      }),
    );
  }
  return ingested;
}
