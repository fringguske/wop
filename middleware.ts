import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, expectedCookieValue } from "./lib/auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/login") || pathname.startsWith("/_next")) {
    return NextResponse.next();
  }

  const cookie = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const expected = await expectedCookieValue();

  if (!expected || cookie !== expected) {
    const loginUrl = new URL("/login", request.url);
    if (!expected) {
      loginUrl.searchParams.set("error", "config");
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|favicon.ico).*)"],
};
