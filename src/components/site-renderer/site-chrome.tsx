"use client";

import Link from "next/link";
import { useState } from "react";
import type { SiteSpec } from "@/lib/site-spec/schema";

export function SiteChrome({
  spec,
  slug,
  demoMode,
  children,
}: {
  spec: SiteSpec;
  slug: string;
  demoMode: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const href = (path: string) => `/${slug}${path === "/" ? "" : path}`;
  const cta = spec.pages[0]?.sections.find((section) => section.content.ctaHref)?.content;

  return (
    <>
      {demoMode ? (
        <div className="bg-[var(--site-primary)] px-4 py-2 text-center text-[11px] tracking-[0.18em] text-[var(--site-primary-fg)] uppercase">
          Demo predlog sajta — ovo nije zvanični sajt {spec.business.name}
        </div>
      ) : null}
      <header className="sticky top-0 z-20 border-b border-[var(--site-border)]/70 bg-[var(--site-bg)]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <Link href={href("/")} className="font-heading text-2xl tracking-tight">
            {spec.business.shortName}
          </Link>
          <nav className="hidden items-center gap-7 text-sm md:flex">
            {spec.navigation.items.map((item) => (
              <Link key={item.href} href={href(item.href)} className="opacity-80 transition hover:opacity-100">
                {item.label}
              </Link>
            ))}
            {cta?.ctaHref ? (
              <Link
                href={href(cta.ctaHref.startsWith("/") ? cta.ctaHref : "/kontakt")}
                className="rounded-full bg-[var(--site-primary)] px-4 py-2 text-[var(--site-primary-fg)]"
              >
                {cta.ctaLabel ?? "Kontakt"}
              </Link>
            ) : null}
          </nav>
          <button
            className="rounded-full border border-[var(--site-border)] px-4 py-2 text-sm md:hidden"
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            Meni
          </button>
        </div>
        {open ? (
          <nav className="flex flex-col gap-3 border-t border-[var(--site-border)] px-4 py-4 md:hidden">
            {spec.navigation.items.map((item) => (
              <Link key={item.href} href={href(item.href)} onClick={() => setOpen(false)}>
                {item.label}
              </Link>
            ))}
          </nav>
        ) : null}
      </header>
      {children}
      <footer className="border-t border-[var(--site-border)] px-4 py-16">
        <div className="mx-auto max-w-6xl md:flex md:items-end md:justify-between">
          <div>
            <h2 className="font-heading text-3xl">{spec.footer.heading}</h2>
            <p className="mt-3 max-w-xl leading-7 text-[var(--site-muted-fg)]">{spec.footer.body}</p>
          </div>
          <p className="mt-8 text-xs text-[var(--site-muted-fg)] md:mt-0">{spec.footer.copyright}</p>
        </div>
      </footer>
    </>
  );
}
