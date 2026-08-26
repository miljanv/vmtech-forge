import { prisma, hasDatabase } from "@/server/db";
import { NotFoundError, AppError } from "@/lib/errors";
import {
  canTransition,
  type SalesStatus,
} from "@/lib/sales/status";
import { defaultFollowUpDate } from "@/lib/sales/follow-up";
import type { AdminUser } from "@/lib/auth/constants";

export async function updateSalesStatus(options: {
  companyId: string;
  to: SalesStatus;
  admin: AdminUser;
  force?: boolean;
  message?: string;
}) {
  const company = await prisma.company.findUnique({
    where: { id: options.companyId },
  });
  if (!company) throw new NotFoundError("Firma nije pronađena.");
  if (!canTransition(company.salesStatus, options.to, options.force)) {
    throw new AppError({
      code: "INVALID_TRANSITION",
      message: "Invalid sales transition",
      userMessage: "Ova promena statusa nije dozvoljena.",
    });
  }

  await prisma.$transaction([
    prisma.company.update({
      where: { id: options.companyId },
      data: {
        salesStatus: options.to,
        lastContactAt:
          options.to === "EMAIL_SENT" || options.to === "REPLIED"
            ? new Date()
            : company.lastContactAt,
        archivedAt: options.to === "ARCHIVED" ? new Date() : company.archivedAt,
        updatedBy: options.admin.id,
      },
    }),
    prisma.salesActivity.create({
      data: {
        companyId: options.companyId,
        type: "STATUS_CHANGE",
        fromStatus: company.salesStatus,
        toStatus: options.to,
        message: options.message ?? "Status prodaje je promenjen.",
        createdBy: options.admin.id,
      },
    }),
  ]);
}

export async function addNote(
  companyId: string,
  message: string,
  admin: AdminUser,
) {
  await prisma.salesActivity.create({
    data: {
      companyId,
      type: "NOTE",
      message,
      createdBy: admin.id,
    },
  });
}

export async function scheduleFollowUp(options: {
  companyId: string;
  dueAt?: Date;
  note?: string;
  admin: AdminUser;
  businessDays?: number;
}) {
  const dueAt =
    options.dueAt ?? defaultFollowUpDate(new Date(), options.businessDays ?? 3);
  const followUp = await prisma.followUp.create({
    data: {
      companyId: options.companyId,
      dueAt,
      note: options.note,
      createdBy: options.admin.id,
    },
  });
  await prisma.company.update({
    where: { id: options.companyId },
    data: { nextFollowUpAt: dueAt },
  });
  await prisma.salesActivity.create({
    data: {
      companyId: options.companyId,
      type: "FOLLOW_UP_SCHEDULED",
      message: `Follow-up zakazan za ${dueAt.toLocaleDateString("sr-Latn")}.`,
      createdBy: options.admin.id,
    },
  });
  return followUp;
}

export async function getPipeline() {
  if (!hasDatabase()) {
    return { companies: [], counts: {} as Record<string, number> };
  }
  const companies = await prisma.company.findMany({
    where: { archivedAt: null },
    include: { site: true },
    orderBy: { updatedAt: "desc" },
  });
  const counts = companies.reduce<Record<string, number>>((acc, company) => {
    acc[company.salesStatus] = (acc[company.salesStatus] ?? 0) + 1;
    return acc;
  }, {});
  return { companies, counts };
}
