"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { AppProviders } from "@/components/admin/app-providers";

export function RootProviders({
  children,
  clerkEnabled,
}: {
  children: React.ReactNode;
  clerkEnabled: boolean;
}) {
  if (!clerkEnabled) {
    return <AppProviders>{children}</AppProviders>;
  }
  return (
    <ClerkProvider>
      <AppProviders>{children}</AppProviders>
    </ClerkProvider>
  );
}
