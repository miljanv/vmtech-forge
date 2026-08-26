import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_CSP, PUBLIC_SITE_CSP, SECURITY_HEADERS } from "@/lib/security/headers";

const isAdminRoute = createRouteMatcher(["/admin(.*)", "/api/admin(.*)"]);

const clerkHandler = clerkMiddleware(async (auth, request) => {
  if (isAdminRoute(request)) {
    await auth.protect({
      unauthenticatedUrl: new URL("/login", request.url).toString(),
    });
  }
});

function withHeaders(response: Response, admin: boolean) {
  const next =
    response instanceof NextResponse
      ? response
      : new NextResponse(response.body, {
          status: response.status,
          headers: response.headers,
        });
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    next.headers.set(key, value);
  }
  next.headers.set("Content-Security-Policy", admin ? ADMIN_CSP : PUBLIC_SITE_CSP);
  if (!admin) {
    next.headers.set("X-Robots-Tag", "noindex, nofollow");
  }
  return next;
}

function usesClerkUi(pathname: string) {
  return (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/sign-up")
  );
}

export default function proxy(request: NextRequest, event: unknown) {
  const clerkUi = usesClerkUi(request.nextUrl.pathname);
  const demo =
    process.env.STUDIOFORGE_DEMO_MODE === "true" ||
    process.env.NODE_ENV === "test" ||
    !process.env.CLERK_SECRET_KEY;

  if (demo) {
    return withHeaders(NextResponse.next(), clerkUi);
  }

  const result = clerkHandler(request, event as never);
  if (result instanceof Promise) {
    return result.then((response) =>
      withHeaders(response ?? NextResponse.next(), clerkUi),
    );
  }
  return withHeaders(result ?? NextResponse.next(), clerkUi);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
