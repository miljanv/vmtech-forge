import Link from "next/link";
import { AnimatedNumber } from "@/components/admin/animated-number";
import { CostChart } from "@/components/admin/cost-chart";
import { getStudioAnalytics } from "@/server/services/analytics";
import { formatEur, formatGenerationCost } from "@/lib/ai/pricing";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const data = await getStudioAnalytics();
  const metrics = [
    { label: "Ukupni trošak", value: formatEur(data.totals.totalCost), numeric: false },
    { label: "Ovaj mesec", value: formatEur(data.totals.monthCost), numeric: false },
    { label: "Poslednjih 30 dana", value: formatEur(data.totals.last30Cost), numeric: false },
    { label: "Prosek po plaćenom jobu", value: formatEur(data.totals.averageCost), numeric: false },
    { label: "Ulazni tokeni", value: data.totals.inputTokens, numeric: true },
    { label: "Izlazni tokeni", value: data.totals.outputTokens, numeric: true },
    { label: "Uspešna generisanja", value: data.totals.succeeded, numeric: true },
    { label: "Potrošeno na neuspešne", value: formatEur(data.totals.failedCost), numeric: false },
  ];

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs tracking-[0.2em] text-primary uppercase">Studio</p>
        <h1 className="font-heading mt-2 text-4xl">Analitika</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Ukupna OpenAI potrošnja po tokenima. Procena: {formatGenerationCost(1_000_000, 0)} / 1M
          ulaznih i {formatGenerationCost(0, 1_000_000)} / 1M izlaznih tokena.
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-heading text-3xl">
                {metric.numeric ? <AnimatedNumber value={Number(metric.value)} /> : metric.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Trošak po danu</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <CostChart data={data.daily} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Operacije</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Svi poslovi</span>
              <span>{data.totals.jobs}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">U toku</span>
              <span>{data.totals.running}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">OpenAI</span>
              <span>{data.totals.openaiJobs}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Mock</span>
              <span>{data.totals.mockJobs}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Neuspešni poslovi</span>
              <span>{data.totals.failed}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Sajtovi spremni</span>
              <span>{data.readySites}</span>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Najskuplje firme</CardTitle>
          </CardHeader>
          <CardContent>
            {data.companies.length === 0 ? (
              <p className="text-sm text-muted-foreground">Još nema potrošnje.</p>
            ) : (
              <ul className="space-y-3 text-sm">
                {data.companies.map((company) => (
                  <li key={company.companyId} className="flex items-center justify-between gap-3">
                    <Link href={`/admin/companies/${company.companyId}`} className="hover:underline">
                      {company.companyName}
                    </Link>
                    <span className="text-muted-foreground">
                      {company.jobs} job · {formatEur(company.cost)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Poslednja generisanja</CardTitle>
          </CardHeader>
          <CardContent>
            {data.recent.length === 0 ? (
              <p className="text-sm text-muted-foreground">Još nema poslova.</p>
            ) : (
              <ul className="space-y-3 text-sm">
                {data.recent.map((job) => (
                  <li key={job.id} className="flex items-center justify-between gap-3">
                    <div>
                      <Link href={`/admin/companies/${job.companyId}`} className="font-medium hover:underline">
                        {job.companyName}
                      </Link>
                      <p className="text-muted-foreground">
                        {job.inputTokens}/{job.outputTokens} tokena · {formatEur(job.cost)}
                      </p>
                    </div>
                    <Badge variant="secondary">{job.status}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
