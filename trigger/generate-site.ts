import { task } from "@trigger.dev/sdk";
import { runGenerationPipeline } from "../src/server/generation/pipeline";

export const generateSiteTask = task({
  id: "generate-site",
  maxDuration: 900,
  retry: {
    maxAttempts: 2,
  },
  run: async (payload: { jobId: string }) => {
    await runGenerationPipeline(payload.jobId);
    return { ok: true };
  },
});
