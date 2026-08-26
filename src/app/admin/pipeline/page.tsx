import { getPipeline } from "@/server/services/sales";
import { PipelineBoard } from "@/components/admin/pipeline-board";
import { SALES_STATUS_LABELS } from "@/lib/sales/status";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function PipelinePage() {
  const { companies, counts } = await getPipeline();
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs tracking-[0.2em] text-primary uppercase">Prodaja</p>
        <h1 className="font-heading mt-2 text-4xl">Prodajni proces</h1>
      </div>
      <div className="flex flex-wrap gap-3 text-sm">
        {Object.entries(counts).map(([status, count]) => (
          <span key={status} className="rounded-full bg-muted px-3 py-1">
            {SALES_STATUS_LABELS[status as keyof typeof SALES_STATUS_LABELS]}: {count}
          </span>
        ))}
      </div>
      <PipelineBoard
        companies={companies.map((company) => ({
          id: company.id,
          name: company.name,
          slug: company.slug,
          salesStatus: company.salesStatus,
          dealValueMinor: company.dealValueMinor,
          contactName: company.contactName,
          contactEmail: company.contactEmail,
        }))}
      />
      <div className="overflow-hidden rounded-2xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left">
            <tr>
              <th className="px-3 py-2">Firma</th>
              <th className="px-3 py-2">Kontakt</th>
              <th className="px-3 py-2">Follow-up</th>
            </tr>
          </thead>
          <tbody>
            {companies.map((company) => (
              <tr key={company.id} className="border-t">
                <td className="px-3 py-2">
                  <Link href={`/admin/companies/${company.id}`}>{company.name ?? company.slug}</Link>
                </td>
                <td className="px-3 py-2">{company.contactEmail ?? company.contactPhone ?? "—"}</td>
                <td className="px-3 py-2">
                  {company.nextFollowUpAt?.toLocaleDateString("sr-Latn") ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
