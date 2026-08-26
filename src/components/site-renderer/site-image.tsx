"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function SiteImage({
  src,
  alt,
  className,
  seed,
}: {
  src?: string | null;
  alt: string;
  className?: string;
  seed?: string;
}) {
  const usable = Boolean(src) && !isUnusableSrc(src);
  const [failed, setFailed] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);

  useLayoutEffect(() => {
    setFailed(false);
    const image = imageRef.current;
    if (image?.complete && image.naturalWidth === 0) {
      setFailed(true);
    }
  }, [src]);

  if (!usable || failed) {
    return <VisualFallback seed={seed ?? alt} className={className} label={alt} />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={imageRef}
      src={src!}
      alt={alt}
      className={cn("bg-[var(--site-muted)] object-cover", className)}
      onError={() => setFailed(true)}
    />
  );
}

function isUnusableSrc(src?: string | null) {
  if (!src) return true;
  return /localhost|127\.0\.0\.1/.test(src);
}

function VisualFallback({
  seed,
  className,
  label,
}: {
  seed: string;
  className?: string;
  label: string;
}) {
  const palette = paletteFrom(seed);
  const initial = (label.trim()[0] ?? "S").toUpperCase();
  return (
    <div
      className={cn("relative overflow-hidden", className)}
      style={{
        background: `radial-gradient(120% 90% at 12% 18%, ${palette.a} 0%, transparent 55%),
          radial-gradient(90% 80% at 88% 12%, ${palette.b} 0%, transparent 50%),
          linear-gradient(160deg, ${palette.c} 0%, ${palette.d} 100%)`,
      }}
      aria-hidden={label ? undefined : true}
    >
      <div className="absolute inset-0 opacity-30 mix-blend-overlay [background-image:url('data:image/svg+xml,%3Csvg viewBox=%270 0 160 160%27 xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cfilter id=%27n%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%27.75%27 numOctaves=%273%27 stitchTiles=%27stitch%27/%3E%3C/filter%3E%3Crect width=%27100%25%27 height=%27100%25%27 filter=%27url(%23n)%27/%3E%3C/svg%3E')]" />
      <span className="font-heading absolute bottom-6 left-6 text-6xl text-white/80 md:text-8xl">
        {initial}
      </span>
    </div>
  );
}

function paletteFrom(seed: string) {
  const n = [...seed].reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const palettes = [
    { a: "#E8D5B5", b: "#8C4A2F", c: "#1F1A16", d: "#5C3A2A" },
    { a: "#CDE4D6", b: "#1F4E45", c: "#0E231F", d: "#2F6B5E" },
    { a: "#F2C9C1", b: "#7A2E3A", c: "#1A1214", d: "#4C2430" },
    { a: "#D7E3F0", b: "#2B4C7E", c: "#101826", d: "#1E3A5F" },
    { a: "#F4E1B5", b: "#C07820", c: "#24180A", d: "#6B4A1A" },
  ];
  return palettes[n % palettes.length] ?? palettes[0];
}
