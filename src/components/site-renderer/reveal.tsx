"use client";

import { cn } from "@/lib/utils";

export function Reveal({
  id,
  animation,
  className,
  children,
}: {
  id?: string;
  animation?: "none" | "fade-up" | "reveal" | null;
  className?: string;
  children: React.ReactNode;
}) {
  const motion = animation ?? "fade-up";

  return (
    <div
      id={id}
      className={cn(
        "scroll-mt-28",
        motion !== "none" && "site-reveal",
        className,
      )}
    >
      {children}
    </div>
  );
}
