export function publicAssetUrl(asset: {
  publicUrl: string;
  storageKey?: string | null;
}) {
  if (asset.storageKey) {
    return `/media/${asset.storageKey.replace(/^\/+/, "")}`;
  }
  const url = asset.publicUrl.trim();
  if (!url || /localhost|127\.0\.0\.1/.test(url)) {
    return "";
  }
  const assetsIndex = url.indexOf("/assets/");
  if (assetsIndex >= 0) {
    return `/media${url.slice(assetsIndex)}`;
  }
  if (url.startsWith("/media/")) return url;
  if (url.startsWith("http") || url.startsWith("/")) return url;
  return `/media/${url.replace(/^\/+/, "")}`;
}
