export type StoredObject = {
  key: string;
  publicUrl: string;
  size: number;
};

export interface StorageProvider {
  readonly name: "r2" | "local";
  put(options: {
    key: string;
    body: Buffer;
    contentType: string;
  }): Promise<StoredObject>;
  delete(key: string): Promise<void>;
}
