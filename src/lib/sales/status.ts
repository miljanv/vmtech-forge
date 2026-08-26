export const SALES_STATUSES = [
  "PROSPECT",
  "RESEARCHING",
  "READY_TO_CONTACT",
  "EMAIL_SENT",
  "FOLLOW_UP",
  "REPLIED",
  "NEGOTIATION",
  "WON",
  "LOST",
  "ARCHIVED",
] as const;

export type SalesStatus = (typeof SALES_STATUSES)[number];

export const SALES_STATUS_LABELS: Record<SalesStatus, string> = {
  PROSPECT: "Potencijalni klijent",
  RESEARCHING: "Prikupljanje podataka",
  READY_TO_CONTACT: "Spreman za kontakt",
  EMAIL_SENT: "Poslat mejl",
  FOLLOW_UP: "Potreban follow-up",
  REPLIED: "Odgovorio",
  NEGOTIATION: "Pregovori",
  WON: "Završeno",
  LOST: "Odbijeno",
  ARCHIVED: "Arhivirano",
};

export const ALLOWED_STATUS_TRANSITIONS: Record<SalesStatus, SalesStatus[]> = {
  PROSPECT: ["RESEARCHING", "READY_TO_CONTACT", "ARCHIVED"],
  RESEARCHING: ["READY_TO_CONTACT", "PROSPECT", "ARCHIVED"],
  READY_TO_CONTACT: ["EMAIL_SENT", "RESEARCHING", "ARCHIVED"],
  EMAIL_SENT: ["FOLLOW_UP", "REPLIED", "LOST", "ARCHIVED"],
  FOLLOW_UP: ["EMAIL_SENT", "REPLIED", "LOST", "ARCHIVED"],
  REPLIED: ["NEGOTIATION", "FOLLOW_UP", "LOST", "ARCHIVED"],
  NEGOTIATION: ["WON", "LOST", "FOLLOW_UP", "ARCHIVED"],
  WON: ["ARCHIVED"],
  LOST: ["ARCHIVED", "PROSPECT"],
  ARCHIVED: ["PROSPECT"],
};

export function canTransition(
  from: SalesStatus,
  to: SalesStatus,
  force = false,
): boolean {
  if (from === to) {
    return false;
  }
  if (force) {
    return true;
  }
  return ALLOWED_STATUS_TRANSITIONS[from].includes(to);
}

export function formatDealValue(minor: number, currency = "EUR"): string {
  const major = minor / 100;
  if (currency === "EUR") {
    return `${major.toLocaleString("sr-Latn")} €`;
  }
  return `${major.toLocaleString("sr-Latn")} ${currency}`;
}
