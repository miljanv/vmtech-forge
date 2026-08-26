import "server-only";
import { cookies } from "next/headers";
import { currentUser } from "@clerk/nextjs/server";
import { DEMO_ADMIN, isDemoAuthEnabled } from "@/lib/auth/constants";
import { getEnv, isAdminEmail } from "@/lib/env";
import {
  ForbiddenError,
  UnauthorizedError,
} from "@/lib/errors";
import type { AdminUser } from "@/lib/auth/constants";

export async function getAdminUser(): Promise<AdminUser | null> {
  if (isDemoAuthEnabled()) {
    const jar = await cookies();
    if (jar.get("studioforge-demo")?.value === "1") {
      return DEMO_ADMIN;
    }
    if (!getEnv().clerkEnabled) {
      return DEMO_ADMIN;
    }
  }

  if (!getEnv().clerkEnabled) {
    return null;
  }

  const user = await currentUser();
  if (!user) {
    return null;
  }
  const email =
    user.primaryEmailAddress?.emailAddress ??
    user.emailAddresses[0]?.emailAddress ??
    null;
  if (!isAdminEmail(email)) {
    return null;
  }
  return {
    id: user.id,
    email: email ?? "",
    name: [user.firstName, user.lastName].filter(Boolean).join(" ") || "Admin",
  };
}

export async function requireAdmin(): Promise<AdminUser> {
  const user = await getAdminUser();
  if (!user) {
    throw new UnauthorizedError();
  }
  if (!isDemoAuthEnabled() && !isAdminEmail(user.email)) {
    throw new ForbiddenError();
  }
  return user;
}
