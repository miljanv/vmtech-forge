import sharp from "sharp";
import { inspectImageBuffer } from "@/lib/assets/validate";
import { hashBuffer } from "@/lib/crawler/safe-fetch";
import { getStorage } from "@/lib/storage";

export type ProcessedAsset = {
  storageKey: string;
  publicUrl: string;
  mimeType: string;
  width: number;
  height: number;
  fileSize: number;
  contentHash: string;
  dominantColors: string[];
};

export async function processRasterAsset(options: {
  companyId: string;
  buffer: Buffer;
  filenameHint: string;
}): Promise<ProcessedAsset> {
  const inspected = await inspectImageBuffer(options.buffer);
  const image = sharp(options.buffer, { failOn: "none" }).rotate();
  const metadata = await image.metadata();
  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;
  const stats = await image.stats();
  const dominant = stats.dominant;
  const dominantColors = [
    `#${[dominant.r, dominant.g, dominant.b]
      .map((value) => value.toString(16).padStart(2, "0"))
      .join("")}`,
  ];

  const webp = await image
    .resize({ width: Math.min(width || 1600, 1600), withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();
  const thumb = await sharp(webp).resize({ width: 480, withoutEnlargement: true }).webp({ quality: 75 }).toBuffer();
  const hash = hashBuffer(webp);
  const storage = getStorage();
  const key = `assets/${options.companyId}/${hash}.webp`;
  const stored = await storage.put({
    key,
    body: webp,
    contentType: "image/webp",
  });
  await storage.put({
    key: `assets/${options.companyId}/${hash}-thumb.webp`,
    body: thumb,
    contentType: "image/webp",
  });

  return {
    storageKey: stored.key,
    publicUrl: stored.publicUrl,
    mimeType: inspected.mimeType === "image/svg+xml" ? "image/webp" : "image/webp",
    width,
    height,
    fileSize: webp.byteLength,
    contentHash: hash,
    dominantColors,
  };
}

export async function createPlaceholderAsset(options: {
  companyId: string;
  label: string;
  color: string;
}): Promise<ProcessedAsset> {
  const buffer = await sharp({
    create: {
      width: 1600,
      height: 1000,
      channels: 3,
      background: options.color,
    },
  })
    .webp({ quality: 80 })
    .toBuffer();
  return processRasterAsset({
    companyId: options.companyId,
    buffer,
    filenameHint: options.label,
  });
}
