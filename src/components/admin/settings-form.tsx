"use client";

import { useState } from "react";
import { toast } from "sonner";
import { updateSettingsAction } from "@/server/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export function SettingsForm(props: {
  similarityThreshold: number;
  followUpBusinessDays: number;
  demoBadgeEnabled: boolean;
}) {
  const [form, setForm] = useState(props);

  return (
    <form
      className="max-w-xl space-y-5"
      onSubmit={async (event) => {
        event.preventDefault();
        const result = await updateSettingsAction(form);
        if (!result.ok) toast.error(result.error);
        else toast.success("Podešavanja su sačuvana.");
      }}
    >
      <div className="grid gap-2">
        <Label>Prag sličnosti dizajna</Label>
        <Input
          type="number"
          step="0.01"
          value={form.similarityThreshold}
          onChange={(e) => setForm({ ...form, similarityThreshold: Number(e.target.value) })}
        />
      </div>
      <div className="grid gap-2">
        <Label>Follow-up (radni dani)</Label>
        <Input
          type="number"
          value={form.followUpBusinessDays}
          onChange={(e) => setForm({ ...form, followUpBusinessDays: Number(e.target.value) })}
        />
      </div>
      <label className="flex items-center justify-between gap-3 text-sm">
        Bedž „Demo predlog sajta“
        <Switch
          checked={form.demoBadgeEnabled}
          onCheckedChange={(value) => setForm({ ...form, demoBadgeEnabled: Boolean(value) })}
        />
      </label>
      <Button type="submit">Sačuvaj</Button>
    </form>
  );
}
