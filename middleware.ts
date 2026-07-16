import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { GATE_COOKIE, gateToken } from "@/lib/gate";

// Next.js 15 → the middleware file is `middleware.ts` (Clerk's `proxy.ts`
// convention is Next 16+). Clerk protects the product routes; the marketing
// site and auth pages stay public.
const isProtected = createRouteMatcher(["/app(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  // Soft pre-launch password gate: everything except /unlock (and Clerk's
  // handshake path) needs the gate cookie, else bounce to /unlock.
  const { pathname } = req.nextUrl;
  const bypassGate =
    pathname === "/unlock" || pathname.startsWith("/unlock/") || pathname.startsWith("/__clerk");
  if (!bypassGate && req.cookies.get(GATE_COOKIE)?.value !== (await gateToken())) {
    const unlock = new URL("/unlock", req.url);
    if (pathname && pathname !== "/") unlock.searchParams.set("next", pathname);
    return NextResponse.redirect(unlock);
  }

  if (isProtected(req)) {
    const { userId } = await auth();
    if (!userId) {
      const signIn = new URL("/sign-in", req.url);
      signIn.searchParams.set("redirect_url", req.nextUrl.pathname);
      return NextResponse.redirect(signIn);
    }
  }
});

export const config = {
  matcher: [
    // Skip Next internals and static files unless in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for Clerk's auto-proxy path and API routes
    "/__clerk/:path*",
    "/(api|trpc)(.*)",
  ],
};
