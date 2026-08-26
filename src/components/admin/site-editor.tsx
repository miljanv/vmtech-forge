"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { SiteSpec } from "@/lib/site-spec/schema";
import { variantsForType } from "@/lib/site-spec/variants";
import { regenerateSectionAction, saveSiteSpecAction } from "@/server/actions";
import { Button } from "@/components/ui/button";

export function SiteEditor({
  companyId,
  siteId,
  spec,
}: {
  companyId: string;
  siteId: string;
  spec: SiteSpec;
}) {
  const [draft, setDraft] = useState(spec);
  const home = draft.pages[0];

  function move(index: number, direction: -1 | 1) {
    const next = structuredClone(draft);
    const sections = next.pages[0]?.sections ?? [];
    const target = index + direction;
    if (target < 0 || target >= sections.length) return;
    const [item] = sections.splice(index, 1);
    sections.splice(target, 0, item);
    next.pages[0].sections = sections;
    setDraft(next);
  }

  return (
    <div className="space-y-4">
      {home?.sections.map((section, index) => (
        <div key={section.id} className="rounded-xl border p-3 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-medium">
              {section.type} · {section.variant}
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => move(index, -1)}>
                Gore
              </Button>
              <Button size="sm" variant="outline" onClick={() => move(index, 1)}>
                Dole
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  regenerateSectionAction({
                    companyId,
                    siteId,
                    sectionId: section.id,
                    mode: "copy",
                  })
                }
              >
                Regeneriši tekst
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  regenerateSectionAction({
                    companyId,
                    siteId,
                    sectionId: section.id,
                    mode: "section",
                  })
                }
              >
                Regeneriši sekciju
              </Button>
            </div>
          </div>
          <input
            className="mt-3 w-full rounded-lg border bg-background px-3 py-2"
            value={section.content.heading ?? ""}
            onChange={(event) => {
              const next = structuredClone(draft);
              next.pages[0].sections[index].content.heading = event.target.value;
              setDraft(next);
            }}
          />
          <select
            className="mt-2 rounded-lg border bg-background px-3 py-2"
            value={section.variant}
            onChange={(event) => {
              const next = structuredClone(draft);
              next.pages[0].sections[index].variant = event.target.value;
              setDraft(next);
            }}
          >
            {variantsForType(section.type).map((variant) => (
              <option key={variant} value={variant}>
                {variant}
              </option>
            ))}
          </select>
          <label className="mt-2 flex items-center gap-2">
            <input
              type="checkbox"
              checked={section.visible}
              onChange={(event) => {
                const next = structuredClone(draft);
                next.pages[0].sections[index].visible = event.target.checked;
                setDraft(next);
              }}
            />
            Vidljiva
          </label>
        </div>
      ))}
      <Button
        onClick={async () => {
          const result = await saveSiteSpecAction(siteId, draft);
          if (!result.ok) toast.error(result.error);
          else toast.success("Nova verzija je sačuvana kao skica.");
        }}
      >
        Sačuvaj kao novu verziju
      </Button>
    </div>
  );
}
