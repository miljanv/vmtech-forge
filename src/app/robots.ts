import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/*/"],
    },
    // Preview sites must stay unlisted; do not add a sitemap of generated pages.
  };
}
