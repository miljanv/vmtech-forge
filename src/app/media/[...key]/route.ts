import path from "node:path";
import { NextResponse } from "next/server";
import { LocalStorageProvider } from "@/lib/storage/local";
import { getStorage } from "@/lib/storage";
import { prisma } from "@/server/db";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ key: string[] }> },
) {
  const { key } = await context.params;
  const relative = key.join("/");
  if (!relative || relative.includes("..") || path.isAbsolute(relative)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const storage = getStorage();
  let object = await storage.get(relative);
  if (!object && storage.name === "r2") {
    object = await new LocalStorageProvider().get(relative);
  }

  if (object) {
    return new NextResponse(new Uint8Array(object.body), {
      headers: {
        "Content-Type": object.contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  }

  const asset = await prisma.asset.findFirst({
    where: { storageKey: relative, excluded: false },
    select: { sourceUrl: true },
  });
  const sourceUrl = asset?.sourceUrl?.trim();
  if (sourceUrl) {
    try {
      const url = new URL(sourceUrl);
      if (url.protocol === "http:" || url.protocol === "https:") {
        return NextResponse.redirect(url, 302);
      }
    } catch {
      // Invalid original URL — fall through to 404.
    }
  }

  return new NextResponse("Not found", {
    status: 404,
    headers: { "Cache-Control": "no-store" },
  });
}
