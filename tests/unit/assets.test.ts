import { describe, expect, it } from "vitest";
import { inspectImageBuffer } from "@/lib/assets/validate";
import { publicAssetUrl } from "@/lib/assets/public-url";

describe("asset validation", () => {
  it("rejects tiny buffers that are not SVG", async () => {
    await expect(inspectImageBuffer(Buffer.from("abc"))).rejects.toThrow();
  });

  it("rejects scripted SVG", async () => {
    const svg = Buffer.from('<svg><script>alert(1)</script></svg>');
    await expect(inspectImageBuffer(svg)).rejects.toThrow();
  });
});

describe("publicAssetUrl", () => {
  it("serves stored keys through /media", () => {
    expect(
      publicAssetUrl({
        publicUrl: "https://vmtech-forge-six.vercel.app/assets/company/hash.webp",
        storageKey: "assets/company/hash.webp",
      }),
    ).toBe("/media/assets/company/hash.webp");
  });

  it("rewrites legacy /assets paths when storageKey is missing", () => {
    expect(
      publicAssetUrl({
        publicUrl: "/assets/company/hash.webp",
      }),
    ).toBe("/media/assets/company/hash.webp");
  });

  it("hides localhost urls", () => {
    expect(
      publicAssetUrl({
        publicUrl: "http://localhost:3005/media/assets/company/hash.webp",
      }),
    ).toBe("");
  });
});
