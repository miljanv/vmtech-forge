"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/server/auth";
import { toUserErrorMessage } from "@/lib/errors";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { RateLimitError } from "@/lib/errors";
import { companyWizardSchema } from "@/lib/validation/company";
import {
  archiveCompany,
  cancelGeneration,
  createCompanyFromWizard,
  startGeneration,
} from "@/server/services/company";
import { addNote, scheduleFollowUp, updateSalesStatus } from "@/server/services/sales";
import type { SalesStatus } from "@/lib/sales/status";
import { createEmailDraft, markEmailSent } from "@/server/services/email";
import { publishVersion, restoreVersion, saveEditedSpec } from "@/server/services/site";
import { updateSettings } from "@/server/services/settings";
import { siteSpecSchema } from "@/lib/site-spec/schema";
import { getAIProvider } from "@/lib/ai";
import { prisma } from "@/server/db";
import { businessFactsSchema } from "@/lib/facts/schema";

export const maxDuration = 300;

async function guarded<T>(fn: () => Promise<T>) {
  try {
    const data = await fn();
    return { ok: true as const, data };
  } catch (error) {
    return { ok: false as const, error: toUserErrorMessage(error) };
  }
}

export async function createCompanyAction(input: unknown) {
  return guarded(async () => {
    const admin = await requireAdmin();
    if (!consumeRateLimit(`create:${admin.id}`, 8, 60_000)) {
      throw new RateLimitError();
    }
    const parsed = companyWizardSchema.parse(input);
    const company = await createCompanyFromWizard(parsed, admin);
    revalidatePath("/admin");
    revalidatePath("/admin/companies");
    return { id: company.id };
  });
}

export async function startGenerationAction(companyId: string) {
  return guarded(async () => {
    const admin = await requireAdmin();
    if (!consumeRateLimit(`gen:${admin.id}`, 6, 60_000)) {
      throw new RateLimitError();
    }
    const job = await startGeneration(companyId, admin);
    revalidatePath(`/admin/companies/${companyId}`);
    return { jobId: job.id };
  });
}

export async function cancelGenerationAction(jobId: string) {
  return guarded(async () => {
    await requireAdmin();
    await cancelGeneration(jobId);
  });
}

export async function archiveCompanyAction(companyId: string) {
  return guarded(async () => {
    const admin = await requireAdmin();
    await archiveCompany(companyId, admin);
    revalidatePath("/admin/companies");
  });
}

export async function updateStatusAction(companyId: string, to: SalesStatus) {
  return guarded(async () => {
    const admin = await requireAdmin();
    await updateSalesStatus({ companyId, to, admin, force: true });
    revalidatePath("/admin/pipeline");
    revalidatePath(`/admin/companies/${companyId}`);
  });
}

export async function addNoteAction(companyId: string, message: string) {
  return guarded(async () => {
    const admin = await requireAdmin();
    await addNote(companyId, message, admin);
    revalidatePath(`/admin/companies/${companyId}`);
  });
}

export async function scheduleFollowUpAction(companyId: string, note?: string) {
  return guarded(async () => {
    const admin = await requireAdmin();
    await scheduleFollowUp({ companyId, admin, note });
    revalidatePath(`/admin/companies/${companyId}`);
  });
}

export async function createEmailAction(companyId: string) {
  return guarded(async () => {
    const admin = await requireAdmin();
    const draft = await createEmailDraft(companyId, admin);
    revalidatePath(`/admin/companies/${companyId}`);
    return draft;
  });
}

export async function markEmailSentAction(draftId: string) {
  return guarded(async () => {
    const admin = await requireAdmin();
    await markEmailSent(draftId, admin);
    revalidatePath("/admin");
  });
}

export async function publishVersionAction(versionId: string) {
  return guarded(async () => {
    const admin = await requireAdmin();
    await publishVersion(versionId, admin);
  });
}

export async function restoreVersionAction(versionId: string) {
  return guarded(async () => {
    const admin = await requireAdmin();
    await restoreVersion(versionId, admin);
  });
}

export async function saveSiteSpecAction(siteId: string, spec: unknown) {
  return guarded(async () => {
    const admin = await requireAdmin();
    const parsed = siteSpecSchema.parse(spec);
    await saveEditedSpec({ siteId, spec: parsed, admin });
  });
}

export async function regenerateSectionAction(options: {
  companyId: string;
  siteId: string;
  sectionId: string;
  mode: "section" | "copy" | "design";
}) {
  return guarded(async () => {
    const admin = await requireAdmin();
    const site = await prisma.site.findUnique({
      where: { id: options.siteId },
      include: {
        publishedVersion: true,
        versions: { orderBy: { versionNumber: "desc" }, take: 1 },
        company: true,
      },
    });
    const version = site?.versions[0];
    if (!site || !version) {
      throw new Error("Missing site");
    }
    const ai = getAIProvider();
    const facts = businessFactsSchema.parse(site.company.businessFacts ?? {});
    const result = await ai.regenerateSection({
      spec: siteSpecSchema.parse(version.siteSpec),
      sectionId: options.sectionId,
      facts,
      mode: options.mode,
    });
    await saveEditedSpec({ siteId: site.id, spec: result.data, admin });
    revalidatePath(`/admin/companies/${options.companyId}`);
  });
}

export async function updateSettingsAction(data: {
  defaultDealValueMinor?: number;
  similarityThreshold?: number;
  followUpBusinessDays?: number;
  demoBadgeEnabled?: boolean;
}) {
  return guarded(async () => {
    const admin = await requireAdmin();
    await updateSettings(data, admin);
    revalidatePath("/admin/settings");
  });
}

export async function updateFactsAction(companyId: string, facts: unknown) {
  return guarded(async () => {
    await requireAdmin();
    const parsed = businessFactsSchema.parse(facts);
    await prisma.company.update({
      where: { id: companyId },
      data: {
        businessFacts: parsed,
        name: parsed.businessName,
        contactEmail: parsed.email,
        contactPhone: parsed.phone,
      },
    });
    revalidatePath(`/admin/companies/${companyId}`);
  });
}

export async function toggleAssetAction(assetId: string, approved: boolean) {
  return guarded(async () => {
    await requireAdmin();
    await prisma.asset.update({
      where: { id: assetId },
      data: { approved, excluded: !approved },
    });
  });
}

export async function toggleDemoBadgeAction(siteId: string, demoMode: boolean) {
  return guarded(async () => {
    await requireAdmin();
    await prisma.site.update({ where: { id: siteId }, data: { demoMode } });
  });
}
