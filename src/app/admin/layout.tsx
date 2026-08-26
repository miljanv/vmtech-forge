import { AdminShell } from "@/components/admin/admin-shell";
import { getEnv } from "@/lib/env";
import { getAdminUser } from "@/server/auth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getAdminUser();
  return (
    <AdminShell adminName={admin?.name ?? "Studio vlasnik"}>
      {!getEnv().DATABASE_URL ? (
        <div className="mb-6 rounded-2xl border border-dashed border-border p-4 text-sm leading-6 text-muted-foreground">
          Baza još nije povezana. Panel možeš da pregledaš, ali firme, pipeline i
          generisanja ostaju prazni dok u Vercel ne dodaš{" "}
          <code className="rounded bg-muted px-1.5 py-0.5">DATABASE_URL</code>.
        </div>
      ) : null}
      {children}
    </AdminShell>
  );
}
