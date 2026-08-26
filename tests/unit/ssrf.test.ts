import { describe, expect, it } from "vitest";
import { assertPublicHttpUrl, isBlockedIp } from "@/lib/security/url-guards";
import { parseUrlList } from "@/lib/validation/company";

describe("URL validation and SSRF", () => {
  it("allows public https URLs", () => {
    const parsed = assertPublicHttpUrl("https://mlekara.example/o-nama");
    expect(parsed.hostname).toBe("mlekara.example");
  });

  it("blocks localhost and credentials", () => {
    expect(() => assertPublicHttpUrl("http://localhost/admin")).toThrow();
    expect(() => assertPublicHttpUrl("https://user:pass@example.com")).toThrow();
    expect(() => assertPublicHttpUrl("ftp://example.com")).toThrow();
  });

  it("blocks private IP literals", () => {
    expect(isBlockedIp("127.0.0.1")).toBe(true);
    expect(isBlockedIp("10.0.0.8")).toBe(true);
    expect(isBlockedIp("192.168.1.1")).toBe(true);
    expect(isBlockedIp("169.254.169.254")).toBe(true);
    expect(isBlockedIp("8.8.8.8")).toBe(false);
  });

  it("parses multiline URL input", () => {
    expect(parseUrlList("https://a.com\nhttps://b.com")).toHaveLength(2);
  });
});
