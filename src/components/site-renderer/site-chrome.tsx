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

  return (
    <>
      {demoMode ? (
        <div className="bg-[var(--site-primary)] px-4 py-2 text-center text-xs tracking-wide text-[var(--site-primary-fg)]">
          Demo predlog sajta — ovo nije zvanični sajt {spec.business.name}
        </div>
      ) : null}
      <header className="sticky top-0 z-20 border-b border-[var(--site-border)] bg-[var(--site-bg)]/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <Link href={href("/")} className="font-heading text-xl">
            {spec.business.shortName}
          </Link>
          <nav className="hidden items-center gap-6 text-sm md:flex">
            {spec.navigation.items.map((item) => (
              <Link key={item.href} href={href(item.href)} className="hover:opacity-70">
                {item.label}
              </Link>
            ))}
          </nav>
          <button
            className="md:hidden"
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
      <footer className="border-t border-[var(--site-border)] px-4 py-12">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-heading text-2xl">{spec.footer.heading}</h2>
          <p className="mt-3 max-w-xl text-[var(--site-muted-fg)]">{spec.footer.body}</p>
          <p className="mt-8 text-xs text-[var(--site-muted-fg)]">{spec.footer.copyright}</p>
        </div>
      </footer>
    </>
  );
}
