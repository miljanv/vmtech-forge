import { redirect } from "next/navigation";
import { LoginScreen } from "@/components/admin/login-screen";
import { getAdminUser } from "@/server/auth";
import { getEnv } from "@/lib/env";

export default async function LoginPage() {
  const user = await getAdminUser();
  if (user) {
    redirect("/admin");
  }
  const env = getEnv();
  return (
    <LoginScreen clerkEnabled={env.clerkEnabled} demoEnabled={env.demoMode || !env.clerkEnabled} />
  );
}
