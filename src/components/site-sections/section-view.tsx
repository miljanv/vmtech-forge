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
    return <Hero section={section} images={images} href={href} />;
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
    return <Contact section={section} href={href} />;
  }
  if (section.type === "trust" || section.type === "features" || section.type === "faq") {
    return <Trust section={section} />;
  }
  if (
    section.type === "delivery" ||
    section.type === "location" ||
    section.type === "materials" ||
    section.type === "testimonials" ||
    section.type === "social"
  ) {
    return (
      <section className="mx-auto max-w-[1200px] px-5 py-20 md:px-10 md:py-28">
        <SectionLabel>{section.content.eyebrow ?? section.content.heading}</SectionLabel>
        <h2 className="font-heading mt-5 max-w-3xl text-4xl tracking-tight md:text-6xl">
          {section.content.heading}
        </h2>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-[var(--site-muted-fg)]">
          {section.content.body}
        </p>
        <ul className="mt-12 divide-y divide-[var(--site-border)] border-y border-[var(--site-border)]">
          {section.content.items.map((item) => (
            <li key={item.title} className="grid gap-2 py-6 md:grid-cols-[240px_1fr] md:gap-10">
              <strong className="text-[15px] tracking-tight">{item.title}</strong>
              <span className="leading-7 text-[var(--site-muted-fg)]">{item.body}</span>
            </li>
          ))}
        </ul>
      </section>
    );
  }
  return null;
}

function SectionLabel({ children }: { children?: string | null }) {
  if (!children) return null;
  return (
    <p className="flex items-center gap-3 text-[11px] tracking-[0.36em] text-[var(--site-muted-fg)] uppercase">
      <span className="h-px w-8 bg-[var(--site-border)]" />
      {children}
    </p>
  );
}

function EditorialHeading({
  text,
  as: Tag = "h1",
  className,
}: {
  text: string;
  as?: "h1" | "h2";
  className: string;
}) {
  const words = text.trim().split(/\s+/);
  if (words.length < 2) {
    return <Tag className={className}>{text}</Tag>;
  }
  const last = words.pop()!;
  return (
    <Tag className={className}>
      {words.join(" ")}{" "}
      <em className="font-heading italic font-normal">{last}</em>
    </Tag>
  );
}

function CtaLink({
  href,
  children,
  inverted = false,
}: {
  href?: string;
  children: React.ReactNode;
  inverted?: boolean;
}) {
  if (!href || !children) return null;
  return (
    <Link
      href={href}
      className={
        inverted
          ? "inline-flex items-center gap-3 bg-[var(--site-bg)] px-7 py-3.5 text-[11px] tracking-[0.28em] text-[var(--site-fg)] uppercase transition duration-300 hover:opacity-80"
          : "inline-flex items-center gap-3 bg-[var(--site-fg)] px-7 py-3.5 text-[11px] tracking-[0.28em] text-[var(--site-bg)] uppercase transition duration-300 hover:bg-[var(--site-primary)] hover:text-[var(--site-primary-fg)]"
      }
    >
      {children}
      <span aria-hidden>→</span>
    </Link>
  );
}

function Hero({
  section,
  images,
  href,
}: {
  section: SiteSection;
  images: string[];
  href: (value: string | null) => string | undefined;
}) {
  const heading = section.content.heading ?? "";
  const copy = (
    <>
      <SectionLabel>{section.content.eyebrow}</SectionLabel>
      <EditorialHeading
        text={heading}
        className="font-heading mt-6 max-w-[14ch] text-[2.9rem] leading-[0.92] text-[var(--site-fg)] md:text-[5.4rem] lg:text-[6.4rem]"
      />
      <p className="mt-7 max-w-xl text-lg leading-8 text-[var(--site-muted-fg)] md:text-xl">
        {section.content.body}
      </p>
      <div className="mt-10">
        <CtaLink href={href(section.content.ctaHref)}>{section.content.ctaLabel}</CtaLink>
      </div>
    </>
  );

  if (section.variant === "bold-typographic" && images.length === 0) {
    return (
      <section className="px-5 py-24 md:px-10 md:py-32">
        <EditorialHeading
          text={heading}
          className="font-heading mx-auto max-w-6xl text-[12vw] leading-[0.82] tracking-tight"
        />
        <p className="mx-auto mt-10 max-w-2xl text-xl leading-8 text-[var(--site-muted-fg)]">
          {section.content.body}
        </p>
        <div className="mx-auto mt-10 max-w-2xl">
          <CtaLink href={href(section.content.ctaHref)}>{section.content.ctaLabel}</CtaLink>
        </div>
      </section>
    );
  }

  return (
    <HeroCarousel images={images} alt={heading}>
      {copy}
    </HeroCarousel>
  );
}

function Trust({ section }: { section: SiteSection }) {
  return (
    <section className="mx-auto max-w-[1200px] px-5 py-20 md:px-10 md:py-28">
      <SectionLabel>{section.content.eyebrow ?? "Beleške"}</SectionLabel>
      {section.content.heading ? (
        <EditorialHeading
          as="h2"
          text={section.content.heading}
          className="font-heading mt-5 max-w-3xl text-4xl tracking-tight md:text-6xl"
        />
      ) : null}
      <div className="mt-14 border-t border-[var(--site-border)]">
        {section.content.items.map((item, index) => (
          <article
            key={item.title}
            className="grid gap-4 border-b border-[var(--site-border)] py-8 md:grid-cols-[140px_minmax(0,1fr)] md:gap-12 md:py-10"
          >
            <p className="font-heading text-5xl leading-none tracking-tight text-[var(--site-fg)]/25 md:text-7xl">
              {String(index + 1).padStart(2, "0")}
            </p>
            <div>
              <h3 className="text-2xl tracking-tight md:text-3xl">{item.title}</h3>
              <p className="mt-3 max-w-2xl leading-7 text-[var(--site-muted-fg)]">{item.body}</p>
            </div>
          </article>
        ))}
      </div>
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
  const items = section.content.items;
  const featured = items[0];
  const stacked = items.slice(1, 3);
  const rest = items.slice(3);

  return (
    <section className="mx-auto max-w-[1200px] px-5 py-20 md:px-10 md:py-28">
      <div className="max-w-3xl">
        <SectionLabel>{section.content.eyebrow ?? "Katalog"}</SectionLabel>
        {section.content.heading ? (
          <EditorialHeading
            as="h2"
            text={section.content.heading}
            className="font-heading mt-5 text-4xl tracking-tight md:text-6xl"
          />
        ) : null}
        <p className="mt-4 text-lg leading-8 text-[var(--site-muted-fg)]">{section.content.body}</p>
      </div>

      {featured ? (
        <div className="mt-16 grid items-start gap-10 md:grid-cols-12">
          <ProductTile
            title={featured.title}
            body={featured.body}
            meta={featured.meta}
            src={featured.assetId ? assetMap.get(featured.assetId) : undefined}
            featured
            className="md:col-span-7"
          />
          <div className="flex flex-col gap-10 md:col-span-5">
            {stacked.map((item) => (
              <ProductTile
                key={item.title}
                title={item.title}
                body={item.body}
                meta={item.meta}
                src={item.assetId ? assetMap.get(item.assetId) : undefined}
              />
            ))}
          </div>
        </div>
      ) : null}

      {rest.length > 0 ? (
        <div className="mt-12 grid gap-x-8 gap-y-12 md:grid-cols-3">
          {rest.map((item) => (
            <ProductTile
              key={item.title}
              title={item.title}
              body={item.body}
              meta={item.meta}
              src={item.assetId ? assetMap.get(item.assetId) : undefined}
            />
          ))}
        </div>
      ) : null}

      {section.content.ctaHref ? (
        <div className="mt-14">
          <CtaLink href={href(section.content.ctaHref)}>{section.content.ctaLabel}</CtaLink>
        </div>
      ) : null}
    </section>
  );
}

function ProductTile({
  title,
  body,
  meta,
  src,
  featured = false,
  className,
}: {
  title: string;
  body: string | null;
  meta: string | null;
  src?: string;
  featured?: boolean;
  className?: string;
}) {
  return (
    <article className={className}>
      <SiteImage
        src={src}
        alt={title}
        seed={title}
        className={featured ? "aspect-[4/5] w-full rounded-[1.6rem]" : "aspect-[5/4] w-full rounded-[1.35rem]"}
      />
      <div className="mt-4 flex items-baseline justify-between gap-4 border-t border-[var(--site-border)] pt-4">
        <h3 className={featured ? "text-2xl tracking-tight" : "text-lg tracking-tight"}>{title}</h3>
        {meta ? (
          <p className="shrink-0 text-[11px] tracking-[0.16em] text-[var(--site-muted-fg)] uppercase">{meta}</p>
        ) : null}
      </div>
      {body ? <p className="mt-2 text-sm leading-6 text-[var(--site-muted-fg)]">{body}</p> : null}
    </article>
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
    <section className="mx-auto grid max-w-[1200px] items-center gap-12 px-5 py-24 md:grid-cols-[1.1fr_0.9fr] md:px-10">
      <div>
        <SectionLabel>{section.content.eyebrow ?? "Priča"}</SectionLabel>
        {section.content.heading ? (
          <EditorialHeading
            as="h2"
            text={section.content.heading}
            className="font-heading mt-5 text-4xl leading-[0.95] md:text-6xl"
          />
        ) : null}
        <p className="font-heading mt-8 max-w-xl text-2xl leading-10 font-normal italic text-[var(--site-muted-fg)]">
          {section.content.body}
        </p>
        {section.content.ctaHref ? (
          <div className="mt-10">
            <CtaLink href={href(section.content.ctaHref)}>{section.content.ctaLabel}</CtaLink>
          </div>
        ) : null}
      </div>
      <SiteImage
        src={image}
        alt={section.content.heading ?? ""}
        seed={section.content.heading ?? "story"}
        className="min-h-[420px] w-full rounded-[2rem] md:rounded-[2.4rem]"
      />
    </section>
  );
}

function Process({ section }: { section: SiteSection }) {
  return (
    <section className="mx-auto max-w-[1200px] px-5 py-20 md:px-10 md:py-28">
      <SectionLabel>{section.content.eyebrow ?? "Redosled"}</SectionLabel>
      {section.content.heading ? (
        <EditorialHeading
          as="h2"
          text={section.content.heading}
          className="font-heading mt-5 text-4xl md:text-6xl"
        />
      ) : null}
      <ol className="mt-16 grid gap-0 md:grid-cols-3">
        {section.content.items.map((item, index) => (
          <li
            key={item.title}
            className="relative border-t border-[var(--site-border)] py-8 md:border-t-0 md:border-l md:px-8 md:py-0 first:md:border-l-0 first:md:pl-0"
          >
            <p className="font-heading text-5xl leading-none text-[var(--site-fg)]/20">
              {item.meta ?? String(index + 1).padStart(2, "0")}
            </p>
            <h3 className="mt-6 text-2xl tracking-tight">{item.title.replace(/^\s*\d+\s*[·.•\-–—]\s*/, "")}</h3>
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
    <section className="overflow-hidden px-5 py-20 md:px-10 md:py-28">
      <div className="mx-auto max-w-[1200px]">
        <SectionLabel>{section.content.eyebrow ?? "Atelje"}</SectionLabel>
        {section.content.heading ? (
          <EditorialHeading
            as="h2"
            text={section.content.heading}
            className="font-heading mt-5 text-4xl md:text-6xl"
          />
        ) : null}
        <div className="relative mt-16 min-h-[28rem] md:min-h-[40rem]">
          <SiteImage
            src={urls[0]}
            alt=""
            seed={`${section.content.heading}-0`}
            className="w-[78%] rounded-[1.8rem] md:w-[64%] md:rounded-[2.2rem] aspect-[16/11]"
          />
          {frames[1] ? (
            <SiteImage
              src={urls[1]}
              alt=""
              seed={`${section.content.heading}-1`}
              className="absolute top-[18%] right-0 w-[48%] rounded-[1.8rem] border-[8px] border-[var(--site-bg)] md:w-[38%] md:rounded-[2.2rem] aspect-[4/5]"
            />
          ) : null}
          {frames[2] ? (
            <SiteImage
              src={urls[2]}
              alt=""
              seed={`${section.content.heading}-2`}
              className="mt-6 ml-[8%] w-[58%] rounded-[1.8rem] md:mt-10 md:w-[42%] md:rounded-[2.2rem] aspect-[5/4]"
            />
          ) : null}
        </div>
      </div>
    </section>
  );
}

function Contact({
  section,
  href,
}: {
  section: SiteSection;
  href: (value: string | null) => string | undefined;
}) {
  return (
    <section className="bg-[var(--site-fg)] px-5 py-24 text-[var(--site-bg)] md:px-10 md:py-32">
      <div className="mx-auto max-w-[1200px]">
        <p className="text-[11px] tracking-[0.36em] uppercase opacity-55">
          {section.content.eyebrow ?? "Kontakt"}
        </p>
        {section.content.heading ? (
          <EditorialHeading
            as="h2"
            text={section.content.heading}
            className="font-heading mt-6 max-w-4xl text-4xl leading-[0.95] md:text-7xl"
          />
        ) : null}
        <p className="mt-6 max-w-2xl text-lg leading-8 opacity-70">{section.content.body}</p>
        <ul className="mt-10 max-w-xl space-y-3 text-base opacity-80">
          {section.content.items.map((item) => (
            <li key={item.title} className="border-t border-current/15 pt-3">
              <strong className="tracking-tight">{item.title}</strong>
              <span className="mt-1 block opacity-80">{item.body}</span>
            </li>
          ))}
        </ul>
        <div className="mt-12">
          <CtaLink href={href(section.content.ctaHref)} inverted>
            {section.content.ctaLabel}
          </CtaLink>
        </div>
      </div>
    </section>
  );
}
