import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const role = request.cookies.get("user_role")?.value;
  const { pathname } = request.nextUrl;

  const isAuthRoute = pathname === "/login" || pathname === "/register";
  const isStudentRoute = pathname.startsWith("/student");
  const isTpoRoute = pathname.startsWith("/tpo");

  // 1. If user is logged in and tries to access /login or /register, redirect to dashboard
  if (token && isAuthRoute) {
    if (role === "TPO") {
      return NextResponse.redirect(new URL("/tpo/dashboard", request.url));
    }
    return NextResponse.redirect(new URL("/student/dashboard", request.url));
  }

  // 2. Unauthenticated user trying to access protected routes
  if (!token && (isStudentRoute || isTpoRoute)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 3. Role-Based Access Control
  // Student attempting to access TPO routes
  if (isTpoRoute && role !== "TPO") {
    return NextResponse.redirect(new URL("/student/dashboard", request.url));
  }

  // TPO attempting to access Student routes
  if (isStudentRoute && role !== "STUDENT") {
    return NextResponse.redirect(new URL("/tpo/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/student/:path*",
    "/tpo/:path*",
    "/login",
    "/register"
  ],
};
