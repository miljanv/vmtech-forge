import { getSettings } from "@/server/services/settings";
import { SettingsForm } from "@/components/admin/settings-form";
import { getEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const settings = await getSettings();
  const env = getEnv();
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs tracking-[0.2em] text-primary uppercase">Studio</p>
        <h1 className="font-heading mt-2 text-4xl">Podešavanja</h1>
      </div>
      <SettingsForm
        similarityThreshold={settings.similarityThreshold}
        followUpBusinessDays={settings.followUpBusinessDays}
        demoBadgeEnabled={settings.demoBadgeEnabled}
      />
      <div className="rounded-2xl border p-4 text-sm text-muted-foreground">
        <p>Demo režim: {env.demoMode ? "uključen" : "isključen"}</p>
        <p>Clerk: {env.clerkEnabled ? "povezan" : "nije podešen"}</p>
        <p>
          OpenAI:{" "}
          {env.openaiEnabled
            ? `povezan · ${env.OPENAI_MODEL_EXTRACTOR} / ${env.OPENAI_MODEL_DESIGNER}`
            : "nije podešen — koristi se mock, dashboard ostaje na 0 requestova"}
        </p>
        <p>Trigger.dev: {env.triggerEnabled ? "povezan" : "nije podešen"}</p>
        <p>
          R2: {env.r2Enabled ? "povezan" : "lokalni storage"} — slike se serviraju
          preko /media. Lokalni disk na Vercel-u nestaje posle deploya, zato je R2
          potreban da fajlovi ostanu.
        </p>
        {env.openaiEnabled && !env.triggerEnabled ? (
          <p className="mt-3 text-foreground">
            Generisanje trenutno ide preko Vercel funkcije. Ako crawl potroši limit,
            OpenAI se uopšte ne pozove — zato dashboard ostaje na 0 tokena. Za pouzdan
            GPT-5.6 dodaj <code className="rounded bg-muted px-1.5">TRIGGER_SECRET_KEY</code>{" "}
            ili Vercel Pro.
          </p>
        ) : null}
      </div>
    </div>
  );
}
