export function DatabaseSetupScreen() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-lg rounded-3xl border border-border/80 bg-card/80 p-8 shadow-xl">
        <p className="text-xs tracking-[0.2em] text-primary uppercase">StudioForge</p>
        <h1 className="font-heading mt-3 text-4xl">Baza nije povezana</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Deploy je uspeo, ali produkcija nema PostgreSQL. Admin panel čita firme, pipeline i
          generisanja iz baze, zato ova stranica ne može da se učita dok ne dodaš Neon ili Prisma
          Postgres.
        </p>
        <ol className="mt-6 list-decimal space-y-2 pl-5 text-sm leading-6">
          <li>
            U Vercel projektu otvori Settings → Environment Variables i dodaj{" "}
            <code className="rounded bg-muted px-1.5 py-0.5">DATABASE_URL</code> i{" "}
            <code className="rounded bg-muted px-1.5 py-0.5">DIRECT_URL</code>.
          </li>
          <li>
            Postavi{" "}
            <code className="rounded bg-muted px-1.5 py-0.5">NEXT_PUBLIC_APP_URL</code> na
            produkcijski URL, npr.{" "}
            <code className="rounded bg-muted px-1.5 py-0.5">https://vmtech-forge-six.vercel.app</code>
            .
          </li>
          <li>
            Pokreni migracije:{" "}
            <code className="rounded bg-muted px-1.5 py-0.5">pnpm prisma migrate deploy</code>
          </li>
          <li>Redeploy na Vercel.</li>
        </ol>
      </div>
    </main>
  );
}
