import { after } from "next/server";
import { getEnv } from "@/lib/env";
import { runGenerationPipeline } from "@/server/generation/pipeline";

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
    await runGenerationPipeline(jobId).catch((error: unknown) => {
      console.error("[generation]", error);
    });
  });
}
