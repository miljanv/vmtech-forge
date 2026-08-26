import { prisma, hasDatabase } from "@/server/db";
import type { AdminUser } from "@/lib/auth/constants";

const DEFAULT_SETTINGS = {
  id: "default",
  defaultDealValueMinor: 12000,
  currency: "EUR",
  demoBadgeEnabled: true,
  similarityThreshold: 0.72,
  extractorModel: null as string | null,
  designerModel: null as string | null,
  tokenPricing: null as unknown,
  followUpBusinessDays: 3,
  maxCrawlPages: 12,
  showDemoBadgeAfterSale: false,
  updatedAt: new Date(0),
  updatedBy: null as string | null,
};

export async function getSettings() {
  if (!hasDatabase()) {
    return DEFAULT_SETTINGS;
  }
  return (
    (await prisma.appSettings.findUnique({ where: { id: "default" } })) ??
    (await prisma.appSettings.create({ data: { id: "default" } }))
  );
}

export async function updateSettings(
  data: {
    defaultDealValueMinor?: number;
    similarityThreshold?: number;
    followUpBusinessDays?: number;
    demoBadgeEnabled?: boolean;
    showDemoBadgeAfterSale?: boolean;
    extractorModel?: string | null;
    designerModel?: string | null;
  },
  admin: AdminUser,
) {
  return prisma.appSettings.upsert({
    where: { id: "default" },
    update: { ...data, updatedBy: admin.id },
    create: { id: "default", ...data, updatedBy: admin.id },
  });
}
