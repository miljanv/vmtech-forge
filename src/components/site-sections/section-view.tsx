import Link from "next/link";
import type { SiteSection } from "@/lib/site-spec/schema";
import { SiteImage } from "@/components/site-renderer/site-image";
import { HeroCarousel } from "@/components/site-renderer/hero-carousel";
import { GalleryFilmstrip } from "@/components/site-renderer/gallery-filmstrip";

export function SectionView({
  section,
  assetMap,
  slug,
}: {
  section: SiteSection;
  assetMap: Map<string, string>;
  slug: string;
}) {
  const images = section.assetIds
    .map((id) => assetMap.get(id))
    .filter((value): value is string => Boolean(value));
  const image = images[0];
  const href = (value: string | null) => {
    if (!value) return undefined;
    if (value.startsWith("/")) return `/${slug}${value === "/" ? "" : value}`;
    return value;
  };

  if (section.type === "hero") {
    return <Hero section={section} images={images} image={image} href={href} />;
  }
  if (section.type === "products") {
    return <Products section={section} assetMap={assetMap} href={href} />;
  }
  if (section.type === "story") {
    return <Story section={section} image={image} href={href} />;
  }
  if (section.type === "process") {
    return <Process section={section} />;
  }
  if (section.type === "gallery") {
    return <Gallery section={section} assetMap={assetMap} />;
  }
  if (section.type === "contact" || section.type === "cta") {
    return <Contact section={section} image={image} href={href} />;
  }
  if (section.type === "trust" || section.type === "features" || section.type === "faq") {
    return (
      <section className="mx-auto max-w-6xl px-4 py-20 md:py-28">
        {section.content.heading ? (
          <h2 className="font-heading max-w-3xl text-4xl tracking-tight md:text-5xl">
            {section.content.heading}
          </h2>
        ) : null}
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {section.content.items.map((item, index) => (
            <article
              key={item.title}
              className="group rounded-[calc(var(--site-radius)+0.5rem)] border border-[var(--site-border)] bg-[var(--site-surface)] p-7 shadow-[0_20px_50px_-32px_rgba(0,0,0,0.45)]"
            >
              <p className="text-xs tracking-[0.28em] text-[var(--site-muted-fg)] uppercase">
                {String(index + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-4 text-2xl tracking-tight">{item.title}</h3>
              <p className="mt-3 leading-7 text-[var(--site-muted-fg)]">{item.body}</p>
            </article>
          ))}
        </div>
      </section>
    );
  }
  if (
    section.type === "delivery" ||
    section.type === "location" ||
    section.type === "materials" ||
    section.type === "testimonials" ||
    section.type === "social"
  ) {
    return (
      <section className="mx-auto max-w-5xl px-4 py-20">
        <h2 className="font-heading text-4xl md:text-5xl">{section.content.heading}</h2>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-[var(--site-muted-fg)]">
          {section.content.body}
        </p>
        <ul className="mt-10 divide-y divide-[var(--site-border)]">
          {section.content.items.map((item) => (
            <li key={item.title} className="grid gap-2 py-5 md:grid-cols-[220px_1fr]">
              <strong>{item.title}</strong>
              <span className="text-[var(--site-muted-fg)]">{item.body}</span>
            </li>
          ))}
        </ul>
      </section>
    );
  }
  return null;
}

function CtaLink({
  href,
  children,
}: {
  href?: string;
  children: React.ReactNode;
}) {
  if (!href) return null;
  return (
    <Link
      href={href}
      className="inline-flex items-center rounded-full bg-[var(--site-primary)] px-6 py-3 text-sm font-medium tracking-wide text-[var(--site-primary-fg)] transition hover:opacity-90"
    >
      {children}
    </Link>
  );
}

function Hero({
  section,
  images,
  image,
  href,
}: {
  section: SiteSection;
  images: string[];
  image?: string;
  href: (value: string | null) => string | undefined;
}) {
  const variant = section.variant;
  const cta = (
    <CtaLink href={href(section.content.ctaHref)}>
      {section.content.ctaLabel}
    </CtaLink>
  );
  const seed = section.content.heading ?? "hero";
  const copy = (
    <>
      <p className="text-[11px] tracking-[0.42em] uppercase opacity-80">
        {section.content.eyebrow}
      </p>
      <h1 className="font-heading mt-6 max-w-4xl text-5xl leading-[0.92] md:text-8xl">
        {section.content.heading}
      </h1>
      <p className="mt-7 max-w-xl text-lg leading-8 text-white/78 md:text-xl">
        {section.content.body}
      </p>
      <div className="mt-10">{cta}</div>
    </>
  );

  if (
    variant === "cinematic" ||
    variant === "layered-collage" ||
    variant === "story-first" ||
    variant === "minimal-centered"
  ) {
    return (
      <HeroCarousel images={images} alt={section.content.heading ?? ""}>
        {copy}
      </HeroCarousel>
    );
  }

  if (
    variant === "editorial-split" ||
    variant === "asymmetric-product" ||
    variant === "image-split"
  ) {
    return (
      <section className="mx-auto grid min-h-[80vh] max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:gap-16">
        <div className={variant === "asymmetric-product" ? "md:translate-y-6" : undefined}>
          <p className="text-xs tracking-[0.32em] text-[var(--site-muted-fg)] uppercase">
            {section.content.eyebrow}
          </p>
          <h1 className="font-heading mt-5 text-5xl leading-[0.95] md:text-7xl">
            {section.content.heading}
          </h1>
          <p className="mt-6 text-lg leading-8 text-[var(--site-muted-fg)]">
            {section.content.body}
          </p>
          <div className="mt-8">{cta}</div>
        </div>
        <div className="relative">
          <SiteImage
            src={image}
            alt={section.content.heading ?? ""}
            seed={seed}
            className="aspect-[4/5] w-full rounded-[calc(var(--site-radius)+1rem)]"
          />
          {images[1] ? (
            <SiteImage
              src={images[1]}
              alt=""
              seed={`${seed}-2`}
              className="absolute -right-6 -bottom-8 hidden aspect-[3/4] w-2/5 rounded-[calc(var(--site-radius)+0.75rem)] border-[6px] border-[var(--site-bg)] md:block"
            />
          ) : null}
        </div>
      </section>
    );
  }

  if (variant === "bold-typographic") {
    return (
      <section className="px-4 py-24 md:py-32">
        <h1 className="font-heading mx-auto max-w-6xl text-[14vw] leading-[0.82] tracking-tight">
          {section.content.heading}
        </h1>
        <p className="mx-auto mt-10 max-w-2xl text-xl leading-8 text-[var(--site-muted-fg)]">
          {section.content.body}
        </p>
        <div className="mx-auto mt-10 max-w-2xl">{cta}</div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-4xl px-4 py-28 text-center">
      <p className="text-xs tracking-[0.32em] uppercase">{section.content.eyebrow}</p>
      <h1 className="font-heading mt-5 text-5xl md:text-7xl">{section.content.heading}</h1>
      <p className="mt-6 text-lg leading-8 text-[var(--site-muted-fg)]">{section.content.body}</p>
      <div className="mt-10">{cta}</div>
    </section>
  );
}

function Products({
  section,
  assetMap,
  href,
}: {
  section: SiteSection;
  assetMap: Map<string, string>;
  href: (value: string | null) => string | undefined;
}) {
  const grid =
    section.variant === "horizontal-rail"
      ? "flex gap-5 overflow-x-auto pb-2"
      : section.variant === "masonry-catalog"
        ? "columns-1 gap-5 md:columns-2"
        : "grid gap-6 md:grid-cols-3";

  return (
    <section className="mx-auto max-w-6xl px-4 py-20 md:py-28">
      <div className="max-w-3xl">
        <h2 className="font-heading text-4xl tracking-tight md:text-5xl">
          {section.content.heading}
        </h2>
        <p className="mt-4 text-lg leading-8 text-[var(--site-muted-fg)]">
          {section.content.body}
        </p>
      </div>
      <div className={`mt-12 ${grid}`}>
        {section.content.items.map((item) => {
          const src = item.assetId ? assetMap.get(item.assetId) : undefined;
          return (
            <article
              key={item.title}
              className="group mb-5 break-inside-avoid overflow-hidden rounded-[calc(var(--site-radius)+0.75rem)] bg-[var(--site-surface)] shadow-[0_24px_60px_-36px_rgba(0,0,0,0.5)] transition duration-500 hover:-translate-y-1 hover:shadow-[0_30px_80px_-30px_rgba(0,0,0,0.55)]"
            >
              <SiteImage
                src={src}
                alt={item.title}
                seed={item.title}
                className="aspect-[4/5] w-full transition duration-700 group-hover:scale-[1.03]"
              />
              <div className="p-5">
                <h3 className="text-xl tracking-tight">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--site-muted-fg)]">{item.body}</p>
                {item.meta ? (
                  <p className="mt-4 text-sm font-medium">{item.meta}</p>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
      {section.content.ctaHref ? (
        <div className="mt-10">
          <CtaLink href={href(section.content.ctaHref)}>{section.content.ctaLabel}</CtaLink>
        </div>
      ) : null}
    </section>
  );
}

function Story({
  section,
  image,
  href,
}: {
  section: SiteSection;
  image?: string;
  href: (value: string | null) => string | undefined;
}) {
  return (
    <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-24 md:grid-cols-2">
      <div>
        <p className="text-xs tracking-[0.32em] uppercase">{section.content.eyebrow}</p>
        <h2 className="font-heading mt-4 text-4xl md:text-5xl">{section.content.heading}</h2>
        <p className="mt-6 text-lg leading-8 text-[var(--site-muted-fg)]">{section.content.body}</p>
        {section.content.ctaHref ? (
          <div className="mt-8">
            <CtaLink href={href(section.content.ctaHref)}>{section.content.ctaLabel}</CtaLink>
          </div>
        ) : null}
      </div>
      <SiteImage
        src={image}
        alt={section.content.heading ?? ""}
        seed={section.content.heading ?? "story"}
        className="min-h-[420px] w-full rounded-[calc(var(--site-radius)+1rem)]"
      />
    </section>
  );
}

function Process({ section }: { section: SiteSection }) {
  const vertical = section.variant === "vertical-timeline";
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 md:py-28">
      <h2 className="font-heading text-4xl md:text-5xl">{section.content.heading}</h2>
      <ol className={vertical ? "mt-12 space-y-8" : "mt-12 grid gap-6 md:grid-cols-3"}>
        {section.content.items.map((item) => (
          <li
            key={item.title}
            className="rounded-[calc(var(--site-radius)+0.5rem)] border border-[var(--site-border)] p-6"
          >
            <p className="text-xs tracking-[0.28em] uppercase">{item.meta}</p>
            <h3 className="mt-4 text-2xl">{item.title}</h3>
            <p className="mt-3 leading-7 text-[var(--site-muted-fg)]">{item.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Gallery({
  section,
  assetMap,
}: {
  section: SiteSection;
  assetMap: Map<string, string>;
}) {
  const urls = section.assetIds
    .map((id) => assetMap.get(id))
    .filter((value): value is string => Boolean(value));
  if (section.variant === "filmstrip" || section.variant === "full-carousel") {
    return <GalleryFilmstrip images={urls} heading={section.content.heading ?? "Galerija"} />;
  }
  const frames = urls.length > 0 ? urls : ["a", "b", "c"];
  return (
    <section className="px-4 py-20 md:py-28">
      <div className="mx-auto max-w-6xl">
        <h2 className="font-heading text-4xl md:text-6xl">{section.content.heading}</h2>
        <div className="mt-12 columns-1 gap-4 md:columns-2 lg:columns-3">
          {frames.map((url, index) => (
            <SiteImage
              key={`${url}-${index}`}
              src={urls[index]}
              alt=""
              seed={`${section.content.heading}-${index}`}
              className={`mb-4 w-full ${index % 3 === 0 ? "aspect-[16/10]" : "aspect-[4/5]"}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function Contact({
  section,
  image,
  href,
}: {
  section: SiteSection;
  image?: string;
  href: (value: string | null) => string | undefined;
}) {
  return (
    <section className="relative overflow-hidden px-4 py-24">
      {section.layout.fullBleed || section.variant === "full-bleed-cta" ? (
        <SiteImage
          src={image}
          alt=""
          seed={section.content.heading ?? "contact"}
          className="absolute inset-0 size-full opacity-40"
        />
      ) : null}
      <div className="relative mx-auto max-w-4xl rounded-[2rem] border border-[var(--site-border)] bg-[var(--site-surface)]/92 p-8 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.55)] backdrop-blur md:p-14">
        <h2 className="font-heading text-4xl md:text-5xl">{section.content.heading}</h2>
        <p className="mt-5 text-lg leading-8 text-[var(--site-muted-fg)]">{section.content.body}</p>
        <ul className="mt-8 space-y-3 text-base">
          {section.content.items.map((item) => (
            <li key={item.title}>
              <strong>{item.title}:</strong> {item.body}
            </li>
          ))}
        </ul>
        <div className="mt-10">
          <CtaLink href={href(section.content.ctaHref)}>{section.content.ctaLabel}</CtaLink>
        </div>
      </div>
    </section>
  );
}
