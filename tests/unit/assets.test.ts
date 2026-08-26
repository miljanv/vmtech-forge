import { describe, expect, it } from "vitest";
import { inspectImageBuffer } from "@/lib/assets/validate";

describe("asset validation", () => {
  it("rejects tiny buffers that are not SVG", async () => {
    await expect(inspectImageBuffer(Buffer.from("abc"))).rejects.toThrow();
  });

  it("rejects scripted SVG", async () => {
    const svg = Buffer.from('<svg><script>alert(1)</script></svg>');
    await expect(inspectImageBuffer(svg)).rejects.toThrow();
  });
});
