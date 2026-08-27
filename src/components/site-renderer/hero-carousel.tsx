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
  const secondary = slides[(index + 1) % Math.max(slides.length, 1)];

  useEffect(() => {
    if (slides.length < 2 || paused) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % slides.length);
    }, 6400);
    return () => window.clearInterval(timer);
  }, [slides.length, paused]);

  return (
    <section
      className="relative bg-[var(--site-bg)] px-4 pb-8 pt-2 md:px-8 md:pb-12"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="mx-auto grid min-h-[calc(100svh-6.5rem)] max-w-[1440px] items-center gap-8 md:grid-cols-[minmax(0,0.92fr)_minmax(280px,1.08fr)] md:gap-12 lg:gap-16">
        <div className="order-2 flex flex-col justify-center py-6 md:order-1 md:py-16">
          {children}
          {slides.length > 1 ? (
            <div className="mt-12 flex items-center gap-3">
              {slides.map((src, slideIndex) => (
                <button
                  key={`dot-${src}-${slideIndex}`}
                  type="button"
                  aria-label={`Slika ${slideIndex + 1}`}
                  className={cn(
                    "h-px transition-all",
                    slideIndex === index ? "w-12 bg-[var(--site-fg)]" : "w-6 bg-[var(--site-fg)]/25",
                  )}
                  onClick={() => setIndex(slideIndex)}
                />
              ))}
              <span className="ml-2 text-[11px] tracking-[0.28em] text-[var(--site-muted-fg)] uppercase">
                {String(index + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
              </span>
            </div>
          ) : null}
        </div>

        <div className="relative order-1 mx-auto w-full max-w-[680px] md:order-2 md:max-w-none">
          <div className="relative overflow-hidden rounded-[2rem] md:rounded-[2.6rem]">
            {slides.length > 0 ? (
              slides.map((src, slideIndex) => (
                <div
                  key={`${src}-${slideIndex}`}
                  className={cn(
                    slideIndex === 0 ? "relative" : "absolute inset-0",
                    "transition-opacity duration-[1400ms] ease-out",
                    slideIndex === index ? "opacity-100" : "opacity-0",
                  )}
                  aria-hidden={slideIndex !== index}
                >
                  <SiteImage
                    src={src}
                    alt={slideIndex === index ? alt : ""}
                    seed={alt}
                    className="aspect-[4/5] w-full site-ken md:aspect-[5/6]"
                  />
                </div>
              ))
            ) : (
              <SiteImage src={undefined} alt={alt} seed={alt} className="aspect-[4/5] w-full md:aspect-[5/6]" />
            )}
          </div>
          {slides.length > 1 && secondary ? (
            <div className="absolute -bottom-5 -left-3 hidden size-[7.5rem] overflow-hidden rounded-full border-[6px] border-[var(--site-bg)] shadow-[0_18px_40px_-24px_rgba(0,0,0,0.45)] md:block lg:-left-8 lg:size-40">
              <SiteImage src={secondary} alt="" seed={`${alt}-orb`} className="size-full" />
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
