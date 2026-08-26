import Link from "next/link";
import type { SiteSection } from "@/lib/site-spec/schema";

export function SectionView({
  section,
  assetMap,
  slug,
}: {
  section: SiteSection;
  assetMap: Map<string, string>;
  slug: string;
}) {
  const image = section.assetIds.map((id) => assetMap.get(id)).find(Boolean);
  const href = (value: string | null) => {
    if (!value) return undefined;
    if (value.startsWith("/")) return `/${slug}${value === "/" ? "" : value}`;
    return value;
  };

  if (section.type === "hero") {
    return <Hero section={section} image={image} href={href} />;
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
      <section className="mx-auto max-w-6xl px-4 py-16">
        {section.content.heading ? (
          <h2 className="font-heading text-4xl">{section.content.heading}</h2>
        ) : null}
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {section.content.items.map((item) => (
            <article key={item.title} className="rounded-[var(--site-radius)] border border-[var(--site-border)] p-6">
              <h3 className="text-lg">{item.title}</h3>
              <p className="mt-2 text-[var(--site-muted-fg)]">{item.body}</p>
            </article>
          ))}
        </div>
      </section>
    );
  }
  if (section.type === "delivery" || section.type === "location" || section.type === "materials" || section.type === "testimonials" || section.type === "social") {
    return (
      <section className="mx-auto max-w-4xl px-4 py-16">
        <h2 className="font-heading text-4xl">{section.content.heading}</h2>
        <p className="mt-4 max-w-2xl leading-7 text-[var(--site-muted-fg)]">{section.content.body}</p>
        <ul className="mt-6 space-y-2">
          {section.content.items.map((item) => (
            <li key={item.title}>
              <strong>{item.title}</strong> — {item.body}
            </li>
          ))}
        </ul>
      </section>
    );
  }
  return null;
}

function Hero({
  section,
  image,
  href,
}: {
  section: SiteSection;
  image?: string;
  href: (value: string | null) => string | undefined;
}) {
  const variant = section.variant;
  const cta = section.content.ctaHref ? (
    <Link
      href={href(section.content.ctaHref) ?? "#"}
      className="inline-flex rounded-[var(--site-radius)] bg-[var(--site-primary)] px-5 py-3 text-[var(--site-primary-fg)]"
    >
      {section.content.ctaLabel}
    </Link>
  ) : null;

  if (variant === "cinematic") {
    return (
      <section className="relative min-h-[80vh] overflow-hidden">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" className="absolute inset-0 size-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-[var(--site-primary)]" />
        )}
        <div className="absolute inset-0 bg-black/45" />
        <div className="relative mx-auto flex min-h-[80vh] max-w-5xl flex-col justify-end px-4 py-20 text-white">
          <p className="text-sm tracking-[0.2em] uppercase">{section.content.eyebrow}</p>
          <h1 className="font-heading mt-4 max-w-3xl text-5xl md:text-7xl">{section.content.heading}</h1>
          <p className="mt-6 max-w-xl text-lg">{section.content.body}</p>
          <div className="mt-8">{cta}</div>
        </div>
      </section>
    );
  }

  if (variant === "editorial-split" || variant === "asymmetric-product" || variant === "image-split") {
    return (
      <section className="mx-auto grid min-h-[70vh] max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-2">
        <div className={variant === "asymmetric-product" ? "md:translate-y-8" : undefined}>
          <p className="text-sm tracking-[0.2em] uppercase text-[var(--site-muted-fg)]">
            {section.content.eyebrow}
          </p>
          <h1 className="font-heading mt-4 text-5xl md:text-6xl">{section.content.heading}</h1>
          <p className="mt-6 text-lg leading-8 text-[var(--site-muted-fg)]">{section.content.body}</p>
          <div className="mt-8">{cta}</div>
        </div>
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" className="aspect-[4/5] w-full rounded-[var(--site-radius)] object-cover" />
        ) : (
          <div className="aspect-[4/5] rounded-[var(--site-radius)] bg-[var(--site-muted)]" />
        )}
      </section>
    );
  }

  if (variant === "bold-typographic") {
    return (
      <section className="px-4 py-24">
        <h1 className="font-heading mx-auto max-w-6xl text-[12vw] leading-[0.9]">{section.content.heading}</h1>
        <p className="mx-auto mt-8 max-w-2xl text-xl">{section.content.body}</p>
        <div className="mx-auto mt-8 max-w-2xl">{cta}</div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-3xl px-4 py-24 text-center">
      <p className="text-sm tracking-[0.2em] uppercase">{section.content.eyebrow}</p>
      <h1 className="font-heading mt-4 text-5xl">{section.content.heading}</h1>
      <p className="mt-6 text-lg text-[var(--site-muted-fg)]">{section.content.body}</p>
      <div className="mt-8">{cta}</div>
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
      ? "flex gap-4 overflow-x-auto pb-2"
      : section.variant === "masonry-catalog"
        ? "columns-1 gap-4 md:columns-2"
        : "grid gap-6 md:grid-cols-3";

  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <h2 className="font-heading text-4xl">{section.content.heading}</h2>
      <p className="mt-3 max-w-2xl text-[var(--site-muted-fg)]">{section.content.body}</p>
      <div className={`mt-10 ${grid}`}>
        {section.content.items.map((item) => {
          const src = item.assetId ? assetMap.get(item.assetId) : undefined;
          return (
            <article key={item.title} className="mb-4 break-inside-avoid rounded-[var(--site-radius)] bg-[var(--site-surface)] p-4">
              {src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={src} alt="" className="mb-4 aspect-[4/3] w-full object-cover" />
              ) : null}
              <h3 className="text-lg">{item.title}</h3>
              <p className="mt-2 text-sm text-[var(--site-muted-fg)]">{item.body}</p>
              {item.meta ? <p className="mt-3 text-sm">{item.meta}</p> : null}
            </article>
          );
        })}
      </div>
      {section.content.ctaHref ? (
        <Link href={href(section.content.ctaHref) ?? "#"} className="mt-8 inline-flex underline">
          {section.content.ctaLabel}
        </Link>
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
    <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-20 md:grid-cols-2">
      <div>
        <p className="text-sm tracking-[0.2em] uppercase">{section.content.eyebrow}</p>
        <h2 className="font-heading mt-3 text-4xl">{section.content.heading}</h2>
        <p className="mt-5 text-lg leading-8 text-[var(--site-muted-fg)]">{section.content.body}</p>
        {section.content.ctaHref ? (
          <Link href={href(section.content.ctaHref) ?? "#"} className="mt-6 inline-flex underline">
            {section.content.ctaLabel}
          </Link>
        ) : null}
      </div>
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" className="rounded-[var(--site-radius)] object-cover" />
      ) : null}
    </section>
  );
}

function Process({ section }: { section: SiteSection }) {
  const vertical = section.variant === "vertical-timeline";
  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <h2 className="font-heading text-4xl">{section.content.heading}</h2>
      <ol className={vertical ? "mt-10 space-y-8" : "mt-10 grid gap-6 md:grid-cols-3"}>
        {section.content.items.map((item) => (
          <li key={item.title} className="border-t border-[var(--site-border)] pt-4">
            <p className="text-xs tracking-[0.2em] uppercase">{item.meta}</p>
            <h3 className="mt-2 text-xl">{item.title}</h3>
            <p className="mt-2 text-[var(--site-muted-fg)]">{item.body}</p>
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
  const urls = section.assetIds.map((id) => assetMap.get(id)).filter(Boolean) as string[];
  return (
    <section className="px-4 py-16">
      <div className="mx-auto max-w-6xl">
        <h2 className="font-heading text-4xl">{section.content.heading}</h2>
        <div className="mt-8 grid gap-3 md:grid-cols-3">
          {urls.map((url) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={url} src={url} alt="" className="aspect-[4/3] w-full object-cover" />
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
    <section className="relative overflow-hidden px-4 py-20">
      {section.variant === "full-bleed-cta" && image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" className="absolute inset-0 size-full object-cover opacity-30" />
      ) : null}
      <div className="relative mx-auto max-w-4xl rounded-[var(--site-radius)] bg-[var(--site-surface)] p-8 md:p-12">
        <h2 className="font-heading text-4xl">{section.content.heading}</h2>
        <p className="mt-4 text-lg text-[var(--site-muted-fg)]">{section.content.body}</p>
        <ul className="mt-6 space-y-2">
          {section.content.items.map((item) => (
            <li key={item.title}>
              <strong>{item.title}:</strong> {item.body}
            </li>
          ))}
        </ul>
        {section.content.ctaHref ? (
          <Link
            href={href(section.content.ctaHref) ?? "#"}
            className="mt-8 inline-flex rounded-[var(--site-radius)] bg-[var(--site-primary)] px-5 py-3 text-[var(--site-primary-fg)]"
          >
            {section.content.ctaLabel}
          </Link>
        ) : null}
      </div>
    </section>
  );
}
