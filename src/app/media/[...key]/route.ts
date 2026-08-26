import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  context: { params: Promise<{ key: string[] }> },
) {
  const { key } = await context.params;
  const relative = key.join("/");
  if (relative.includes("..") || path.isAbsolute(relative)) {
    return new NextResponse("Not found", { status: 404 });
  }
  const filePath = path.join(process.cwd(), ".data", "storage", relative);
  try {
    const body = await readFile(filePath);
    return new NextResponse(body, {
      headers: {
        "Content-Type": relative.endsWith(".webp") ? "image/webp" : "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
