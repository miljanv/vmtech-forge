"use client";

import { useEffect, useState } from "react";
import { SiteImage } from "@/components/site-renderer/site-image";
import { cn } from "@/lib/utils";

export function GalleryFilmstrip({
  images,
  heading,
}: {
  images: string[];
  heading: string;
}) {
  const slides = images.length > 0 ? images : ["a", "b", "c"];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides.length < 2) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % slides.length);
    }, 4200);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-[1200px] px-5 md:px-10">
        <p className="flex items-center gap-3 text-[11px] tracking-[0.36em] text-[var(--site-muted-fg)] uppercase">
          <span className="h-px w-8 bg-[var(--site-border)]" />
          Atelje
        </p>
        <h2 className="font-heading mt-5 text-4xl md:text-6xl">{heading}</h2>
      </div>
      <div className="relative mt-12 overflow-hidden">
        <div
          className="flex transition-transform duration-700 ease-out"
          style={{ transform: `translateX(-${index * 68}%)` }}
        >
          {slides.map((src, slideIndex) => (
            <div key={`${src}-${slideIndex}`} className="w-[86%] shrink-0 px-3 md:w-[68%] md:px-5">
              <SiteImage
                src={images[slideIndex]}
                alt=""
                seed={`${heading}-${slideIndex}`}
                className="aspect-[16/10] w-full rounded-[1.8rem] md:rounded-[2.2rem]"
              />
            </div>
          ))}
        </div>
        <div className="mx-auto mt-8 flex max-w-[1200px] items-center justify-end gap-3 px-5 md:px-10">
          {slides.map((src, slideIndex) => (
            <button
              key={`gdot-${src}-${slideIndex}`}
              type="button"
              aria-label={`Galerija ${slideIndex + 1}`}
              className={cn(
                "h-px transition-all",
                slideIndex === index ? "w-12 bg-[var(--site-fg)]" : "w-6 bg-[var(--site-fg)]/25",
              )}
              onClick={() => setIndex(slideIndex)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
