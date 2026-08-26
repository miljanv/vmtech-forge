import sharp from "sharp";
import { processRasterAsset, createPlaceholderAsset, type ProcessedAsset } from "@/lib/assets/process";
import {
  rankImageCandidates,
  type ImageCandidate,
} from "@/lib/assets/candidates";
import type { ImageKind, ImageReviewInput } from "@/lib/assets/review-schema";
import type { StructuredResult } from "@/lib/ai/types";
import type { ImageReview } from "@/lib/assets/review-schema";
import { safeFetch } from "@/lib/crawler/safe-fetch";

const IMAGE_MAX_BYTES = 2_400_000;
const MIN_PHOTO_EDGE = 240;

export type ReviewedAsset = ProcessedAsset & {
  sourceUrl: string;
  pageUrl: string;
  kind: ImageKind;
  alt: string;
};

export async function ingestRemoteImages(options: {
  companyId: string;
  urls?: string[];
  candidates?: ImageCandidate[];
  primaryHosts?: string[];
  limit?: number;
}): Promise<Array<ProcessedAsset & { sourceUrl: string; pageUrl: string; alt: string; previewJpeg: string }>> {
  const incoming =
    options.candidates ??
    (options.urls ?? []).map((url) => ({
      url,
      pageUrl: url,
      alt: "",
      width: null,
      height: null,
      role: "content" as const,
      context: "",
    }));
  const ranked = rankImageCandidates(incoming, options.primaryHosts ?? [], options.limit ?? 16);
  const ingested: Array<ProcessedAsset & { sourceUrl: string; pageUrl: string; alt: string; previewJpeg: string }> =
    [];

  for (const candidate of ranked) {
    try {
      const response = await safeFetch(candidate.url, {
        timeoutMs: 12_000,
        maxBytes: IMAGE_MAX_BYTES,
      });
      const type = response.contentType.toLowerCase();
      if (!type.startsWith("image/") || type.includes("svg") || type.includes("gif")) {
        continue;
      }
      const processed = await processRasterAsset({
        companyId: options.companyId,
        buffer: response.body,
        filenameHint: candidate.url,
      });
      if (Math.min(processed.width || 0, processed.height || 0) < MIN_PHOTO_EDGE) {
        continue;
      }
      const previewJpeg = await sharp(response.body)
        .rotate()
        .resize({ width: 512, height: 512, fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 55 })
        .toBuffer();
      ingested.push({
        ...processed,
        sourceUrl: candidate.url,
        pageUrl: candidate.pageUrl,
        alt: candidate.alt,
        previewJpeg: previewJpeg.toString("base64"),
      });
    } catch {
      // Skip images that fail SSRF, type, or decode checks.
    }
  }

  return ingested;
}

export async function ensureVisualAssets(options: {
  companyId: string;
  urls?: string[];
  candidates?: ImageCandidate[];
  primaryHosts?: string[];
  businessName?: string | null;
  products?: string[];
  description?: string | null;
  review?: (input: ImageReviewInput) => Promise<StructuredResult<ImageReview>>;
}): Promise<ReviewedAsset[]> {
  const ingested = await ingestRemoteImages(options);
  let selected: ReviewedAsset[] = ingested.map((asset, index) => ({
    storageKey: asset.storageKey,
    publicUrl: asset.publicUrl,
    mimeType: asset.mimeType,
    width: asset.width,
    height: asset.height,
    fileSize: asset.fileSize,
    contentHash: asset.contentHash,
    dominantColors: asset.dominantColors,
    sourceUrl: asset.sourceUrl,
    pageUrl: asset.pageUrl,
    alt: asset.alt,
    kind: index === 0 ? "hero" : "product",
  }));

  if (options.review && ingested.length > 0) {
    try {
      const reviewed = await options.review({
        businessName: options.businessName,
        description: options.description,
        products: options.products ?? [],
        images: ingested.map((asset, index) => ({
          index,
          alt: asset.alt,
          sourceUrl: asset.sourceUrl,
          pageUrl: asset.pageUrl,
          imageBase64: asset.previewJpeg,
        })),
      });
      const kept = reviewed.data.decisions
        .filter((decision) => decision.keep && decision.kind !== "reject")
        .sort((a, b) => kindRank(a.kind) - kindRank(b.kind));
      if (kept.length > 0) {
        selected = kept
          .map((decision) => {
            const asset = ingested[decision.index];
            if (!asset) return null;
            return {
              storageKey: asset.storageKey,
              publicUrl: asset.publicUrl,
              mimeType: asset.mimeType,
              width: asset.width,
              height: asset.height,
              fileSize: asset.fileSize,
              contentHash: asset.contentHash,
              dominantColors: asset.dominantColors,
              sourceUrl: asset.sourceUrl,
              pageUrl: asset.pageUrl,
              alt: asset.alt,
              kind: decision.kind,
            } satisfies ReviewedAsset;
          })
          .filter((asset): asset is ReviewedAsset => Boolean(asset));
      }
    } catch {
      // Heuristic ranking already filtered the pool.
    }
  }

  if (selected.length >= 2) {
    return selected.slice(0, 10);
  }

  const colors = ["#2B211C", "#C4A574", "#1F3A34", "#E7D7BE"];
  const labels = ["hero", "product-1", "product-2", "gallery-1"];
  while (selected.length < 2) {
    const index = selected.length;
    const placeholder = await createPlaceholderAsset({
      companyId: options.companyId,
      label: labels[index] ?? `visual-${index}`,
      color: colors[index] ?? "#C4A574",
    });
    selected.push({
      ...placeholder,
      sourceUrl: "",
      pageUrl: "",
      alt: labels[index] ?? "visual",
      kind: index === 0 ? "hero" : "product",
    });
  }
  return selected;
}

function kindRank(kind: ImageKind) {
  if (kind === "hero") return 0;
  if (kind === "product") return 1;
  if (kind === "workshop") return 2;
  if (kind === "people") return 3;
  return 4;
}
