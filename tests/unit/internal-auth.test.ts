import { describe, expect, it } from "vitest";
import { signGenerationJob, verifyGenerationJob } from "@/lib/generation/internal-auth";

describe("internal generation auth", () => {
  it("accepts a token signed for the same job", () => {
    const token = signGenerationJob("job-1");
    expect(verifyGenerationJob("job-1", token)).toBe(true);
    expect(verifyGenerationJob("job-2", token)).toBe(false);
  });
});
