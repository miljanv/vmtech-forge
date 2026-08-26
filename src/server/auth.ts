import "server-only";
import { DEMO_ADMIN } from "@/lib/auth/constants";
import type { AdminUser } from "@/lib/auth/constants";

export async function getAdminUser(): Promise<AdminUser | null> {
  return DEMO_ADMIN;
}

export async function requireAdmin(): Promise<AdminUser> {
  return DEMO_ADMIN;
}
