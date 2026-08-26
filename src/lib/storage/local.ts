import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import type { StorageProvider, StoredObject } from "@/lib/storage/types";

const ROOT = path.join(process.cwd(), ".data", "storage");

export class LocalStorageProvider implements StorageProvider {
  readonly name = "local" as const;

  async put(options: {
    key: string;
    body: Buffer;
    contentType: string;
  }): Promise<StoredObject> {
    const filePath = path.join(ROOT, options.key);
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, options.body);
    return {
      key: options.key,
      publicUrl: `/media/${options.key}`,
      size: options.body.byteLength,
    };
  }

  async delete(key: string): Promise<void> {
    await unlink(path.join(ROOT, key)).catch(() => undefined);
  }
}
