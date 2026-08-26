"use client";

import Link from "next/link";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GenerationProgress } from "@/components/admin/generation-progress";
import { PreviewToolbar } from "@/components/admin/preview-toolbar";
import { SalesEmailPanel } from "@/components/admin/sales-email-panel";
import { SALES_STATUS_LABELS, SALES_STATUSES, type SalesStatus } from "@/lib/sales/status";
import {
  addNoteAction,
  archiveCompanyAction,
  publishVersionAction,
  restoreVersionAction,
  scheduleFollowUpAction,
  startGenerationAction,
  updateStatusAction,
} from "@/server/actions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SiteEditor } from "@/components/admin/site-editor";
import { formatGenerationCost } from "@/lib/ai/pricing";
import { publicAssetUrl } from "@/lib/assets/public-url";
import type { SiteSpec } from "@/lib/site-spec/schema";

type CompanyDetail = {
  id: string;
  name: string | null;
  slug: string;
  salesStatus: SalesStatus;
  generationStatus: string;
  dealValueMinor: number;
  currency: string;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  notes: string | null;
  lastContactAt: string | null;
  nextFollowUpAt: string | null;
  sources: Array<{ id: string; url: string; crawlStatus: string; pageTitle: string | null }>;
  facts: Array<{ id: string; key: string; value: unknown; sourceUrl: string | null }>;
  assets: Array<{
    id: string;
    publicUrl: string;
    storageKey?: string | null;
    type: string;
    approved: boolean;
  }>;
  site: {
    id: string;
    demoMode: boolean;
    versions: Array<{
      id: string;
      versionNumber: number;
      status: string;
      similarityScore: number | null;
      createdAt: string;
    }>;
  } | null;
  activities: Array<{ id: string; message: string; createdAt: string; type: string }>;
  emailDrafts: Array<{ id: string; subject: string; body: string }>;
  generationJobs: Array<{
    id: string;
    provider?: string;
    inputTokens: number;
    outputTokens: number;
    error: string | null;
  }>;
  latestSpec: SiteSpec | null;
};

export function CompanyDetail({ company }: { company: CompanyDetail }) {
  const latestEmail = company.emailDrafts[0];

  async function run(label: string, fn: () => Promise<{ ok: boolean; error?: string }>) {
    const result = await fn();
    if (!result.ok) toast.error(result.error);
    else toast.success(label);
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs tracking-[0.2em] text-primary uppercase">{company.slug}</p>
          <h1 className="font-heading mt-2 text-4xl">{company.name ?? "Bez imena"}</h1>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge>{SALES_STATUS_LABELS[company.salesStatus]}</Badge>
            <Badge variant="secondary">{company.generationStatus}</Badge>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => {
              if (
                !window.confirm(
                  "Pokrenuti generisanje ispočetka? Proći će ceo tok: crawl, činjenice, slike, dizajn i novi sajt.",
                )
              ) {
                return;
              }
              void run("Generisanje je pokrenuto ispočetka.", () =>
                startGenerationAction(company.id),
              );
            }}
          >
            Regeneriši od početka
          </Button>
          <Button variant="outline" render={<Link href={`/${company.slug}`} target="_blank" />}>
            Pregledaj sajt
          </Button>
          <Button
            variant="outline"
            onClick={async () => {
              await navigator.clipboard.writeText(`${window.location.origin}/${company.slug}`);
              toast.success("Preview link je kopiran.");
            }}
          >
            Kopiraj preview link
          </Button>
        </div>
      </header>

      <Tabs defaultValue="pregled">
        <TabsList variant="line" className="flex-wrap">
          {[
            ["pregled", "Pregled"],
            ["izvori", "Izvori"],
            ["sadrzaj", "Sadržaj"],
            ["materijali", "Materijali"],
            ["dizajn", "Dizajn"],
            ["preview", "Preview"],
            ["verzije", "Verzije"],
            ["prodaja", "Prodaja"],
            ["aktivnost", "Aktivnost"],
          ].map(([value, label]) => (
            <TabsTrigger key={value} value={value}>
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="pregled" className="space-y-4 pt-4">
          <p>Kontakt: {company.contactName ?? "—"} · {company.contactEmail ?? "—"} · {company.contactPhone ?? "—"}</p>
          <p>Poslednji kontakt: {company.lastContactAt ?? "—"}</p>
          <p>Sledeći follow-up: {company.nextFollowUpAt ?? "—"}</p>
          <p>Preview: /{company.slug}</p>
          {company.generationJobs[0] ? (
            <div className="rounded-2xl border bg-card px-4 py-3 text-sm">
              <p>
                Poslednje generisanje
                {company.generationJobs[0].provider
                  ? ` (${company.generationJobs[0].provider})`
                  : ""}
                : {company.generationJobs[0].inputTokens} ulaznih /{" "}
                {company.generationJobs[0].outputTokens} izlaznih tokena ·{" "}
                <strong>
                  {formatGenerationCost(
                    company.generationJobs[0].inputTokens,
                    company.generationJobs[0].outputTokens,
                  )}
                </strong>
              </p>
              {company.generationJobs[0].provider === "OPENAI" &&
              company.generationJobs[0].inputTokens === 0 &&
              company.generationJobs[0].outputTokens === 0 ? (
                <p className="mt-2 text-destructive">
                  OpenAI ključ je viđen, ali API nije naplaćen. Proveri da ključ pripada
                  istom OpenAI projektu kao dashboard, ili da Vercel nije prekinuo poziv.
                </p>
              ) : null}
              {company.generationJobs[0].error ? (
                <p className="mt-2 text-destructive">{company.generationJobs[0].error}</p>
              ) : null}
            </div>
          ) : null}
          <GenerationProgress companyId={company.id} />
        </TabsContent>

        <TabsContent value="izvori" className="space-y-3 pt-4">
          {company.sources.map((source) => (
            <div key={source.id} className="rounded-xl border p-3 text-sm">
              <a href={source.url} className="underline" target="_blank" rel="noreferrer">
                {source.url}
              </a>
              <p className="text-muted-foreground">{source.crawlStatus} · {source.pageTitle ?? "bez naslova"}</p>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="sadrzaj" className="space-y-3 pt-4">
          {company.facts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Činjenice će se pojaviti nakon generisanja.</p>
          ) : (
            company.facts.map((fact) => (
              <div key={fact.id} className="rounded-xl border p-3 text-sm">
                <p className="font-medium">{fact.key}</p>
                <pre className="mt-2 overflow-auto text-xs">{JSON.stringify(fact.value, null, 2)}</pre>
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="materijali" className="grid gap-3 pt-4 sm:grid-cols-3">
          {company.assets.map((asset) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={asset.id}
              src={publicAssetUrl(asset)}
              alt={asset.type}
              className="rounded-xl border object-cover"
            />
          ))}
        </TabsContent>

        <TabsContent value="dizajn" className="space-y-4 pt-4 text-sm">
          <p className="text-muted-foreground">
            Izmenite redosled, vidljivost i varijante. Svaka izmena pravi novu immutable verziju.
          </p>
          {company.site && company.latestSpec ? (
            <SiteEditor companyId={company.id} siteId={company.site.id} spec={company.latestSpec} />
          ) : (
            <p className="text-muted-foreground">Dizajn će biti dostupan nakon prvog generisanja.</p>
          )}
          {company.generationJobs[0]?.error ? (
            <p className="mt-3 text-destructive">{company.generationJobs[0].error}</p>
          ) : null}
        </TabsContent>

        <TabsContent value="preview" className="pt-4">
          <PreviewToolbar slug={company.slug} />
        </TabsContent>

        <TabsContent value="verzije" className="space-y-3 pt-4">
          {company.site?.versions.map((version) => (
            <div key={version.id} className="flex items-center justify-between rounded-xl border p-3 text-sm">
              <div>
                Verzija {version.versionNumber} · {version.status}
                {version.similarityScore != null ? ` · sličnost ${Math.round(version.similarityScore * 100)}%` : ""}
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => publishVersionAction(version.id)}>
                  Objavi
                </Button>
                <Button size="sm" variant="outline" onClick={() => restoreVersionAction(version.id)}>
                  Vrati
                </Button>
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="prodaja" className="space-y-6 pt-4">
          <div className="flex flex-wrap items-center gap-3">
            <Select
              value={company.salesStatus}
              onValueChange={(value) => {
                if (typeof value === "string") {
                  void updateStatusAction(company.id, value as SalesStatus);
                }
              }}
            >
              <SelectTrigger className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SALES_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {SALES_STATUS_LABELS[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => scheduleFollowUpAction(company.id)}>
              Zakaži follow-up
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const message = window.prompt("Beleška");
                if (message) void addNoteAction(company.id, message);
              }}
            >
              Dodaj belešku
            </Button>
            <Button variant="destructive" onClick={() => archiveCompanyAction(company.id)}>
              Arhiviraj firmu
            </Button>
          </div>
          <SalesEmailPanel
            companyId={company.id}
            initialSubject={latestEmail?.subject}
            initialBody={latestEmail?.body}
            draftId={latestEmail?.id}
            contactEmail={company.contactEmail}
          />
        </TabsContent>

        <TabsContent value="aktivnost" className="space-y-3 pt-4">
          {company.activities.map((activity) => (
            <div key={activity.id} className="border-l-2 border-primary/40 pl-3 text-sm">
              <p>{activity.message}</p>
              <p className="text-muted-foreground">{activity.createdAt}</p>
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
