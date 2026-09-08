import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const ADMIN_ONLY_ROUTES = [
  "/admin/pengguna",
  "/admin/siswa",
  "/admin/lini-masa",
  "/admin/rekap-tka",
  "/admin/generator-soal",
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isAdminOnly = ADMIN_ONLY_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  if (isAdminOnly) {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    // 1. If not authenticated, redirect to login
    if (!token) {
      const loginUrl = new URL("/login", req.url);
      return NextResponse.redirect(loginUrl);
    }

    // 2. If user is GURU or any non-ADMIN role, obscure the route with 404 Not Found
    if (token.role !== "ADMIN") {
      const notFoundUrl = new URL("/not-found", req.url);
      return NextResponse.rewrite(notFoundUrl, {
        status: 404,
      });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/pengguna/:path*",
    "/admin/pengguna",
    "/admin/siswa/:path*",
    "/admin/siswa",
    "/admin/lini-masa/:path*",
    "/admin/lini-masa",
    "/admin/rekap-tka/:path*",
    "/admin/rekap-tka",
    "/admin/generator-soal/:path*",
    "/admin/generator-soal",
  ],
};

