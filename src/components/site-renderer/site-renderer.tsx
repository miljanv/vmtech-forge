import type { SiteSpec } from "@/lib/site-spec/schema";
import { SiteChrome } from "@/components/site-renderer/site-chrome";
import { SectionView } from "@/components/site-sections/section-view";
import { JsonLd } from "@/components/site-renderer/json-ld";

type SiteAsset = {
  id: string;
  publicUrl: string;
  type: string;
  storageKey?: string | null;
};

function resolveAssetUrl(asset: SiteAsset) {
  if (/localhost|127\.0\.0\.1/.test(asset.publicUrl)) {
    return "";
  }
  if (asset.publicUrl.startsWith("http") || asset.publicUrl.startsWith("/")) {
    return asset.publicUrl;
  }
  return asset.storageKey ? `/media/${asset.storageKey}` : asset.publicUrl;
}

export function SiteRenderer({
  spec,
  slug,
  demoMode,
  showBadge,
}: {
  spec: SiteSpec;
  assets: SiteAsset[];
  slug: string;
  demoMode: boolean;
  showBadge: boolean;
}) {
  const theme = spec.theme;

  return (
    <div
      className={`site-root surface-${theme.surfaceStyle} motion-${theme.motionIntensity}`}
      style={{
        ["--site-bg" as string]: theme.colors.background,
        ["--site-fg" as string]: theme.colors.foreground,
        ["--site-muted" as string]: theme.colors.muted,
        ["--site-muted-fg" as string]: theme.colors.mutedForeground,
        ["--site-primary" as string]: theme.colors.primary,
        ["--site-primary-fg" as string]: theme.colors.primaryForeground,
        ["--site-accent" as string]: theme.colors.accent,
        ["--site-accent-fg" as string]: theme.colors.accentForeground,
        ["--site-border" as string]: theme.colors.border,
        ["--site-surface" as string]: theme.colors.surface,
        ["--site-radius" as string]:
          theme.radius === "none" ? "0px" : theme.radius === "round" ? "1.5rem" : "0.85rem",
        background: theme.colors.background,
        color: theme.colors.foreground,
        fontFamily: "var(--site-body), system-ui, sans-serif",
      }}
    >
      <SiteChrome spec={spec} slug={slug} demoMode={demoMode && showBadge}>
        {spec.pages[0] ? null : null}
      </SiteChrome>
      <JsonLd spec={spec} slug={slug} />
    </div>
  );
}

export function SitePageView({
  spec,
  assets,
  slug,
  path,
  demoMode,
  showBadge,
}: {
  spec: SiteSpec;
  assets: SiteAsset[];
  slug: string;
  path: string;
  demoMode: boolean;
  showBadge: boolean;
}) {
  const page = spec.pages.find((item) => item.path === path) ?? spec.pages[0];
  const assetMap = new Map(
    assets.map((asset) => [asset.id, resolveAssetUrl(asset)]),
  );
  const theme = spec.theme;

  return (
    <div
      className={`site-root surface-${theme.surfaceStyle}`}
      style={{
        ["--site-bg" as string]: theme.colors.background,
        ["--site-fg" as string]: theme.colors.foreground,
        ["--site-muted" as string]: theme.colors.muted,
        ["--site-muted-fg" as string]: theme.colors.mutedForeground,
        ["--site-primary" as string]: theme.colors.primary,
        ["--site-primary-fg" as string]: theme.colors.primaryForeground,
        ["--site-accent" as string]: theme.colors.accent,
        ["--site-accent-fg" as string]: theme.colors.accentForeground,
        ["--site-border" as string]: theme.colors.border,
        ["--site-surface" as string]: theme.colors.surface,
        ["--site-radius" as string]:
          theme.radius === "none" ? "0px" : theme.radius === "round" ? "1.5rem" : "0.85rem",
        background: theme.colors.background,
        color: theme.colors.foreground,
        fontFamily: "var(--site-body), system-ui, sans-serif",
      }}
    >
      <JsonLd spec={spec} slug={slug} />
      <SiteChrome spec={spec} slug={slug} demoMode={demoMode && showBadge}>
        <main>
          {page.sections
            .filter((section) => section.visible)
            .map((section) => (
              <SectionView key={section.id} section={section} assetMap={assetMap} slug={slug} />
            ))}
        </main>
      </SiteChrome>
    </div>
  );
}

export function emptySectionFallback() {
  return null;
}
