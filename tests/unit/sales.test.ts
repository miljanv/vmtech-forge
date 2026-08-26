import { describe, expect, it } from "vitest";
import { canTransition } from "@/lib/sales/status";
import { addBusinessDays, defaultFollowUpDate } from "@/lib/sales/follow-up";

describe("sales status transitions", () => {
  it("allows the default sales path", () => {
    expect(canTransition("PROSPECT", "RESEARCHING")).toBe(true);
    expect(canTransition("READY_TO_CONTACT", "EMAIL_SENT")).toBe(true);
    expect(canTransition("WON", "PROSPECT")).toBe(false);
    expect(canTransition("WON", "PROSPECT", true)).toBe(true);
  });
});

describe("follow-up dates", () => {
  it("skips weekends", () => {
    const friday = new Date("2026-08-21T10:00:00Z");
    const result = addBusinessDays(friday, 3);
    expect(result.getDay()).not.toBe(0);
    expect(result.getDay()).not.toBe(6);
    expect(defaultFollowUpDate(friday, 3).getTime()).toBe(result.getTime());
  });
});
