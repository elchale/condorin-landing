import { NextResponse, type NextRequest } from "next/server";

// Defense in depth: this app is only the admin panel. Anything outside /admin and /api/admin never
// reaches a route, even if an old public page or API handler comes back by mistake. Page requests
// go to the public site (same path, it may exist there); everything else gets a plain 404.
const PUBLIC_SITE = "https://www.condorin.pe";

function allowed(pathname: string) {
  return (
    pathname === "/" ||
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname === "/api/admin" ||
    pathname.startsWith("/api/admin/")
  );
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (allowed(pathname)) return NextResponse.next();

  const isPage = (request.method === "GET" || request.method === "HEAD") && !pathname.startsWith("/api/");
  if (isPage) return NextResponse.redirect(`${PUBLIC_SITE}${pathname}${search}`, 307);
  return new NextResponse("Not found", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } });
}

export const config = {
  // Skips Next internals and static files (anything ending in an extension: icons, manifest, /brand, /img).
  matcher: ["/((?!_next/|.*\\.\\w+$).*)"],
};
