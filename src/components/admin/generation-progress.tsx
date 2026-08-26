"use client";

import { useQuery } from "@tanstack/react-query";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

type Step = {
  key: string;
  label: string;
  description: string;
  status: string;
  progress: number;
  error: string | null;
  startedAt: string | null;
  completedAt: string | null;
  attempt: number;
};

type Job = {
  id: string;
  status: string;
  progress: number;
  error: string | null;
  retryCount: number;
  steps: Step[];
};

export function GenerationProgress({ companyId }: { companyId: string }) {
  const query = useQuery({
    queryKey: ["generation", companyId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/jobs/${companyId}`);
      return (await response.json()) as { job: Job | null };
    },
    refetchInterval: (state) =>
      state.state.data?.job?.status === "RUNNING" ||
      state.state.data?.job?.status === "QUEUED"
        ? 1500
        : false,
  });
  const job = query.data?.job;
  if (!job) {
    return <p className="text-sm text-muted-foreground">Nema aktivnog generisanja.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Badge>{job.status}</Badge>
        <span className="text-sm text-muted-foreground">{job.progress}%</span>
      </div>
      <Progress value={job.progress} />
      <ol className="space-y-3">
        {job.steps.map((step) => (
          <li key={step.key} className="rounded-xl border p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="font-medium">{step.label}</p>
              <span className="text-xs text-muted-foreground">{step.status}</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
            {step.error ? <p className="mt-2 text-sm text-destructive">{step.error}</p> : null}
          </li>
        ))}
      </ol>
    </div>
  );
}
