import { generationCostEur } from "@/lib/ai/pricing";

export type JobCostRow = {
  id: string;
  status: string;
  provider: string;
  inputTokens: number;
  outputTokens: number;
  createdAt: Date;
  companyId: string;
  companyName: string;
};

export function dayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function summarizeGenerationCosts(jobs: JobCostRow[], now = new Date()) {
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const dayMs = 24 * 60 * 60 * 1000;
  const last30 = new Date(now.getTime() - 30 * dayMs);

  let inputTokens = 0;
  let outputTokens = 0;
  let monthCost = 0;
  let last30Cost = 0;
  let succeeded = 0;
  let failed = 0;
  let running = 0;
  let openaiJobs = 0;
  let mockJobs = 0;

  const byCompany = new Map<
    string,
    { companyId: string; companyName: string; jobs: number; inputTokens: number; outputTokens: number; cost: number }
  >();
  const byDay = new Map<string, number>();

  for (const job of jobs) {
    const cost = generationCostEur(job.inputTokens, job.outputTokens);
    inputTokens += job.inputTokens;
    outputTokens += job.outputTokens;
    if (job.status === "SUCCEEDED") succeeded += 1;
    else if (job.status === "FAILED") failed += 1;
    else if (job.status === "QUEUED" || job.status === "RUNNING") running += 1;
    if (job.provider === "OPENAI") openaiJobs += 1;
    else mockJobs += 1;
    if (job.createdAt >= monthStart) monthCost += cost;
    if (job.createdAt >= last30) last30Cost += cost;

    const current = byCompany.get(job.companyId) ?? {
      companyId: job.companyId,
      companyName: job.companyName,
      jobs: 0,
      inputTokens: 0,
      outputTokens: 0,
      cost: 0,
    };
    current.jobs += 1;
    current.inputTokens += job.inputTokens;
    current.outputTokens += job.outputTokens;
    current.cost += cost;
    byCompany.set(job.companyId, current);

    const key = dayKey(job.createdAt);
    byDay.set(key, (byDay.get(key) ?? 0) + cost);
  }

  const daily = Array.from({ length: 14 }, (_, index) => {
    const date = new Date(now.getTime() - (13 - index) * dayMs);
    const key = dayKey(date);
    return { name: key.slice(5), cost: Number((byDay.get(key) ?? 0).toFixed(4)) };
  });

  const totalCost = generationCostEur(inputTokens, outputTokens);
  const billedJobs = jobs.filter((job) => job.inputTokens + job.outputTokens > 0).length;
  const failedCost = jobs
    .filter((job) => job.status === "FAILED")
    .reduce((sum, job) => sum + generationCostEur(job.inputTokens, job.outputTokens), 0);

  return {
    totals: {
      jobs: jobs.length,
      succeeded,
      failed,
      running,
      openaiJobs,
      mockJobs,
      inputTokens,
      outputTokens,
      totalCost,
      monthCost,
      last30Cost,
      failedCost,
      averageCost: billedJobs === 0 ? 0 : totalCost / billedJobs,
    },
    daily,
    companies: [...byCompany.values()].sort((a, b) => b.cost - a.cost).slice(0, 8),
    recent: jobs.slice(0, 12).map((job) => ({
      ...job,
      cost: generationCostEur(job.inputTokens, job.outputTokens),
    })),
  };
}
