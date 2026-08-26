import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SitePageView } from "@/components/site-renderer/site-renderer";
import { isReservedSlug } from "@/lib/validation/slug";
import { siteSpecSchema } from "@/lib/site-spec/schema";
import { getPublicSite } from "@/server/services/site";
import { recordPreviewVisit } from "@/server/services/analytics";
import { getSettings } from "@/server/services/settings";
import { getAdminUser } from "@/server/auth";
import { getFontPairing } from "@/lib/site-spec/variants";
import { prisma } from "@/server/db";

export const dynamic = "force-dynamic";

function pathFrom(segments?: string[]): string {
  if (!segments || segments.length === 0) return "/";
  return `/${segments.join("/")}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ siteSlug: string; pagePath?: string[] }>;
}): Promise<Metadata> {
  const { siteSlug } = await params;
  const site = await getPublicSite(siteSlug);
  const spec = site?.publishedVersion
    ? siteSpecSchema.safeParse(site.publishedVersion.siteSpec).data
    : null;
  return {
    title: spec?.seo.title ?? siteSlug,
    description: spec?.seo.description,
    robots: { index: false, follow: false },
    openGraph: {
      title: spec?.seo.title,
      description: spec?.seo.description,
    },
  };
}

export default async function PublicSitePage({
  params,
  searchParams,
}: {
  params: Promise<{ siteSlug: string; pagePath?: string[] }>;
  searchParams: Promise<{ preview?: string }>;
}) {
  const { siteSlug, pagePath } = await params;
  const query = await searchParams;
  if (isReservedSlug(siteSlug)) notFound();
  const site = await getPublicSite(siteSlug);
  if (!site) notFound();

  const admin = await getAdminUser();
  const resolved =
    query.preview === "1" && admin
      ? await prisma.siteVersion.findFirst({
          where: { siteId: site.id },
          orderBy: { versionNumber: "desc" },
        })
      : site.publishedVersion;
  if (!resolved) notFound();
  const spec = siteSpecSchema.parse(resolved.siteSpec);
  const path = pathFrom(pagePath);
  if (!spec.pages.some((page) => page.path === path)) notFound();

  const settings = await getSettings();
  const pairing = getFontPairing(spec.theme.fontPairingId);
  const headerList = await headers();
  const uaFamily = headerList.get("user-agent")?.split(" ")[0] ?? "unknown";
  const day = new Date().toISOString().slice(0, 10);
  const session = createHash("sha256")
    .update(`${uaFamily}:${day}:${process.env.PREVIEW_SESSION_SALT ?? "demo"}`)
    .digest("hex")
    .slice(0, 24);
  const referrer = headerList.get("referer");
  let referrerHost: string | null = null;
  try {
    referrerHost = referrer ? new URL(referrer).host : null;
  } catch {
    referrerHost = null;
  }
  await recordPreviewVisit({
    siteId: site.id,
    sessionHash: session,
    path,
    referrerHost,
    userAgentFamily: headerList.get("user-agent")?.split(" ")[0] ?? null,
  });

  const fontHref = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(pairing.googleHeading)}:ital,wght@0,400;0,600;1,400&family=${encodeURIComponent(pairing.googleBody)}:wght@400;500;600&display=swap`;

  return (
    <>
      <link rel="stylesheet" href={fontHref} />
      <style>{`:root{--site-heading:'${pairing.heading}',serif;--site-body:'${pairing.body}',sans-serif;} .font-heading{font-family:var(--site-heading);}`}</style>
      <SitePageView
        spec={spec}
        assets={site.company.assets
          .filter((asset) => asset.approved && !asset.excluded)
          .map((asset) => ({
            id: asset.id,
            publicUrl: asset.publicUrl,
            type: asset.type,
            storageKey: asset.storageKey,
          }))}
        slug={site.slug}
        path={path}
        demoMode={site.demoMode}
        showBadge={settings.demoBadgeEnabled}
      />
    </>
  );
}
