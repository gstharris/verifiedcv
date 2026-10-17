import { NextRequest, NextResponse } from "next/server";
import { BETA_COOKIE, isBetaEnforced } from "@/lib/betaAccess";

export function isProtectedWrite(method: string, pathname: string) {
  if (method !== "POST" && method !== "PUT" && method !== "PATCH" && method !== "DELETE") return false;
  if (pathname === "/api/vault" || pathname.startsWith("/api/vault/")) return true;
    if (pathname === "/api/verify/email" || pathname === "/api/verify/phone") return true;
  if (pathname === "/api/verify/attest" && method === "POST") return true;
  if (pathname.startsWith("/api/ally")) return true;
  return false;
}

function isPrivatePage(pathname: string) {
  return pathname === "/studio" || pathname.startsWith("/admin") || pathname.startsWith("/attest/");
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const allowed =
    !isBetaEnforced() ||
    !isProtectedWrite(req.method, pathname) ||
    req.cookies.get(BETA_COOKIE)?.value === "ok";
  const response = allowed
    ? NextResponse.next()
    : NextResponse.json({ error: "Private beta. Studio access is required." }, { status: 401 });
  if (isPrivatePage(pathname)) response.headers.set("Cache-Control", "no-store");
  return response;
}

export const config = {
  matcher: ["/api/vault/:path*", "/api/vault", "/api/verify/:path*", "/api/ally/:path*", "/studio", "/admin/:path*", "/attest/:path*"]
};
