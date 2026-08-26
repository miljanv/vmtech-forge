import { after } from "next/server";
import { NextResponse } from "next/server";
import { runGenerationPipeline } from "@/server/generation/pipeline";
import { verifyGenerationJob } from "@/lib/generation/internal-auth";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { jobId?: string } | null;
  const jobId = body?.jobId;
  const token = request.headers.get("x-studioforge-job-token");
  if (!jobId || !verifyGenerationJob(jobId, token)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  after(async () => {
    await runGenerationPipeline(jobId).catch((error: unknown) => {
      console.error("[generation.internal]", error);
    });
  });

  return NextResponse.json({ ok: true, accepted: true });
}
