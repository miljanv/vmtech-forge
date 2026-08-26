# StudioForge

Internal agency operating system for researching Serbian producers, generating unique unlisted website previews, and running a sales pipeline.

The LLM never generates executable code. It returns a validated `SiteSpec` JSON document. A trusted React renderer maps that document onto prebuilt section variants.

## Architecture

- Next.js App Router, Server Components by default
- Prisma + Neon PostgreSQL
- Clerk for authentication, with demo mode when keys are absent
- Trigger.dev for durable generation, with a local `after()` runner in mock mode
- OpenAI Responses API + Structured Outputs, or `MockAIProvider`
- Firecrawl when configured, otherwise native fetch/Cheerio and Playwright fallback
- Cloudflare R2 in production, local `.data/storage` in development

See `docs/architecture.md` for SiteSpec details and how to add a section variant.

## Requirements

- Node.js 20.9+
- pnpm 10+
- A Neon (or other PostgreSQL) database for anything beyond unit tests

## Local setup

```bash
pnpm install
cp .env.example .env.local
```

For a full UI review without paid APIs, keep:

```
STUDIOFORGE_DEMO_MODE=true
```

Then provide at least:

```
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
NEXT_PUBLIC_APP_URL=http://localhost:3000
ADMIN_EMAILS=you@example.com
```

Generate the client, migrate, seed, and start:

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Open `http://localhost:3000/login` and use **Uđi u demo režim**.

## Neon

1. Create a project at [Neon](https://console.neon.tech).
2. Copy the pooled connection string into `DATABASE_URL`.
3. Copy the direct (unpooled) string into `DIRECT_URL`.
4. Run `pnpm db:migrate`.

## Clerk

1. Create an application at [Clerk](https://dashboard.clerk.com).
2. Add `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`.
3. Set the sign-in URL to `/login`.
4. Put allowed operator emails in `ADMIN_EMAILS`.
5. Turn off `STUDIOFORGE_DEMO_MODE` in production.

## OpenAI

1. Create a server-only `OPENAI_API_KEY`. Never expose it as `NEXT_PUBLIC_*`.
2. Optional: `OPENAI_MODEL_EXTRACTOR` (default `gpt-5.6-terra`) and `OPENAI_MODEL_DESIGNER` (default `gpt-5.6`).
3. Responses are sent with `store: false` unless `OPENAI_STORE_RESPONSES=true`.

Without an API key, StudioForge uses `MockAIProvider`.

## Trigger.dev

1. Create a project and set `TRIGGER_SECRET_KEY`, `TRIGGER_PROJECT_ID`, and `NEXT_PUBLIC_TRIGGER_PUBLIC_API_KEY`.
2. Run `pnpm trigger:dev` alongside `pnpm dev`.
3. If Trigger is not configured, generation runs after the HTTP response via Next.js `after()`.

## Firecrawl (optional)

Set `FIRECRAWL_API_KEY`. If it is missing, StudioForge uses native fetch, Cheerio, sitemap-style link discovery, and Playwright as a JavaScript fallback. Crawling stays on submitted hostnames, blocks SSRF targets, and respects robots.txt.

## Cloudflare R2

Set:

```
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_BASE_URL=
```

Without R2, files are stored under `.data/storage` and served from `/media/...`. Do not use the Vercel filesystem in production.

## Commands

```bash
pnpm dev
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
pnpm db:generate
pnpm db:migrate
pnpm db:push
pnpm db:seed
pnpm db:studio
pnpm trigger:dev
```

## Vercel

1. Import the repository.
2. Set production environment variables from `.env.example`. **`DATABASE_URL` and `DIRECT_URL` are required** — without PostgreSQL `/admin` cannot render.
3. Set `NEXT_PUBLIC_APP_URL` to the Vercel URL (not `localhost`).
4. If you want Clerk login, add `vmtech-forge-six.vercel.app` (or your domain) in the Clerk dashboard allowed origins, and keep `STUDIOFORGE_DEMO_MODE=false`. Demo mode skips Clerk protection and is not safe on a public URL.
5. Build command: `pnpm build` (runs `prisma generate`). After the database exists, run `pnpm prisma migrate deploy` against production (`DIRECT_URL`) or add that to the Vercel build command.
6. Attach the Trigger.dev project for durable jobs.
7. Previews are served as `https://your-domain.com/{company-slug}` with `noindex, nofollow`.

## Security notes

- `/admin` and mutation endpoints require an allow-listed Clerk user (or explicit demo mode).
- Scraped HTML is never executed or rendered raw.
- SVG files with scripts or external references are rejected.
- Generation endpoints are rate-limited.
- Logs redact secrets. Client errors stay generic.

## Mock / demo mode

`STUDIOFORGE_DEMO_MODE=true` (or a development environment without Clerk/OpenAI keys) enables:

- Demo login
- Mock crawler
- Mock AI
- Local image placeholders
- Local job runner
