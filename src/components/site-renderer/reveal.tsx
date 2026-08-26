"use client";

import { useEffect, useRef, useState } from "react";
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
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(motion === "none");

  useEffect(() => {
    if (motion === "none") return;
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [motion]);

  return (
    <div
      id={id}
      ref={ref}
      className={cn(
        "scroll-mt-28",
        motion !== "none" && "site-reveal",
        motion === "reveal" && "site-reveal-clip",
        visible && "is-in",
        className,
      )}
    >
      {children}
    </div>
  );
}
