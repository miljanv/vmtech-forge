import { prisma } from "@/server/db";
import type { AdminUser } from "@/lib/auth/constants";

export async function getSettings() {
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
