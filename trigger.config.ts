import { defineConfig } from "@trigger.dev/sdk";

export default defineConfig({
  project: process.env.TRIGGER_PROJECT_ID ?? "proj_studioforge_local",
  runtime: "node",
  maxDuration: 900,
  dirs: ["./trigger"],
});
