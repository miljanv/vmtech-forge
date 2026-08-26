export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="text-xs tracking-[0.2em] uppercase">404</p>
      <h1 className="font-heading mt-3 text-4xl">Stranica nije pronađena</h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        Predlog sajta ne postoji, nije objavljen ili je adresa netačna.
      </p>
    </main>
  );
}
