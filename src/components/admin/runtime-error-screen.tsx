"use client";

import { Button } from "@/components/ui/button";

export function RuntimeErrorScreen({
  title,
  description,
  onRetry,
}: {
  title: string;
  description: string;
  onRetry: () => void;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="text-xs tracking-[0.2em] text-primary uppercase">Greška</p>
      <h1 className="font-heading mt-3 text-4xl">{title}</h1>
      <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
      <Button className="mt-6" onClick={onRetry}>
        Pokušaj ponovo
      </Button>
    </main>
  );
}
