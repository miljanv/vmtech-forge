"use client";

import { RuntimeErrorScreen } from "@/components/admin/runtime-error-screen";

export default function AppError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const databaseError =
    /database|prisma|postgres|p1001|p1017|can't reach database/i.test(
      `${error.name} ${error.message}`,
    );

  return (
    <RuntimeErrorScreen
      title={databaseError ? "Baza nije dostupna" : "Stranica nije učitana"}
      description={
        databaseError
          ? "Vercel ne može da se poveže na PostgreSQL. Proveri DATABASE_URL i da li su migracije pokrenute."
          : "Došlo je do serverske greške. Osveži stranicu ili proveri Vercel logove."
      }
      onRetry={retry}
    />
  );
}
