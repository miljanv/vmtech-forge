"use client";

export function LoginScreen() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-md rounded-3xl border border-border/80 bg-card/80 p-8 shadow-xl">
        <p className="text-xs tracking-[0.2em] text-primary uppercase">StudioForge</p>
        <h1 className="font-heading mt-3 text-4xl">Ulaz u studio</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Panel je trenutno otvoren bez prijave. Preusmeravamo te na kontrolnu tablu.
        </p>
      </div>
    </main>
  );
}
