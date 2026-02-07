import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("accessToken")?.value;
  const path = request.nextUrl.pathname;

  // صفحات عامة
  const publicPaths = ["/", "/login"];
  const isPublicPath = publicPaths.includes(path);

  // إذا على login وعنده توكن → روح للداشبورد
  if (isPublicPath && token && path === "/login") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // إذا على صفحة محمية بدون توكن → رجّعه للّوجين
  if (!isPublicPath && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
