/**
 * Where a processed logo asset actually lives. Production should never
 * put logos in localStorage (quota, no CDN, no moderation hook) - real
 * assets belong in object storage (S3-compatible bucket, or Supabase/
 * Firebase storage) with the repository only keeping the resulting URL.
 * StorageProvider is the seam that swap happens behind; nothing else in
 * the app needs to change when a real bucket is wired up.
 */
export interface UploadedAsset {
  url: string;
  storageKey: string;
  width: number;
  height: number;
  bytes: number;
}

export interface StorageProvider {
  readonly name: string;
  uploadLogo(blob: Blob, width: number, height: number): Promise<UploadedAsset>;
  deleteLogo(storageKey: string): Promise<void>;
}

/**
 * What actually runs today: keeps the already-downscaled/compressed
 * image as a data: URL (see utils/imageProcessing.ts), which is fine for
 * a localStorage-backed prototype but not for production - see README
 * "Storage configuration" for what swapping this for real object storage
 * requires.
 */
export class LocalStorageProvider implements StorageProvider {
  readonly name = "local-data-url";

  async uploadLogo(blob: Blob, width: number, height: number): Promise<UploadedAsset> {
    const url = await blobToDataUrl(blob);
    return { url, storageKey: `local:${Date.now()}:${Math.random().toString(36).slice(2)}`, width, height, bytes: blob.size };
  }

  async deleteLogo(): Promise<void> {
    // nothing to delete - the asset lives inline in the spot record itself
  }
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("could not read processed image"));
    reader.readAsDataURL(blob);
  });
}
