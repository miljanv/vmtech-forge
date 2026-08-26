import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { DatabaseSetupScreen } from "@/components/admin/database-setup-screen";
import { getEnv } from "@/lib/env";
import { getAdminUser } from "@/server/auth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getAdminUser();
  if (!admin) {
    redirect("/login");
  }
  if (!getEnv().DATABASE_URL) {
    return <DatabaseSetupScreen />;
  }
  return <AdminShell adminName={admin.name}>{children}</AdminShell>;
}
