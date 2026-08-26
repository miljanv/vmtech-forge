import { describe, expect, it } from "vitest";
import { isReservedSlug, validateSlug } from "@/lib/validation/slug";

describe("reserved slugs", () => {
  it("rejects system routes", () => {
    expect(isReservedSlug("admin")).toBe(true);
    expect(isReservedSlug("login")).toBe(true);
    expect(isReservedSlug("privacy")).toBe(true);
    expect(validateSlug("admin").ok).toBe(false);
  });

  it("accepts company slugs", () => {
    expect(validateSlug("Mlekara Jović").ok).toBe(true);
    expect(validateSlug("Mlekara Jović").slug).toBe("mlekara-jovic");
  });
});
