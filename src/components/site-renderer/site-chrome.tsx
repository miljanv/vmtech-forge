"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { SiteSpec } from "@/lib/site-spec/schema";
import { cn } from "@/lib/utils";

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
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 18);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const resolveHref = (path: string) => {
    if (path.startsWith("http") || path.startsWith("tel:") || path.startsWith("mailto:")) return path;
    if (path.startsWith("#")) return `/${slug}${path}`;
    return `/${slug}${path === "/" ? "" : path}`;
  };

  const cta = spec.pages[0]?.sections.find((section) => section.content.ctaHref)?.content;

  return (
    <>
      {demoMode ? (
        <div className="bg-[var(--site-fg)] px-4 py-2 text-center text-[10px] tracking-[0.28em] text-[var(--site-bg)] uppercase">
          Atelje predlog — nije zvanični sajt {spec.business.name}
        </div>
      ) : null}
      <header
        className={cn(
          "sticky top-0 z-30 transition duration-500",
          scrolled
            ? "border-b border-[var(--site-border)] bg-[var(--site-bg)]/90 backdrop-blur-md"
            : "border-b border-transparent bg-[var(--site-bg)]",
        )}
      >
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-5 py-5 md:px-10">
          <Link href={resolveHref("/")} className="font-heading text-xl tracking-tight md:text-2xl">
            {spec.business.shortName}
          </Link>
          <nav className="hidden items-center gap-8 text-[11px] tracking-[0.22em] uppercase md:flex">
            {spec.navigation.items.map((item, index) => (
              <NavItem
                key={`${item.label}-${item.href}`}
                href={resolveHref(item.href)}
                className="text-[var(--site-muted-fg)] transition hover:text-[var(--site-fg)]"
              >
                <span className="mr-2 text-[10px] opacity-50">{String(index + 1).padStart(2, "0")}</span>
                {item.label}
              </NavItem>
            ))}
            {cta?.ctaHref ? (
              <NavItem
                href={resolveHref(cta.ctaHref.startsWith("/") || cta.ctaHref.startsWith("#") ? cta.ctaHref : "/kontakt")}
                className="border-b border-[var(--site-fg)] pb-1 text-[var(--site-fg)]"
              >
                {cta.ctaLabel ?? "Kontakt"}
              </NavItem>
            ) : null}
          </nav>
          <button
            className="text-[11px] tracking-[0.22em] uppercase md:hidden"
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? "Zatvori" : "Indeks"}
          </button>
        </div>
        {open ? (
          <nav className="flex flex-col gap-4 border-t border-[var(--site-border)] px-5 py-6 md:hidden">
            {spec.navigation.items.map((item, index) => (
              <NavItem
                key={`m-${item.label}-${item.href}`}
                href={resolveHref(item.href)}
                onClick={() => setOpen(false)}
                className="text-sm tracking-[0.18em] uppercase"
              >
                {String(index + 1).padStart(2, "0")} — {item.label}
              </NavItem>
            ))}
          </nav>
        ) : null}
      </header>
      {children}
      <footer className="overflow-hidden border-t border-[var(--site-border)] px-5 py-20 md:px-10 md:py-28">
        <p className="text-[11px] tracking-[0.32em] text-[var(--site-muted-fg)] uppercase">
          {spec.business.city ?? "Atelje"}
        </p>
        <h2 className="font-heading mt-6 max-w-[90vw] text-[12vw] leading-[0.86] tracking-[-0.06em]">
          {spec.footer.heading ?? spec.business.shortName}
        </h2>
        <div className="mt-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <p className="max-w-xl text-[15px] leading-8 text-[var(--site-muted-fg)]">{spec.footer.body}</p>
          <p className="text-[11px] tracking-[0.2em] text-[var(--site-muted-fg)] uppercase">
            {spec.footer.copyright}
          </p>
        </div>
      </footer>
    </>
  );
}

function NavItem({
  href,
  className,
  onClick,
  children,
}: {
  href: string;
  className?: string;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  const hashIndex = href.indexOf("#");
  if (hashIndex >= 0) {
    const hash = href.slice(hashIndex);
    return (
      <a
        href={href}
        className={className}
        onClick={(event) => {
          const target = document.getElementById(hash.slice(1));
          if (target) {
            event.preventDefault();
            target.scrollIntoView({ behavior: "smooth", block: "start" });
            history.replaceState(null, "", href);
          }
          onClick?.();
        }}
      >
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={className} onClick={onClick}>
      {children}
    </Link>
  );
}
