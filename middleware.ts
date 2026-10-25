import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, canEdit, canRegister, isAuthConfigured, verifyAuthToken } from "./lib/auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/login") || pathname.startsWith("/_next")) {
    return NextResponse.next();
  }

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const role = await verifyAuthToken(token);

  if (!role) {
    const loginUrl = new URL("/login", request.url);
    if (!(await isAuthConfigured())) {
      loginUrl.searchParams.set("error", "config");
    }
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith("/register") && !canRegister(role)) {
    return NextResponse.redirect(new URL("/attendees", request.url));
  }

  if (/^\/attendees\/[^/]+\/edit/.test(pathname) && !canEdit(role)) {
    return NextResponse.redirect(new URL("/attendees", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|favicon.ico).*)"],
};
