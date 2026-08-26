"use client";

import { useEffect, useState } from "react";
import { SiteImage } from "@/components/site-renderer/site-image";
import { cn } from "@/lib/utils";

export function HeroCarousel({
  images,
  alt,
  children,
}: {
  images: string[];
  alt: string;
  children: React.ReactNode;
}) {
  const slides = images.filter(Boolean);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (slides.length < 2 || paused) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % slides.length);
    }, 5600);
    return () => window.clearInterval(timer);
  }, [slides.length, paused]);

  return (
    <section
      className="relative min-h-[92vh] overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {slides.length > 0 ? (
        slides.map((src, slideIndex) => (
          <div
            key={`${src}-${slideIndex}`}
            className={cn(
              "absolute inset-0 transition-opacity duration-[1200ms] ease-out",
              slideIndex === index ? "opacity-100" : "opacity-0",
            )}
            aria-hidden={slideIndex !== index}
          >
            <SiteImage
              src={src}
              alt={slideIndex === index ? alt : ""}
              seed={alt}
              className="absolute inset-0 size-full site-ken"
            />
          </div>
        ))
      ) : (
        <SiteImage src={undefined} alt={alt} seed={alt} className="absolute inset-0 size-full" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,transparent,rgba(0,0,0,0.35))]" />
      <div className="relative z-10 mx-auto flex min-h-[92vh] max-w-6xl flex-col justify-end px-4 py-20 text-white md:py-28">
        {children}
        {slides.length > 1 ? (
          <div className="mt-12 flex items-center gap-2">
            {slides.map((src, slideIndex) => (
              <button
                key={`dot-${src}-${slideIndex}`}
                type="button"
                aria-label={`Slika ${slideIndex + 1}`}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  slideIndex === index ? "w-10 bg-white" : "w-3 bg-white/40",
                )}
                onClick={() => setIndex(slideIndex)}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
