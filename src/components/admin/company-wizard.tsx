"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { createCompanyAction } from "@/server/actions";
import { parseUrlList } from "@/lib/validation/company";
import { normalizeSlug } from "@/lib/validation/slug";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

const STEPS = ["Osnovni podaci", "Izvori", "Generisanje"];

export function CompanyWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [pending, setPending] = useState(false);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    notes: "",
    preferredLanguage: "sr-Latn",
    sourceText: "",
    instagramUrl: "",
    facebookUrl: "",
    googleMapsUrl: "",
    marketplaceUrl: "",
    generateImmediately: true,
    preferredCta: "Poručite",
    designNotes: "",
    contentNotes: "",
    permissionConfirmed: false,
  });

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => {
      const next = { ...current, [key]: value };
      if (key === "name" && !current.slug) {
        next.slug = normalizeSlug(String(value));
      }
      return next;
    });
  }

  async function submit() {
    setPending(true);
    const result = await createCompanyAction({
      ...form,
      sourceUrls: parseUrlList(form.sourceText),
    });
    setPending(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Firma je kreirana.");
    router.push(`/admin/companies/${result.data.id}`);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <ol className="flex gap-2 text-sm">
        {STEPS.map((label, index) => (
          <li
            key={label}
            className={index === step ? "font-medium text-foreground" : "text-muted-foreground"}
          >
            {index + 1}. {label}
          </li>
        ))}
      </ol>

      {step === 0 ? (
        <div className="grid gap-4">
          <Field label="Naziv firme (opciono)">
            <Input value={form.name} onChange={(e) => update("name", e.target.value)} />
          </Field>
          <Field label="Željeni slug">
            <Input value={form.slug} onChange={(e) => update("slug", e.target.value)} />
          </Field>
          <Field label="Kontakt osoba">
            <Input value={form.contactName} onChange={(e) => update("contactName", e.target.value)} />
          </Field>
          <Field label="Email">
            <Input value={form.contactEmail} onChange={(e) => update("contactEmail", e.target.value)} />
          </Field>
          <Field label="Telefon">
            <Input value={form.contactPhone} onChange={(e) => update("contactPhone", e.target.value)} />
          </Field>
          <Field label="Beleške">
            <Textarea value={form.notes} onChange={(e) => update("notes", e.target.value)} />
          </Field>
        </div>
      ) : null}

      {step === 1 ? (
        <div className="grid gap-4">
          <Field label="Javni URL-ovi (do 5, svaki u novom redu)">
            <Textarea
              rows={6}
              value={form.sourceText}
              onChange={(e) => update("sourceText", e.target.value)}
              placeholder="https://..."
            />
          </Field>
          <Field label="Instagram">
            <Input value={form.instagramUrl} onChange={(e) => update("instagramUrl", e.target.value)} />
          </Field>
          <Field label="Facebook">
            <Input value={form.facebookUrl} onChange={(e) => update("facebookUrl", e.target.value)} />
          </Field>
          <Field label="Google Maps">
            <Input value={form.googleMapsUrl} onChange={(e) => update("googleMapsUrl", e.target.value)} />
          </Field>
          <Field label="Marketplace">
            <Input value={form.marketplaceUrl} onChange={(e) => update("marketplaceUrl", e.target.value)} />
          </Field>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="grid gap-4">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={form.generateImmediately}
              onCheckedChange={(value) => update("generateImmediately", Boolean(value))}
            />
            Pokreni generisanje odmah
          </label>
          <Field label="Glavni poziv na akciju">
            <Input value={form.preferredCta} onChange={(e) => update("preferredCta", e.target.value)} />
          </Field>
          <Field label="Napomene za dizajn">
            <Textarea value={form.designNotes} onChange={(e) => update("designNotes", e.target.value)} />
          </Field>
          <Field label="Napomene za sadržaj">
            <Textarea value={form.contentNotes} onChange={(e) => update("contentNotes", e.target.value)} />
          </Field>
          <label className="flex items-start gap-2 text-sm">
            <Checkbox
              checked={form.permissionConfirmed}
              onCheckedChange={(value) => update("permissionConfirmed", Boolean(value))}
            />
            Potvrđujem da smem da koristim navedeni javni sadržaj i slike za interni predlog sajta.
          </label>
        </div>
      ) : null}

      <div className="flex justify-between">
        <Button variant="outline" disabled={step === 0} onClick={() => setStep((value) => value - 1)}>
          Nazad
        </Button>
        {step < 2 ? (
          <Button onClick={() => setStep((value) => value + 1)}>Dalje</Button>
        ) : (
          <Button onClick={submit} disabled={pending}>
            {pending ? "Kreiranje..." : "Kreiraj firmu"}
          </Button>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
