import { describe, expect, it } from "vitest";
import { summarizeGenerationCosts } from "@/lib/analytics/costs";
import { generationCostEur } from "@/lib/ai/pricing";
import { isReservedSlug } from "@/lib/validation/slug";

describe("generation cost analytics", () => {
  it("totals tokens, EUR spend and company ranking", () => {
    const now = new Date("2026-08-26T12:00:00.000Z");
    const summary = summarizeGenerationCosts(
      [
        {
          id: "1",
          status: "SUCCEEDED",
          provider: "OPENAI",
          inputTokens: 1_000_000,
          outputTokens: 100_000,
          createdAt: new Date("2026-08-20T10:00:00.000Z"),
          companyId: "a",
          companyName: "Šinkina teglica",
        },
        {
          id: "2",
          status: "FAILED",
          provider: "OPENAI",
          inputTokens: 200_000,
          outputTokens: 0,
          createdAt: new Date("2026-08-26T08:00:00.000Z"),
          companyId: "b",
          companyName: "Mlekara",
        },
        {
          id: "3",
          status: "SUCCEEDED",
          provider: "MOCK",
          inputTokens: 0,
          outputTokens: 0,
          createdAt: new Date("2026-07-01T08:00:00.000Z"),
          companyId: "a",
          companyName: "Šinkina teglica",
        },
      ],
      now,
    );

    expect(summary.totals.inputTokens).toBe(1_200_000);
    expect(summary.totals.outputTokens).toBe(100_000);
    expect(summary.totals.totalCost).toBeCloseTo(generationCostEur(1_200_000, 100_000));
    expect(summary.totals.succeeded).toBe(2);
    expect(summary.totals.failed).toBe(1);
    expect(summary.totals.failedCost).toBeCloseTo(generationCostEur(200_000, 0));
    expect(summary.totals.openaiJobs).toBe(2);
    expect(summary.companies[0]?.companyName).toBe("Šinkina teglica");
    expect(summary.daily).toHaveLength(14);
  });

  it("reserves the analytics admin slug", () => {
    expect(isReservedSlug("analytics")).toBe(true);
  });
});
