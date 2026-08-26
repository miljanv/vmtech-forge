import { getEnv } from "@/lib/env";
import { LocalStorageProvider } from "@/lib/storage/local";
import { R2StorageProvider } from "@/lib/storage/r2";
import type { StorageProvider } from "@/lib/storage/types";

let cached: StorageProvider | null = null;

export function getStorage(): StorageProvider {
  if (cached) return cached;
  cached = getEnv().r2Enabled ? new R2StorageProvider() : new LocalStorageProvider();
  return cached;
}
