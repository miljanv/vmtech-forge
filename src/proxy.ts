import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_CSP, PUBLIC_SITE_CSP, SECURITY_HEADERS } from "@/lib/security/headers";

function withHeaders(response: NextResponse, admin: boolean) {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
  response.headers.set(
    "Content-Security-Policy",
    admin ? ADMIN_CSP : PUBLIC_SITE_CSP,
  );
  if (!admin) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }
  return response;
}

export default function proxy(request: NextRequest) {
  const admin = request.nextUrl.pathname.startsWith("/admin");
  return withHeaders(NextResponse.next(), admin);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
