"use client";

import { RuntimeErrorScreen } from "@/components/admin/runtime-error-screen";

export default function AdminError({
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
      title={databaseError ? "Baza nije dostupna" : "Admin panel nije učitan"}
      description={
        databaseError
          ? "Dodaj DATABASE_URL i DIRECT_URL u Vercel, pa pokreni prisma migrate deploy."
          : "Serverska greška u admin panelu. Proveri Vercel Runtime Logs."
      }
      onRetry={retry}
    />
  );
}
