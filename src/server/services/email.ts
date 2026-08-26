import { getAppUrl } from "@/lib/env";
import { formatDealValue } from "@/lib/sales/status";
import { prisma } from "@/server/db";
import { NotFoundError } from "@/lib/errors";
import { updateSalesStatus, scheduleFollowUp } from "@/server/services/sales";
import type { AdminUser } from "@/lib/auth/constants";

export function buildSalesEmail(options: {
  companyName: string;
  previewUrl: string;
  dealValueMinor: number;
  currency: string;
}) {
  const subject = `Pripremili smo predlog sajta za ${options.companyName}`;
  const price = formatDealValue(options.dealValueMinor, options.currency);
  const body = [
    "Poštovani,",
    "",
    "Pišem Vam iz studija StudioForge. Pomažemo malim proizvođačima i porodičnim firmama da dobiju ozbiljan, jasan i lep sajt — bez komplikacija.",
    "",
    `${options.companyName} trenutno nema savremen sajt koji dobro predstavlja ponudu i olakšava naručivanje. U današnjem okruženju, kupci Vas prvo potraže na mreži: ako Vas tamo nema, često biraju nekoga ko deluje dostupnije.`,
    "",
    "Pripremili smo predlog sajta na osnovu javno dostupnih informacija o Vašem poslovanju. Možete ga pogledati ovde:",
    options.previewUrl,
    "",
    "Pregledajte predlog u miru. Ako Vam odgovara smer, finalna podešavanja, sitne izmene sadržaja i povezivanje domena su uključeni.",
    "",
    `Ponuda za izradu i objavu sajta: ${price}.`,
    "",
    "Srdačan pozdrav,",
    "StudioForge",
  ].join("\n");
  return { subject, body };
}

export async function createEmailDraft(companyId: string, admin: AdminUser) {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: { site: true },
  });
  if (!company) throw new NotFoundError("Firma nije pronađena.");
  const previewUrl = `${getAppUrl()}/${company.slug}`;
  const draftContent = buildSalesEmail({
    companyName: company.name ?? company.slug,
    previewUrl,
    dealValueMinor: company.dealValueMinor,
    currency: company.currency,
  });
  const draft = await prisma.emailDraft.create({
    data: {
      companyId,
      subject: draftContent.subject,
      body: draftContent.body,
      createdBy: admin.id,
    },
  });
  await prisma.salesActivity.create({
    data: {
      companyId,
      type: "EMAIL_CREATED",
      message: "Kreiran je nacrt prodajnog mejla.",
      createdBy: admin.id,
    },
  });
  return draft;
}

export async function markEmailSent(draftId: string, admin: AdminUser) {
  const draft = await prisma.emailDraft.update({
    where: { id: draftId },
    data: { status: "SENT", sentAt: new Date() },
    include: { company: true },
  });
  await updateSalesStatus({
    companyId: draft.companyId,
    to: "EMAIL_SENT",
    admin,
    force: true,
    message: "Prodajni mejl je označen kao poslat.",
  });
  await prisma.salesActivity.create({
    data: {
      companyId: draft.companyId,
      type: "EMAIL_SENT",
      message: "Mejl je označen kao poslat.",
      createdBy: admin.id,
    },
  });
  await scheduleFollowUp({
    companyId: draft.companyId,
    admin,
    note: "Proveriti da li je klijent pregledao predlog sajta.",
  });
  return draft;
}
