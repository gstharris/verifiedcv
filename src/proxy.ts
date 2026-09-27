import { NextRequest, NextResponse } from "next/server";
import { BETA_COOKIE, isBetaEnforced } from "@/lib/betaAccess";

function isProtectedWrite(method: string, pathname: string) {
  if (method !== "POST" && method !== "PUT" && method !== "DELETE") return false;
  if (pathname === "/api/vault" || pathname.startsWith("/api/vault/")) return true;
  if (pathname === "/api/verify/email") return true;
  if (pathname === "/api/verify/attest" && method === "POST") return true;
  if (pathname.startsWith("/api/ally")) return true;
  return false;
}

export function proxy(req: NextRequest) {
  if (!isBetaEnforced()) return NextResponse.next();
  if (!isProtectedWrite(req.method, req.nextUrl.pathname)) return NextResponse.next();
  if (req.cookies.get(BETA_COOKIE)?.value === "ok") return NextResponse.next();

  return NextResponse.json({ error: "Private beta. Studio access is required." }, { status: 401 });
}

export const config = {
  matcher: ["/api/vault/:path*", "/api/vault", "/api/verify/:path*", "/api/ally/:path*"]
};
