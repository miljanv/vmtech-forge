import { getEnv } from "@/lib/env";

export type AdminUser = {
  id: string;
  email: string;
  name: string;
};

export const DEMO_ADMIN: AdminUser = {
  id: "demo-owner",
  email: "owner@studioforge.local",
  name: "Studio vlasnik",
};

export function isDemoAuthEnabled(): boolean {
  return getEnv().demoMode || !getEnv().clerkEnabled;
}
