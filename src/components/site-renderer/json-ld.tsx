import type { SiteSpec } from "@/lib/site-spec/schema";

export function JsonLd({ spec, slug }: { spec: SiteSpec; slug: string }) {
  const organization = {
    "@context": "https://schema.org",
    "@type": spec.business.address || spec.business.city ? "LocalBusiness" : "Organization",
    name: spec.business.name,
    description: spec.seo.description,
    url: `/${slug}`,
    telephone: spec.business.phone,
    email: spec.business.email,
    address: spec.business.address
      ? {
          "@type": "PostalAddress",
          streetAddress: spec.business.address,
          addressLocality: spec.business.city,
        }
      : undefined,
  };
  const products = spec.pages
    .flatMap((page) => page.sections)
    .filter((section) => section.type === "products")
    .flatMap((section) => section.content.items)
    .map((item) => ({
      "@context": "https://schema.org",
      "@type": "Product",
      name: item.title,
      description: item.body,
    }));

  return (
    <>
      <script type="application/ld+json">{JSON.stringify(organization)}</script>
      {products.length > 0 ? (
        <script type="application/ld+json">{JSON.stringify(products)}</script>
      ) : null}
    </>
  );
}
