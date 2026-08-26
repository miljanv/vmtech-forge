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
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="font-heading text-4xl md:text-6xl">{heading}</h2>
      </div>
      <div className="relative mt-10 overflow-hidden">
        <div
          className="flex transition-transform duration-700 ease-out"
          style={{ transform: `translateX(-${index * 72}%)` }}
        >
          {slides.map((src, slideIndex) => (
            <div key={`${src}-${slideIndex}`} className="w-[72%] shrink-0 px-2 md:px-4">
              <SiteImage
                src={images[slideIndex]}
                alt=""
                seed={`${heading}-${slideIndex}`}
                className="aspect-[16/10] w-full rounded-[calc(var(--site-radius)+1.25rem)]"
              />
            </div>
          ))}
        </div>
        <div className="mx-auto mt-8 flex max-w-6xl justify-end gap-2 px-4">
          {slides.map((src, slideIndex) => (
            <button
              key={`gdot-${src}-${slideIndex}`}
              type="button"
              className={cn(
                "h-1.5 rounded-full",
                slideIndex === index ? "w-8 bg-[var(--site-primary)]" : "w-3 bg-[var(--site-border)]",
              )}
              onClick={() => setIndex(slideIndex)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
