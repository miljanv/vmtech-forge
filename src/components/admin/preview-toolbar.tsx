"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const FRAMES = {
  desktop: "100%",
  tablet: "768px",
  mobile: "390px",
} as const;

export function PreviewToolbar({ slug }: { slug: string }) {
  const [device, setDevice] = useState<keyof typeof FRAMES>("desktop");
  const [version, setVersion] = useState<"published" | "draft">("published");
  const src = `/${slug}${version === "draft" ? "?preview=1" : ""}`;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {(Object.keys(FRAMES) as Array<keyof typeof FRAMES>).map((key) => (
          <Button
            key={key}
            size="sm"
            variant={device === key ? "default" : "outline"}
            onClick={() => setDevice(key)}
          >
            {key === "desktop" ? "Desktop" : key === "tablet" ? "Tablet" : "Mobilni"}
          </Button>
        ))}
        <Button size="sm" variant="outline" onClick={() => window.open(src, "_blank")}>
          Otvori u novom tabu
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={async () => {
            await navigator.clipboard.writeText(`${window.location.origin}/${slug}`);
            toast.success("Link je kopiran.");
          }}
        >
          Kopiraj link
        </Button>
        <Button
          size="sm"
          variant={version === "draft" ? "default" : "outline"}
          onClick={() => setVersion(version === "draft" ? "published" : "draft")}
        >
          {version === "draft" ? "Skica" : "Objavljeno"}
        </Button>
      </div>
      <div className="overflow-hidden rounded-2xl border bg-muted/30 p-3">
        <iframe
          title="Pregled sajta"
          src={src}
          className="mx-auto h-[720px] rounded-xl bg-background shadow"
          style={{ width: FRAMES[device], maxWidth: "100%" }}
        />
      </div>
    </div>
  );
}

export function PreviewLink({ slug }: { slug: string }) {
  return (
    <code className="text-xs">
      {typeof window === "undefined" ? `/${slug}` : `${window.location.origin}/${slug}`}
    </code>
  );
}
