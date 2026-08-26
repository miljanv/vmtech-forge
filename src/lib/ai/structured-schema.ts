const UNSUPPORTED_STRING_FORMATS = new Set([
  "uri",
  "uri-reference",
  "email",
  "idn-email",
  "uuid",
  "date-time",
  "date",
  "time",
  "hostname",
  "ipv4",
  "ipv6",
]);

export function stripUnsupportedJsonSchemaFormats(value: unknown): void {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    for (const item of value) stripUnsupportedJsonSchemaFormats(item);
    return;
  }
  const record = value as Record<string, unknown>;
  if (typeof record.format === "string" && UNSUPPORTED_STRING_FORMATS.has(record.format)) {
    delete record.format;
  }
  for (const child of Object.values(record)) {
    stripUnsupportedJsonSchemaFormats(child);
  }
}
