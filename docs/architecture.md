# SiteSpec architecture

StudioForge never asks a model to write React, CSS, SQL, or JavaScript.

1. Public URLs are crawled and sanitized.
2. An extractor model returns `BusinessFacts`.
3. A designer model returns `DesignProfile`.
4. A planner model returns `SiteSpec`.
5. Zod validation, contrast checks, asset ownership, reserved variants, and fingerprint similarity run before save.
6. `SitePageView` maps each section `type` + `variant` to a prebuilt component.

`SiteSpec` lives in PostgreSQL JSONB on `SiteVersion`. Public visitors see only the published version. Admins can open `?preview=1`.

## Adding a section variant

1. Add the variant id to the matching array in `src/lib/site-spec/variants.ts`.
2. Teach the renderer how to display it in `src/components/site-sections/section-view.tsx`.
3. Keep the LLM constrained to that allow-list. Unknown variants fail validation.
4. Add a screenshot or note in this file if the layout is a new visual archetype.

Do not introduce `eval`, `new Function`, generated imports, or HTML from the model.
