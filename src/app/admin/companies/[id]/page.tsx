import { CompanyDetail } from "@/components/admin/company-detail";
import { getCompany } from "@/server/services/company";
import { getPreviewStats } from "@/server/services/analytics";
import { siteSpecSchema } from "@/lib/site-spec/schema";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export default async function CompanyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const company = await getCompany(id);
  const stats = company.site ? await getPreviewStats(company.site.id) : null;
  const latestSpec = company.site?.versions[0]
    ? (siteSpecSchema.safeParse(company.site.versions[0].siteSpec).data ?? null)
    : null;
  return (
    <div className="space-y-4">
      {stats ? (
        <p className="text-sm text-muted-foreground">
          Pregledi: {stats.views} · Jedinstvene sesije: {stats.uniqueSessions}
          {stats.lastViewedAt
            ? ` · Poslednji pregled: ${stats.lastViewedAt.toLocaleString("sr-Latn")}`
            : ""}
        </p>
      ) : null}
      <CompanyDetail
        company={{
          id: company.id,
          name: company.name,
          slug: company.slug,
          salesStatus: company.salesStatus,
          generationStatus: company.generationStatus,
          dealValueMinor: company.dealValueMinor,
          currency: company.currency,
          contactName: company.contactName,
          contactEmail: company.contactEmail,
          contactPhone: company.contactPhone,
          notes: company.notes,
          lastContactAt: company.lastContactAt?.toISOString() ?? null,
          nextFollowUpAt: company.nextFollowUpAt?.toISOString() ?? null,
          latestSpec,
          sources: company.sources.map((source) => ({
            id: source.id,
            url: source.url,
            crawlStatus: source.crawlStatus,
            pageTitle: source.pageTitle,
          })),
          facts: company.facts.map((fact) => ({
            id: fact.id,
            key: fact.key,
            value: fact.value,
            sourceUrl: fact.sourceUrl,
          })),
          assets: company.assets.map((asset) => ({
            id: asset.id,
            publicUrl: asset.publicUrl,
            storageKey: asset.storageKey,
            type: asset.type,
            approved: asset.approved,
          })),
          site: company.site
            ? {
                id: company.site.id,
                demoMode: company.site.demoMode,
                versions: company.site.versions.map((version) => ({
                  id: version.id,
                  versionNumber: version.versionNumber,
                  status: version.status,
                  similarityScore: version.similarityScore,
                  createdAt: version.createdAt.toISOString(),
                })),
              }
            : null,
          activities: company.activities.map((activity) => ({
            id: activity.id,
            message: activity.message,
            createdAt: activity.createdAt.toISOString(),
            type: activity.type,
          })),
          emailDrafts: company.emailDrafts.map((draft) => ({
            id: draft.id,
            subject: draft.subject,
            body: draft.body,
          })),
          generationJobs: company.generationJobs.map((job) => ({
            id: job.id,
            provider: job.provider,
            inputTokens: job.inputTokens,
            outputTokens: job.outputTokens,
            error: job.error,
          })),
        }}
      />
    </div>
  );
}
