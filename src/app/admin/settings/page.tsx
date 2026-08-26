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
        <p>OpenAI: {env.openaiEnabled ? "povezan" : "mock provajder"}</p>
        <p>Trigger.dev: {env.triggerEnabled ? "povezan" : "lokalni after() runner"}</p>
        <p>R2: {env.r2Enabled ? "povezan" : "lokalni storage"}</p>
      </div>
    </div>
  );
}
