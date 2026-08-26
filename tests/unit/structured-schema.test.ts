import { describe, expect, it } from "vitest";
import { stripUnsupportedJsonSchemaFormats } from "@/lib/ai/structured-schema";

describe("structured schema sanitizer", () => {
  it("removes uri format that OpenAI Structured Outputs reject", () => {
    const schema = {
      properties: {
        sourceUrl: { anyOf: [{ type: "string", format: "uri" }, { type: "null" }] },
      },
    };
    stripUnsupportedJsonSchemaFormats(schema);
    expect(schema.properties.sourceUrl.anyOf[0]).toEqual({ type: "string" });
  });
});
