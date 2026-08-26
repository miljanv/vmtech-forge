"use client";

import { AppProviders } from "@/components/admin/app-providers";

export function RootProviders({ children }: { children: React.ReactNode }) {
  return <AppProviders>{children}</AppProviders>;
}
