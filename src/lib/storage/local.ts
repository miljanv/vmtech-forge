import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import type { StorageProvider, StoredObject, StoredObjectBody } from "@/lib/storage/types";

const ROOT = path.join(process.cwd(), ".data", "storage");

function mediaUrl(key: string) {
  return `/media/${key.replace(/^\/+/, "")}`;
}

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
      publicUrl: mediaUrl(options.key),
      size: options.body.byteLength,
    };
  }

  async get(key: string): Promise<StoredObjectBody | null> {
    try {
      const body = await readFile(path.join(ROOT, key));
      return {
        body,
        contentType: key.endsWith(".webp") ? "image/webp" : "application/octet-stream",
      };
    } catch {
      return null;
    }
  }

  async delete(key: string): Promise<void> {
    await unlink(path.join(ROOT, key)).catch(() => undefined);
  }
}
