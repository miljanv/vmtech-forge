import { prisma, hasDatabase } from "@/server/db";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatGenerationCost } from "@/lib/ai/pricing";

export const dynamic = "force-dynamic";

export default async function GenerationsPage() {
  const jobs = hasDatabase()
    ? await prisma.generationJob.findMany({
        include: { company: true, steps: true },
        orderBy: { createdAt: "desc" },
        take: 50,
      })
    : [];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs tracking-[0.2em] text-primary uppercase">Radni red</p>
        <h1 className="font-heading mt-2 text-4xl">Generisanja</h1>
      </div>
      {jobs.length === 0 ? (
        <p className="text-muted-foreground">Još nema poslova generisanja.</p>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <Link
              key={job.id}
              href={`/admin/companies/${job.companyId}`}
              className="block rounded-2xl border p-4 hover:bg-muted/30"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium">{job.company.name ?? job.company.slug}</p>
                <Badge>{job.status}</Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {job.progress}% · {job.currentStep} · {job.inputTokens}/{job.outputTokens} tokena ·{" "}
                {formatGenerationCost(job.inputTokens, job.outputTokens)}
              </p>
              {job.error ? (
                <p className="mt-2 text-sm text-destructive">{job.error}</p>
              ) : null}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
