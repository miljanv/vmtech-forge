import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privatnost",
  robots: { index: false, follow: false },
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="font-heading text-4xl">Privatnost</h1>
      <p className="mt-6 text-muted-foreground leading-7">
        StudioForge je interni alat agencije. Javni predlozi sajtova su neindeksirani
        pregledi i nisu zvanični sajtovi prikazanih firmi. Ne čuvamo sirove IP adrese
        posetilaca pregleda.
      </p>
    </main>
  );
}
