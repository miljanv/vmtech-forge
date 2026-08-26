# Adding a website section variant

See `docs/architecture.md`. The short version:

- Variants are strings in `src/lib/site-spec/variants.ts`.
- Rendering is a switch in `src/components/site-sections/section-view.tsx`.
- Validation rejects anything not in the registry.
- Facts still win: never add an empty section just to fill a layout.
