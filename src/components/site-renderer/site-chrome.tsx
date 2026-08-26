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
  const overlay = spec.navigation.style === "transparent-overlay";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
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
  const solid = !overlay || scrolled || open;

  return (
    <>
      {demoMode ? (
        <div className="bg-[var(--site-primary)] px-4 py-2 text-center text-[11px] tracking-[0.18em] text-[var(--site-primary-fg)] uppercase">
          Demo predlog sajta — ovo nije zvanični sajt {spec.business.name}
        </div>
      ) : null}
      <header
        className={cn(
          "sticky top-0 z-30 transition duration-500",
          solid
            ? "border-b border-[var(--site-border)]/70 bg-[var(--site-bg)]/82 backdrop-blur-xl"
            : "border-b border-transparent bg-transparent text-white",
        )}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <Link href={resolveHref("/")} className="font-heading text-2xl tracking-tight">
            {spec.business.shortName}
          </Link>
          <nav className="hidden items-center gap-8 text-[13px] tracking-[0.14em] uppercase md:flex">
            {spec.navigation.items.map((item) => (
              <NavItem key={`${item.label}-${item.href}`} href={resolveHref(item.href)} className="opacity-70 transition hover:opacity-100">
                {item.label}
              </NavItem>
            ))}
            {cta?.ctaHref ? (
              <NavItem
                href={resolveHref(cta.ctaHref.startsWith("/") || cta.ctaHref.startsWith("#") ? cta.ctaHref : "/kontakt")}
                className="rounded-full bg-[var(--site-primary)] px-4 py-2 text-[11px] text-[var(--site-primary-fg)] opacity-100"
              >
                {cta.ctaLabel ?? "Kontakt"}
              </NavItem>
            ) : null}
          </nav>
          <button
            className="rounded-full border border-current/20 px-4 py-2 text-sm md:hidden"
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            Meni
          </button>
        </div>
        {open ? (
          <nav className="flex flex-col gap-3 border-t border-[var(--site-border)] bg-[var(--site-bg)] px-4 py-4 text-[var(--site-fg)] md:hidden">
            {spec.navigation.items.map((item) => (
              <NavItem key={`m-${item.label}-${item.href}`} href={resolveHref(item.href)} onClick={() => setOpen(false)}>
                {item.label}
              </NavItem>
            ))}
          </nav>
        ) : null}
      </header>
      {children}
      <footer className="border-t border-[var(--site-border)] px-4 py-20">
        <div className="mx-auto max-w-6xl md:flex md:items-end md:justify-between">
          <div>
            <h2 className="font-heading text-4xl md:text-5xl">{spec.footer.heading}</h2>
            <p className="mt-4 max-w-xl leading-8 text-[var(--site-muted-fg)]">{spec.footer.body}</p>
          </div>
          <p className="mt-8 text-xs tracking-[0.18em] text-[var(--site-muted-fg)] uppercase md:mt-0">
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
