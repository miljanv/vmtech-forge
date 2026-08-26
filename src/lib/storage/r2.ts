import { PutObjectCommand, DeleteObjectCommand, GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getEnv } from "@/lib/env";
import type { StorageProvider, StoredObject, StoredObjectBody } from "@/lib/storage/types";

function mediaUrl(key: string) {
  return `/media/${key.replace(/^\/+/, "")}`;
}

export class R2StorageProvider implements StorageProvider {
  readonly name = "r2" as const;
  private readonly client: S3Client;

  constructor() {
    const env = getEnv();
    this.client = new S3Client({
      region: "auto",
      endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID ?? "",
        secretAccessKey: env.R2_SECRET_ACCESS_KEY ?? "",
      },
    });
  }

  async put(options: {
    key: string;
    body: Buffer;
    contentType: string;
  }): Promise<StoredObject> {
    const env = getEnv();
    await this.client.send(
      new PutObjectCommand({
        Bucket: env.R2_BUCKET_NAME,
        Key: options.key,
        Body: options.body,
        ContentType: options.contentType,
      }),
    );
    return {
      key: options.key,
      publicUrl: mediaUrl(options.key),
      size: options.body.byteLength,
    };
  }

  async get(key: string): Promise<StoredObjectBody | null> {
    const env = getEnv();
    try {
      const response = await this.client.send(
        new GetObjectCommand({
          Bucket: env.R2_BUCKET_NAME,
          Key: key,
        }),
      );
      const bytes = await response.Body?.transformToByteArray();
      if (!bytes) return null;
      return {
        body: Buffer.from(bytes),
        contentType: response.ContentType ?? (key.endsWith(".webp") ? "image/webp" : "application/octet-stream"),
      };
    } catch {
      return null;
    }
  }

  async delete(key: string): Promise<void> {
    const env = getEnv();
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: env.R2_BUCKET_NAME,
        Key: key,
      }),
    );
  }
}
