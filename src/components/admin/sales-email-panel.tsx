"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  createEmailAction,
  markEmailSentAction,
} from "@/server/actions";

export function SalesEmailPanel({
  companyId,
  initialSubject,
  initialBody,
  draftId,
  contactEmail,
}: {
  companyId: string;
  initialSubject?: string;
  initialBody?: string;
  draftId?: string;
  contactEmail?: string | null;
}) {
  const [subject, setSubject] = useState(initialSubject ?? "");
  const [body, setBody] = useState(initialBody ?? "");
  const [id, setId] = useState(draftId);

  async function generate() {
    const result = await createEmailAction(companyId);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setSubject(result.data.subject);
    setBody(result.data.body);
    setId(result.data.id);
    toast.success("Mejl je pripremljen.");
  }

  async function copy(text: string, label: string) {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} je kopiran.`);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button onClick={generate}>Generiši mejl</Button>
        <Button variant="outline" onClick={() => copy(subject, "Naslov")} disabled={!subject}>
          Kopiraj naslov
        </Button>
        <Button variant="outline" onClick={() => copy(body, "Tekst")} disabled={!body}>
          Kopiraj tekst
        </Button>
        <Button
          variant="outline"
          disabled={!subject || !body}
          render={
            <a
              href={`mailto:${contactEmail ?? ""}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`}
            />
          }
        >
          Otvori u email aplikaciji
        </Button>
        <Button
          variant="secondary"
          disabled={!id}
          onClick={async () => {
            if (!id) return;
            const result = await markEmailSentAction(id);
            if (!result.ok) toast.error(result.error);
            else toast.success("Mejl je označen kao poslat.");
          }}
        >
          Označi kao poslato
        </Button>
      </div>
      <input
        className="w-full rounded-xl border bg-background px-3 py-2 text-sm"
        value={subject}
        onChange={(event) => setSubject(event.target.value)}
      />
      <textarea
        className="min-h-64 w-full rounded-xl border bg-background px-3 py-2 text-sm leading-6"
        value={body}
        onChange={(event) => setBody(event.target.value)}
      />
    </div>
  );
}
