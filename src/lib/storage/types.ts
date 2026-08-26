export type StoredObject = {
  key: string;
  publicUrl: string;
  size: number;
};

export type StoredObjectBody = {
  body: Buffer;
  contentType: string;
};

export interface StorageProvider {
  readonly name: "r2" | "local";
  put(options: {
    key: string;
    body: Buffer;
    contentType: string;
  }): Promise<StoredObject>;
  get(key: string): Promise<StoredObjectBody | null>;
  delete(key: string): Promise<void>;
}
