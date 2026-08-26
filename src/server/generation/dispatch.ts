import { after } from "next/server";
import { getEnv } from "@/lib/env";
import { runGenerationPipeline } from "@/server/generation/pipeline";
import {
  generationBaseUrl,
  signGenerationJob,
} from "@/lib/generation/internal-auth";

export async function dispatchGeneration(jobId: string): Promise<void> {
  const env = getEnv();
  if (env.triggerEnabled) {
    const { tasks } = await import("@trigger.dev/sdk");
    await tasks.trigger("generate-site", { jobId });
    return;
  }

  if (process.env.STUDIOFORGE_INLINE_JOBS === "true") {
    await runGenerationPipeline(jobId);
    return;
  }

  after(async () => {
    try {
      if (process.env.VERCEL) {
        await enqueueDetachedGeneration(jobId);
        return;
      }
      await runGenerationPipeline(jobId);
    } catch (error) {
      console.error("[generation.dispatch]", error);
      await runGenerationPipeline(jobId).catch((pipelineError: unknown) => {
        console.error("[generation]", pipelineError);
      });
    }
  });
}

async function enqueueDetachedGeneration(jobId: string) {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    "x-studioforge-job-token": signGenerationJob(jobId),
  };
  const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  if (bypass) {
    headers["x-vercel-protection-bypass"] = bypass;
  }

  const response = await fetch(`${generationBaseUrl()}/api/internal/generate`, {
    method: "POST",
    headers,
    body: JSON.stringify({ jobId }),
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Detached generate failed ${response.status}`);
  }
}
