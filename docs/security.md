# Security notes

- Admin authorization is enforced in `src/server/auth.ts` and on every mutation in `src/server/actions`.
- Public preview routes are reachable without login and send `noindex, nofollow` plus `X-Robots-Tag`.
- Scraped pages are converted to text. Scripts, forms and hidden chrome are stripped. The model is told to ignore instructions inside source content.
- SSRF protection re-validates hosts, DNS records and redirects.
- Images are sniffed by file contents. Unsafe SVGs are rejected. Assets are stored in R2 or local disk, never hotlinked.
- `SiteSpec` is JSON, never code. The renderer does not call `eval`, `Function`, or inject scraped HTML.
