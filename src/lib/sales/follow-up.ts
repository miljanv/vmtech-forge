const WEEKEND = new Set([0, 6]);

export function addBusinessDays(from: Date, days: number): Date {
  const result = new Date(from);
  let added = 0;
  while (added < days) {
    result.setDate(result.getDate() + 1);
    if (!WEEKEND.has(result.getDay())) {
      added += 1;
    }
  }
  result.setHours(9, 0, 0, 0);
  return result;
}

export function defaultFollowUpDate(
  from = new Date(),
  businessDays = 3,
): Date {
  return addBusinessDays(from, businessDays);
}
