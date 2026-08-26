import Link from "next/link";
import { listCompanies } from "@/server/services/company";
import { SALES_STATUS_LABELS } from "@/lib/sales/status";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const companies = await listCompanies({ query: q });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs tracking-[0.2em] text-primary uppercase">Portfolio</p>
          <h1 className="font-heading mt-2 text-4xl">Firme i sajtovi</h1>
        </div>
        <Button render={<Link href="/admin/companies/new" />}>Dodaj firmu</Button>
      </header>
      {companies.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border p-12 text-center">
          <h2 className="font-heading text-2xl">Još nema firmi</h2>
          <p className="mt-2 text-muted-foreground">
            Dodajte srpskog proizvođača, prikupite javne izvore i napravite predlog sajta.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Firma</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Generisanje</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((company) => (
                <tr key={company.id} className="border-t">
                  <td className="px-4 py-3">
                    <Link href={`/admin/companies/${company.id}`} className="font-medium hover:underline">
                      {company.name ?? "Bez imena"}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{company.slug}</td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary">{SALES_STATUS_LABELS[company.salesStatus]}</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{company.generationStatus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
