import { nanoid } from "nanoid";
import type { Prisma } from "@/generated/prisma";
import { GENERATION_STEPS } from "@/lib/generation/steps";
import { detectSourceType, type CompanyWizardInput } from "@/lib/validation/company";
import { validateSlug } from "@/lib/validation/slug";
import { AppError, NotFoundError } from "@/lib/errors";
import { prisma, hasDatabase } from "@/server/db";
import { dispatchGeneration } from "@/server/generation/dispatch";
import type { AdminUser } from "@/lib/auth/constants";
import { getEnv } from "@/lib/env";

export async function listCompanies(options: {
  query?: string;
  includeArchived?: boolean;
}) {
  if (!hasDatabase()) return [];
  return prisma.company.findMany({
    where: {
      archivedAt: options.includeArchived ? undefined : null,
      OR: options.query
        ? [
            { name: { contains: options.query, mode: "insensitive" } },
            { slug: { contains: options.query, mode: "insensitive" } },
            { contactEmail: { contains: options.query, mode: "insensitive" } },
            { contactName: { contains: options.query, mode: "insensitive" } },
            { sources: { some: { url: { contains: options.query, mode: "insensitive" } } } },
          ]
        : undefined,
    },
    include: {
      site: true,
      sources: true,
      generationJobs: {
        take: 1,
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getCompany(id: string) {
  if (!hasDatabase()) {
    throw new NotFoundError("Firma nije pronađena.");
  }
  const company = await prisma.company.findUnique({
    where: { id },
    include: {
      contacts: true,
      sources: true,
      facts: true,
      assets: { orderBy: { createdAt: "desc" } },
      site: {
        include: {
          versions: { orderBy: { versionNumber: "desc" } },
          visits: { take: 1, orderBy: { viewedAt: "desc" } },
        },
      },
      generationJobs: {
        orderBy: { createdAt: "desc" },
        include: { steps: { orderBy: { createdAt: "asc" } } },
      },
      activities: { orderBy: { createdAt: "desc" }, take: 50 },
      followUps: { orderBy: { dueAt: "asc" } },
      emailDrafts: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!company) {
    throw new NotFoundError("Firma nije pronađena.");
  }
  return company;
}

export async function createCompanyFromWizard(
  input: CompanyWizardInput,
  admin: AdminUser,
) {
  const slug = validateSlug(input.slug);
  if (!slug.ok) {
    throw new AppError({
      code: "INVALID_SLUG",
      message: slug.error ?? "Invalid slug",
      userMessage: slug.error ?? "Slug nije validan.",
    });
  }

  const existing = await prisma.company.findUnique({ where: { slug: slug.slug } });
  if (existing) {
    throw new AppError({
      code: "SLUG_TAKEN",
      message: "Slug taken",
      userMessage: "Ovaj slug je već zauzet.",
    });
  }

  const urls = [
    ...input.sourceUrls,
    input.instagramUrl,
    input.facebookUrl,
    input.googleMapsUrl,
    input.marketplaceUrl,
  ].filter((url): url is string => Boolean(url));

  const settings = await prisma.appSettings.findUnique({ where: { id: "default" } });
  const env = getEnv();

  const company = await prisma.$transaction(async (tx) => {
    const created = await tx.company.create({
      data: {
        name: input.name || null,
        slug: slug.slug,
        contactName: input.contactName || null,
        contactEmail: input.contactEmail || null,
        contactPhone: input.contactPhone || null,
        notes: input.notes || null,
        dealValueMinor: input.dealValueMinor ?? 12000,
        preferredLanguage: input.preferredLanguage,
        preferredCta: input.preferredCta || null,
        designNotes: input.designNotes || null,
        contentNotes: input.contentNotes || null,
        salesStatus: "RESEARCHING",
        generationStatus: input.generateImmediately ? "QUEUED" : "IDLE",
        createdBy: admin.id,
        updatedBy: admin.id,
        contacts: input.contactName
          ? {
              create: {
                name: input.contactName,
                email: input.contactEmail || null,
                phone: input.contactPhone || null,
                isPrimary: true,
              },
            }
          : undefined,
        sources: {
          create: urls.map((url) => ({
            url,
            sourceType: detectSourceType(url),
          })),
        },
        site: {
          create: {
            slug: slug.slug,
            visibility: "UNLISTED",
            demoMode: true,
          },
        },
        activities: {
          create: {
            type: "COMPANY_CREATED",
            message: "Firma je dodata u StudioForge.",
            createdBy: admin.id,
          },
        },
      },
    });

    if (!input.generateImmediately) {
      return created;
    }

    const job = await tx.generationJob.create({
      data: {
        companyId: created.id,
        provider: env.openaiEnabled ? "OPENAI" : "MOCK",
        extractorModel:
          settings?.extractorModel || env.OPENAI_MODEL_EXTRACTOR,
        designerModel: settings?.designerModel || env.OPENAI_MODEL_DESIGNER,
        idempotencyKey: `gen_${created.id}_${nanoid()}`,
        createdBy: admin.id,
        steps: {
          create: GENERATION_STEPS.map((step) => ({
            key: step.key,
            label: step.label,
            description: step.description,
          })),
        },
      },
    });

    await tx.salesActivity.create({
      data: {
        companyId: created.id,
        type: "GENERATION_STARTED",
        message: "Pokrenuto je generisanje sajta.",
        createdBy: admin.id,
        metadata: { jobId: job.id } as Prisma.InputJsonValue,
      },
    });

    return { ...created, jobId: job.id };
  });

  if ("jobId" in company && company.jobId) {
    await dispatchGeneration(company.jobId);
  }

  return company;
}

export async function startGeneration(companyId: string, admin: AdminUser) {
  const env = getEnv();
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: { generationJobs: { where: { status: { in: ["QUEUED", "RUNNING"] } } } },
  });
  if (!company) throw new NotFoundError("Firma nije pronađena.");
  if (company.generationJobs.length > 0) {
    throw new AppError({
      code: "JOB_IN_FLIGHT",
      message: "Job already running",
      userMessage: "Generisanje je već u toku za ovu firmu.",
    });
  }

  const settings = await prisma.appSettings.findUnique({ where: { id: "default" } });
  const job = await prisma.generationJob.create({
    data: {
      companyId,
      provider: env.openaiEnabled ? "OPENAI" : "MOCK",
      extractorModel: settings?.extractorModel || env.OPENAI_MODEL_EXTRACTOR,
      designerModel: settings?.designerModel || env.OPENAI_MODEL_DESIGNER,
      idempotencyKey: `gen_${companyId}_${nanoid()}`,
      createdBy: admin.id,
      steps: {
        create: GENERATION_STEPS.map((step) => ({
          key: step.key,
          label: step.label,
          description: step.description,
        })),
      },
    },
  });
  await prisma.company.update({
    where: { id: companyId },
    data: { generationStatus: "QUEUED" },
  });
  await dispatchGeneration(job.id);
  return job;
}

export async function cancelGeneration(jobId: string) {
  await prisma.generationJob.update({
    where: { id: jobId },
    data: { cancelRequested: true },
  });
}

export async function archiveCompany(id: string, admin: AdminUser) {
  await prisma.$transaction([
    prisma.company.update({
      where: { id },
      data: {
        archivedAt: new Date(),
        salesStatus: "ARCHIVED",
        updatedBy: admin.id,
      },
    }),
    prisma.salesActivity.create({
      data: {
        companyId: id,
        type: "COMPANY_ARCHIVED",
        fromStatus: undefined,
        toStatus: "ARCHIVED",
        message: "Firma je arhivirana.",
        createdBy: admin.id,
      },
    }),
  ]);
}
