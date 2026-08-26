import { getEnv } from "@/lib/env";
import { getAIProvider } from "@/lib/ai";
import { getCrawlerProvider } from "@/lib/crawler";
import { wrapUntrustedSource } from "@/lib/security/sanitize";
import { assertPublicHttpUrl } from "@/lib/security/ssrf";
import { ensureVisualAssets } from "@/lib/assets/ingest";
import { type GenerationStepKey } from "@/lib/generation/steps";
import { fingerprintFromSpec, maxSimilarity } from "@/lib/site-spec/fingerprint";
import { validateSiteSpec } from "@/lib/site-spec/validate";
import type { DesignFingerprint } from "@/lib/site-spec/schema";
import { prisma } from "@/server/db";
import { AppError, toJobErrorMessage } from "@/lib/errors";
import { Prisma } from "@/generated/prisma";

const STEP_PROGRESS: Record<GenerationStepKey, number> = {
  QUEUED: 5,
  SOURCE_CHECK: 12,
  PAGE_COLLECTION: 24,
  FACT_EXTRACTION: 38,
  IMAGE_DOWNLOAD: 48,
  BRAND_ANALYSIS: 58,
  DESIGN_PLANNING: 68,
  CONTENT_GENERATION: 78,
  SITE_CREATION: 88,
  QUALITY_CHECK: 94,
  READY: 100,
};

async function setStep(
  jobId: string,
  key: GenerationStepKey,
  status: "RUNNING" | "SUCCEEDED" | "FAILED",
  error?: string,
) {
  const now = new Date();
  await prisma.generationStep.update({
    where: { jobId_key: { jobId, key } },
    data: {
      status,
      progress: status === "SUCCEEDED" ? 100 : status === "RUNNING" ? 40 : 0,
      error,
      startedAt: status === "RUNNING" ? now : undefined,
      completedAt: status !== "RUNNING" ? now : undefined,
      attempt: { increment: status === "RUNNING" ? 1 : 0 },
    },
  });
  await prisma.generationJob.update({
    where: { id: jobId },
    data: {
      currentStep: key,
      progress: STEP_PROGRESS[key],
      status: status === "FAILED" ? "FAILED" : "RUNNING",
      error: error ?? null,
    },
  });
}

async function isCancelled(jobId: string): Promise<boolean> {
  const job = await prisma.generationJob.findUnique({ where: { id: jobId } });
  return Boolean(job?.cancelRequested);
}

export async function runGenerationPipeline(jobId: string): Promise<void> {
  const job = await prisma.generationJob.findUnique({
    where: { id: jobId },
    include: { company: { include: { sources: true, assets: true, site: true } } },
  });
  if (!job) {
    throw new AppError({
      code: "JOB_NOT_FOUND",
      message: "Generation job missing",
      userMessage: "Posao generisanja nije pronađen.",
    });
  }

  const running = await prisma.generationJob.findFirst({
    where: {
      companyId: job.companyId,
      status: "RUNNING",
      id: { not: jobId },
    },
  });
  if (running) {
    await prisma.generationJob.update({
      where: { id: jobId },
      data: {
        status: "FAILED",
        error: "Firma već ima aktivno generisanje.",
      },
    });
    return;
  }

  await prisma.generationJob.update({
    where: { id: jobId },
    data: { status: "RUNNING", startedAt: new Date() },
  });
  await prisma.company.update({
    where: { id: job.companyId },
    data: { generationStatus: "RUNNING" },
  });

  try {
    if (await isCancelled(jobId)) {
      throw new AppError({
        code: "CANCELLED",
        message: "Cancelled",
        userMessage: "Generisanje je otkazano.",
      });
    }

    await setStep(jobId, "QUEUED", "SUCCEEDED");
    await setStep(jobId, "SOURCE_CHECK", "RUNNING");
    for (const source of job.company.sources) {
      assertPublicHttpUrl(source.url);
    }
    await setStep(jobId, "SOURCE_CHECK", "SUCCEEDED");

    await setStep(jobId, "PAGE_COLLECTION", "RUNNING");
    const crawler = getCrawlerProvider();
    const allowedHostnames = job.company.sources.map(
      (source) => new URL(source.url).hostname,
    );
    const pages = await crawler.crawl({
      startUrls: job.company.sources.map((source) => source.url),
      allowedHostnames,
      maxPages: 8,
    });
    for (const page of pages) {
      await prisma.source.updateMany({
        where: { companyId: job.companyId, url: page.url },
        data: {
          crawlStatus: "SUCCEEDED",
          sanitizedContent: wrapUntrustedSource(page.markdown, page.url),
          contentHash: page.htmlHash,
          pageTitle: page.title,
          lastCrawledAt: new Date(),
          httpStatus: page.status,
          metadata: { finalUrl: page.finalUrl, crawler: crawler.name },
        },
      });
    }
    await setStep(jobId, "PAGE_COLLECTION", "SUCCEEDED");

    await setStep(jobId, "FACT_EXTRACTION", "RUNNING");
    const ai = getAIProvider();
    const extraction = await ai.extractFacts({
      companyName: job.company.name,
      locale: job.company.preferredLanguage,
      sources: pages.map((page) => ({ url: page.url, content: page.markdown })),
    });
    await prisma.company.update({
      where: { id: job.companyId },
      data: {
        name: job.company.name || extraction.data.businessName,
        contactEmail: job.company.contactEmail || extraction.data.email,
        contactPhone: job.company.contactPhone || extraction.data.phone,
        businessFacts: jsonValue(extraction.data),
      },
    });
    await prisma.extractedFact.deleteMany({ where: { companyId: job.companyId } });
    await prisma.extractedFact.createMany({
      data: [
        {
          companyId: job.companyId,
          key: "businessName",
          value: jsonValue(extraction.data.businessName),
          sourceUrl: extraction.data.provenance[0]?.sourceUrl,
          confidence: extraction.data.confidence,
        },
        {
          companyId: job.companyId,
          key: "products",
          value: jsonValue(extraction.data.products),
          confidence: extraction.data.confidence,
        },
      ],
    });
    await prisma.generationJob.update({
      where: { id: jobId },
      data: {
        inputTokens: { increment: extraction.usage.inputTokens },
        outputTokens: { increment: extraction.usage.outputTokens },
        requestIds: [extraction.usage.requestId ?? "mock"],
      },
    });
    await setStep(jobId, "FACT_EXTRACTION", "SUCCEEDED");

    await setStep(jobId, "IMAGE_DOWNLOAD", "RUNNING");
    const imageUrls = [
      ...pages.flatMap((page) => page.imageUrls),
      ...pages.map((page) => page.logoUrl).filter((url): url is string => Boolean(url)),
    ];
    const processedAssets = await ensureVisualAssets({
      companyId: job.companyId,
      urls: imageUrls,
    });
    const createdAssets = [];
    for (const [index, processed] of processedAssets.entries()) {
      const asset = await prisma.asset.upsert({
        where: {
          companyId_contentHash: {
            companyId: job.companyId,
            contentHash: processed.contentHash,
          },
        },
        update: { publicUrl: processed.publicUrl, storageKey: processed.storageKey },
        create: {
          companyId: job.companyId,
          type: index === 0 ? "HERO" : index < 3 ? "PRODUCT" : "GALLERY",
          storageKey: processed.storageKey,
          publicUrl: processed.publicUrl,
          mimeType: processed.mimeType,
          width: processed.width,
          height: processed.height,
          fileSize: processed.fileSize,
          contentHash: processed.contentHash,
          dominantColors: processed.dominantColors,
          approved: true,
        },
      });
      createdAssets.push(asset);
    }
    await setStep(jobId, "IMAGE_DOWNLOAD", "SUCCEEDED");

    const recentVersions = await prisma.siteVersion.findMany({
      take: 20,
      orderBy: { createdAt: "desc" },
      select: { designFingerprint: true },
    });
    const recentFingerprints = recentVersions.map(
      (version) => version.designFingerprint as DesignFingerprint,
    );

    await setStep(jobId, "BRAND_ANALYSIS", "RUNNING");
    const brand = await ai.analyzeBrand({
      facts: extraction.data,
      dominantColors: createdAssets.flatMap(
        (asset) => (asset.dominantColors as string[] | null) ?? [],
      ),
      recentFingerprints,
    });
    await setStep(jobId, "BRAND_ANALYSIS", "SUCCEEDED");
    await setStep(jobId, "DESIGN_PLANNING", "SUCCEEDED");

    await setStep(jobId, "CONTENT_GENERATION", "RUNNING");
    await setStep(jobId, "SITE_CREATION", "RUNNING");
    let planned = await ai.planSite({
      facts: extraction.data,
      profile: brand.data,
      locale: job.company.preferredLanguage,
      preferredCta: job.company.preferredCta,
      designNotes: job.company.designNotes,
      contentNotes: job.company.contentNotes,
      assetIds: createdAssets.map((asset) => asset.id),
      recentFingerprints,
    });

    await setStep(jobId, "QUALITY_CHECK", "RUNNING");
    const allowedAssetIds = new Set(createdAssets.map((asset) => asset.id));
    let spec = planned.data;
    let fingerprint = fingerprintFromSpec(spec, {
      archetype: brand.data.visualArchetype,
      buttonStyle: brand.data.buttonStyle,
    });
    let similarity = maxSimilarity(fingerprint, recentFingerprints);
    const settingsRow = await prisma.appSettings.findUnique({
      where: { id: "default" },
    });
    const threshold =
      settingsRow?.similarityThreshold ?? (getEnv().demoMode ? 0.95 : 0.72);

    try {
      spec = validateSiteSpec(spec, { allowedAssetIds });
    } catch {
      planned = await ai.planSite({
        facts: extraction.data,
        profile: brand.data,
        locale: job.company.preferredLanguage,
        preferredCta: job.company.preferredCta,
        designNotes: `${job.company.designNotes ?? ""}\nRetry after validation failure.`,
        contentNotes: job.company.contentNotes,
        assetIds: createdAssets.map((asset) => asset.id),
        recentFingerprints,
      });
      spec = validateSiteSpec(planned.data, { allowedAssetIds });
    }

    fingerprint = fingerprintFromSpec(spec, {
      archetype: brand.data.visualArchetype,
      buttonStyle: brand.data.buttonStyle,
    });
    similarity = maxSimilarity(fingerprint, recentFingerprints);
    if (similarity > threshold) {
      planned = await ai.planSite({
        facts: extraction.data,
        profile: {
          ...brand.data,
          heroVariant: "bold-typographic",
          productVariant: "featured-split",
          fontPairingId: "cormorant-karla",
        },
        locale: job.company.preferredLanguage,
        assetIds: createdAssets.map((asset) => asset.id),
        recentFingerprints,
      });
      spec = validateSiteSpec(planned.data, { allowedAssetIds });
      fingerprint = fingerprintFromSpec(spec, {
        archetype: "craft-contrast",
        buttonStyle: brand.data.buttonStyle,
      });
      similarity = maxSimilarity(fingerprint, recentFingerprints);
    }

    const site =
      job.company.site ??
      (await prisma.site.create({
        data: {
          companyId: job.companyId,
          slug: job.company.slug,
          visibility: "UNLISTED",
          demoMode: true,
        },
      }));

    const lastVersion = await prisma.siteVersion.findFirst({
      where: { siteId: site.id },
      orderBy: { versionNumber: "desc" },
    });
    const version = await prisma.siteVersion.create({
      data: {
        siteId: site.id,
        versionNumber: (lastVersion?.versionNumber ?? 0) + 1,
        status: "PUBLISHED",
        siteSpec: jsonValue(spec),
        designFingerprint: jsonValue(fingerprint),
        similarityScore: similarity,
        createdBy: job.createdBy,
        generationJobId: jobId,
        publishedAt: new Date(),
      },
    });
    await prisma.site.update({
      where: { id: site.id },
      data: { publishedVersionId: version.id },
    });

    await setStep(jobId, "QUALITY_CHECK", "SUCCEEDED");
    await setStep(jobId, "READY", "SUCCEEDED");
    await prisma.generationJob.update({
      where: { id: jobId },
      data: {
        status: "SUCCEEDED",
        progress: 100,
        completedAt: new Date(),
        inputTokens: { increment: planned.usage.inputTokens + brand.usage.inputTokens },
        outputTokens: {
          increment: planned.usage.outputTokens + brand.usage.outputTokens,
        },
      },
    });
    await prisma.company.update({
      where: { id: job.companyId },
      data: {
        generationStatus: "SUCCEEDED",
        salesStatus:
          job.company.salesStatus === "PROSPECT" ||
          job.company.salesStatus === "RESEARCHING"
            ? "READY_TO_CONTACT"
            : job.company.salesStatus,
      },
    });
    await prisma.salesActivity.create({
      data: {
        companyId: job.companyId,
        type: "GENERATION_COMPLETED",
        message: "Sajt je uspešno generisan.",
        createdBy: job.createdBy,
      },
    });
  } catch (error) {
    const message = toJobErrorMessage(error);
    const current = await prisma.generationJob.findUnique({ where: { id: jobId } });
    if (current?.currentStep) {
      await setStep(jobId, current.currentStep as GenerationStepKey, "FAILED", message);
    }
    await prisma.generationJob.update({
      where: { id: jobId },
      data: {
        status: error instanceof AppError && error.code === "CANCELLED"
          ? "CANCELLED"
          : "FAILED",
        error: message,
        completedAt: new Date(),
      },
    });
    await prisma.company.update({
      where: { id: job.companyId },
      data: {
        generationStatus:
          error instanceof AppError && error.code === "CANCELLED"
            ? "CANCELLED"
            : "FAILED",
      },
    });
    await prisma.salesActivity.create({
      data: {
        companyId: job.companyId,
        type: "GENERATION_FAILED",
        message,
        createdBy: job.createdBy,
      },
    });
    throw error;
  }
}

function jsonValue(value: unknown): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  if (value === null || value === undefined) {
    return Prisma.JsonNull;
  }
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}
