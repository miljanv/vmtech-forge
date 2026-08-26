import { NextResponse } from "next/server";
import { isDemoAuthEnabled } from "@/lib/auth/constants";

export async function POST(request: Request) {
  if (!isDemoAuthEnabled()) {
    return NextResponse.json({ error: "Demo nije dostupan." }, { status: 403 });
  }
  const response = NextResponse.redirect(new URL("/admin", request.url), 303);
  response.cookies.set("studioforge-demo", "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
