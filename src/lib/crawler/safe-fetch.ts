import { createHash } from "node:crypto";
import {
  SSRF_MAX_BYTES,
  SSRF_MAX_REDIRECTS,
  SSRF_TIMEOUT_MS,
  assertPublicHttpUrl,
  resolveAndAssertPublicHost,
} from "@/lib/security/ssrf";
import { AppError } from "@/lib/errors";

export async function safeFetch(
  rawUrl: string,
  options?: { timeoutMs?: number; maxBytes?: number },
): Promise<{ url: string; status: number; contentType: string; body: Buffer }> {
  const timeoutMs = options?.timeoutMs ?? SSRF_TIMEOUT_MS;
  const maxBytes = options?.maxBytes ?? SSRF_MAX_BYTES;
  let current = assertPublicHttpUrl(rawUrl).href;
  let redirects = 0;

  while (redirects <= SSRF_MAX_REDIRECTS) {
    const parsed = assertPublicHttpUrl(current);
    await resolveAndAssertPublicHost(parsed.hostname);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(parsed.href, {
        method: "GET",
        redirect: "manual",
        signal: controller.signal,
        headers: {
          "User-Agent": "StudioForgeBot/1.0 (+https://studioforge.local/bot)",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/*;q=0.8,*/*;q=0.5",
        },
      });

      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get("location");
        if (!location) {
          throw new AppError({
            code: "REDIRECT_FAILED",
            message: "Redirect without location",
            userMessage: "Izvor je vratio preusmerenje bez destinacije.",
          });
        }
        current = new URL(location, parsed.href).toString();
        redirects += 1;
        continue;
      }

      const contentLength = Number(response.headers.get("content-length") ?? "0");
      if (contentLength > maxBytes) {
        throw new AppError({
          code: "RESPONSE_TOO_LARGE",
          message: "Response too large",
          userMessage: "Stranica je prevelika za obradu.",
        });
      }

      const arrayBuffer = await response.arrayBuffer();
      if (arrayBuffer.byteLength > maxBytes) {
        throw new AppError({
          code: "RESPONSE_TOO_LARGE",
          message: "Response too large",
          userMessage: "Stranica je prevelika za obradu.",
        });
      }

      return {
        url: parsed.href,
        status: response.status,
        contentType: response.headers.get("content-type") ?? "application/octet-stream",
        body: Buffer.from(arrayBuffer),
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new AppError({
    code: "TOO_MANY_REDIRECTS",
    message: "Too many redirects",
    userMessage: "Izvor ima previše preusmerenja.",
  });
}

export function hashBuffer(buffer: Buffer | string): string {
  return createHash("sha256").update(buffer).digest("hex");
}
