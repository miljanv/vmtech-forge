import Link from "next/link";
import { AnimatedNumber } from "@/components/admin/animated-number";
import { PipelineChart } from "@/components/admin/pipeline-chart";
import { SALES_STATUS_LABELS } from "@/lib/sales/status";
import { getDashboardData } from "@/server/services/analytics";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const data = await getDashboardData();
  const metrics = [
    { label: "Napravljeni sajtovi", value: data.totals.sites },
    { label: "Spremni za kontakt", value: data.totals.ready },
    { label: "Poslati mejlovi", value: data.totals.emailed },
    { label: "Dobijeni odgovori", value: data.totals.replied },
    { label: "Aktivni pregovori", value: data.totals.negotiation },
    { label: "Završene prodaje", value: data.totals.won },
    { label: "Odbijene ponude", value: data.totals.lost },
    { label: "Generisanja u toku", value: data.totals.activeGenerations },
  ];
  const chartData = Object.entries(data.byStatus).map(([status, count]) => ({
    name: SALES_STATUS_LABELS[status as keyof typeof SALES_STATUS_LABELS],
    count,
  }));

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs tracking-[0.2em] text-primary uppercase">Pregled</p>
          <h1 className="font-heading mt-2 text-4xl md:text-5xl">Kontrolna tabla</h1>
        </div>
        <Button render={<Link href="/admin/companies/new" />}>Nova firma</Button>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.label} className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-heading text-3xl">
                <AnimatedNumber value={metric.value} />
              </p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Prodajni tok</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <PipelineChart data={chartData} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Konverzije</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex gap-6">
              <div>
                <p className="text-muted-foreground">Odgovori</p>
                <p className="font-heading text-2xl">{data.totals.replyRate}%</p>
              </div>
              <div>
                <p className="text-muted-foreground">Uspešne prodaje</p>
                <p className="font-heading text-2xl">{data.totals.winRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sledeći follow-up zadaci</CardTitle>
          </CardHeader>
          <CardContent>
            {data.followUps.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nema zakazanih zadataka.</p>
            ) : (
              <ul className="space-y-3">
                {data.followUps.map((item) => (
                  <li key={item.id} className="flex items-center justify-between text-sm">
                    <Link href={`/admin/companies/${item.companyId}`} className="hover:underline">
                      {item.company.name ?? item.company.slug}
                    </Link>
                    <span className="text-muted-foreground">
                      {item.dueAt.toLocaleDateString("sr-Latn")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Poslednje aktivnosti</CardTitle>
          </CardHeader>
          <CardContent>
            {data.activities.length === 0 ? (
              <p className="text-sm text-muted-foreground">Još nema aktivnosti.</p>
            ) : (
              <ul className="space-y-3">
                {data.activities.map((item) => (
                  <li key={item.id} className="text-sm">
                    <Link href={`/admin/companies/${item.companyId}`} className="font-medium hover:underline">
                      {item.company.name ?? item.company.slug}
                    </Link>
                    <p className="text-muted-foreground">{item.message}</p>
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
