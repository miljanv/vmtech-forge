import { fileTypeFromBuffer } from "file-type";
import { isUnsafeSvg } from "@/lib/security/sanitize";
import { AppError } from "@/lib/errors";

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/svg+xml",
]);

export const MIN_IMAGE_BYTES = 2_000;
export const MAX_IMAGE_BYTES = 8_000_000;
export const MIN_DIMENSION = 80;

export async function inspectImageBuffer(buffer: Buffer): Promise<{
  mimeType: string;
  extension: string;
}> {
  if (buffer.byteLength < MIN_IMAGE_BYTES && !buffer.toString("utf8").includes("<svg")) {
    throw new AppError({
      code: "IMAGE_TOO_SMALL",
      message: "Image too small",
      userMessage: "Slika je previše mala i verovatno nije korisna.",
    });
  }
  if (buffer.byteLength > MAX_IMAGE_BYTES) {
    throw new AppError({
      code: "IMAGE_TOO_LARGE",
      message: "Image too large",
      userMessage: "Slika prelazi dozvoljenu veličinu.",
    });
  }

  const detected = await fileTypeFromBuffer(buffer);
  const asText = buffer.toString("utf8", 0, Math.min(buffer.byteLength, 400));
  if (asText.includes("<svg")) {
    if (isUnsafeSvg(asText)) {
      throw new AppError({
        code: "UNSAFE_SVG",
        message: "Unsafe SVG",
        userMessage: "SVG fajl sadrži nesiguran sadržaj.",
      });
    }
    return { mimeType: "image/svg+xml", extension: "svg" };
  }

  if (!detected || !ALLOWED_MIME.has(detected.mime)) {
    throw new AppError({
      code: "UNSUPPORTED_IMAGE",
      message: `Unsupported mime ${detected?.mime ?? "unknown"}`,
      userMessage: "Tip slike nije podržan.",
    });
  }

  return { mimeType: detected.mime, extension: detected.ext };
}
