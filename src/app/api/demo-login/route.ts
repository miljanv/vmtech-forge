import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { isDemoAuthEnabled } from "@/lib/auth/constants";

export async function POST() {
  if (!isDemoAuthEnabled()) {
    return NextResponse.json({ error: "Demo nije dostupan." }, { status: 403 });
  }
  const jar = await cookies();
  jar.set("studioforge-demo", "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return NextResponse.redirect(new URL("/admin", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"));
}
