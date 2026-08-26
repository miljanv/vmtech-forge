import { prisma } from "@/server/db";
import { NotFoundError } from "@/lib/errors";
import type { AdminUser } from "@/lib/auth/constants";
import type { Prisma } from "@/generated/prisma";
import type { SiteSpec } from "@/lib/site-spec/schema";
import { fingerprintFromSpec } from "@/lib/site-spec/fingerprint";
import { validateSiteSpec } from "@/lib/site-spec/validate";

export async function publishVersion(
  versionId: string,
  admin: AdminUser,
) {
  const version = await prisma.siteVersion.findUnique({
    where: { id: versionId },
    include: { site: true },
  });
  if (!version) throw new NotFoundError("Verzija sajta nije pronađena.");

  await prisma.$transaction([
    prisma.siteVersion.updateMany({
      where: { siteId: version.siteId, status: "PUBLISHED" },
      data: { status: "ARCHIVED" },
    }),
    prisma.siteVersion.update({
      where: { id: versionId },
      data: { status: "PUBLISHED", publishedAt: new Date() },
    }),
    prisma.site.update({
      where: { id: version.siteId },
      data: { publishedVersionId: versionId },
    }),
    prisma.salesActivity.create({
      data: {
        companyId: version.site.companyId,
        type: "VERSION_PUBLISHED",
        message: `Objavljena je verzija ${version.versionNumber}.`,
        createdBy: admin.id,
      },
    }),
  ]);
}

export async function restoreVersion(
  versionId: string,
  admin: AdminUser,
) {
  const version = await prisma.siteVersion.findUnique({
    where: { id: versionId },
    include: { site: { include: { company: { include: { assets: true } } } } },
  });
  if (!version) throw new NotFoundError("Verzija sajta nije pronađena.");
  const spec = validateSiteSpec(version.siteSpec, {
    allowedAssetIds: new Set(version.site.company.assets.map((asset) => asset.id)),
  });
  const last = await prisma.siteVersion.findFirst({
    where: { siteId: version.siteId },
    orderBy: { versionNumber: "desc" },
  });
  const restored = await prisma.siteVersion.create({
    data: {
      siteId: version.siteId,
      versionNumber: (last?.versionNumber ?? 0) + 1,
      status: "DRAFT",
      siteSpec: spec as unknown as Prisma.InputJsonValue,
      designFingerprint: fingerprintFromSpec(spec) as unknown as Prisma.InputJsonValue,
      createdBy: admin.id,
    },
  });
  await prisma.salesActivity.create({
    data: {
      companyId: version.site.companyId,
      type: "VERSION_RESTORED",
      message: `Vraćena je verzija ${version.versionNumber} kao nova skica.`,
      createdBy: admin.id,
    },
  });
  return restored;
}

export async function saveEditedSpec(options: {
  siteId: string;
  spec: SiteSpec;
  admin: AdminUser;
}) {
  const site = await prisma.site.findUnique({
    where: { id: options.siteId },
    include: { company: { include: { assets: true } } },
  });
  if (!site) throw new NotFoundError("Sajt nije pronađen.");
  const spec = validateSiteSpec(options.spec, {
    allowedAssetIds: new Set(site.company.assets.map((asset) => asset.id)),
  });
  const last = await prisma.siteVersion.findFirst({
    where: { siteId: site.id },
    orderBy: { versionNumber: "desc" },
  });
  return prisma.siteVersion.create({
    data: {
      siteId: site.id,
      versionNumber: (last?.versionNumber ?? 0) + 1,
      status: "DRAFT",
      siteSpec: spec as unknown as Prisma.InputJsonValue,
      designFingerprint: fingerprintFromSpec(spec) as unknown as Prisma.InputJsonValue,
      createdBy: options.admin.id,
    },
  });
}

export async function getPublicSite(slug: string) {
  return prisma.site.findUnique({
    where: { slug },
    include: {
      company: { include: { assets: true } },
      publishedVersion: true,
    },
  });
}
