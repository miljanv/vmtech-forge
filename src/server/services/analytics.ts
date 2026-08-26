import { prisma, hasDatabase } from "@/server/db";
import { SALES_STATUSES } from "@/lib/sales/status";

export async function getDashboardData() {
  if (!hasDatabase()) {
    const byStatus = Object.fromEntries(
      SALES_STATUSES.map((status) => [status, 0]),
    ) as Record<(typeof SALES_STATUSES)[number], number>;
    return {
      totals: {
        sites: 0,
        ready: 0,
        emailed: 0,
        replied: 0,
        negotiation: 0,
        won: 0,
        lost: 0,
        replyRate: 0,
        winRate: 0,
        wonValue: 0,
        pipelineValue: 0,
        activeGenerations: 0,
        previewVisits: 0,
      },
      byStatus,
      jobs: [],
      followUps: [],
      activities: [],
    };
  }
  const [companies, jobs, followUps, activities, visits] = await Promise.all([
    prisma.company.findMany({ where: { archivedAt: null } }),
    prisma.generationJob.findMany({
      where: { status: { in: ["QUEUED", "RUNNING"] } },
      include: { company: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.followUp.findMany({
      where: { status: "SCHEDULED" },
      include: { company: true },
      orderBy: { dueAt: "asc" },
      take: 8,
    }),
    prisma.salesActivity.findMany({
      include: { company: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.previewVisit.groupBy({
      by: ["siteId"],
      _count: { id: true },
    }),
  ]);

  const byStatus = Object.fromEntries(
    SALES_STATUSES.map((status) => [
      status,
      companies.filter((company) => company.salesStatus === status).length,
    ]),
  ) as Record<(typeof SALES_STATUSES)[number], number>;

  const emailed = byStatus.EMAIL_SENT + byStatus.FOLLOW_UP + byStatus.REPLIED + byStatus.NEGOTIATION + byStatus.WON + byStatus.LOST;
  const replied = byStatus.REPLIED + byStatus.NEGOTIATION + byStatus.WON;
  const won = byStatus.WON;
  const lost = byStatus.LOST;
  const pipelineValue = companies
    .filter((company) =>
      ["READY_TO_CONTACT", "EMAIL_SENT", "FOLLOW_UP", "REPLIED", "NEGOTIATION"].includes(
        company.salesStatus,
      ),
    )
    .reduce((sum, company) => sum + company.dealValueMinor, 0);
  const wonValue = companies
    .filter((company) => company.salesStatus === "WON")
    .reduce((sum, company) => sum + company.dealValueMinor, 0);

  return {
    totals: {
      sites: companies.filter((company) => company.generationStatus === "SUCCEEDED").length,
      ready: byStatus.READY_TO_CONTACT,
      emailed,
      replied,
      negotiation: byStatus.NEGOTIATION,
      won,
      lost,
      replyRate: emailed === 0 ? 0 : Math.round((replied / emailed) * 100),
      winRate: won + lost === 0 ? 0 : Math.round((won / (won + lost)) * 100),
      wonValue,
      pipelineValue,
      activeGenerations: jobs.length,
      previewVisits: visits.reduce((sum, item) => sum + item._count.id, 0),
    },
    byStatus,
    jobs,
    followUps,
    activities,
  };
}

export async function recordPreviewVisit(options: {
  siteId: string;
  sessionHash: string;
  path: string;
  referrerHost: string | null;
  userAgentFamily: string | null;
}) {
  if (!hasDatabase()) return;
  await prisma.previewVisit.create({
    data: options,
  });
}

export async function getPreviewStats(siteId: string) {
  if (!hasDatabase()) {
    return {
      views: 0,
      uniqueSessions: 0,
      lastViewedAt: null,
      referrers: [] as (string | null)[],
    };
  }
  const visits = await prisma.previewVisit.findMany({
    where: { siteId },
    orderBy: { viewedAt: "desc" },
  });
  const unique = new Set(visits.map((visit) => visit.sessionHash)).size;
  return {
    views: visits.length,
    uniqueSessions: unique,
    lastViewedAt: visits[0]?.viewedAt ?? null,
    referrers: [...new Set(visits.map((visit) => visit.referrerHost).filter(Boolean))],
  };
}
