import { NextRequest, NextResponse } from "next/server";
import { getAppUrl } from "@/lib/appUrl";

export const LINKEDIN_SESSION_COOKIE = "vcv_linkedin_session";
export const LINKEDIN_OAUTH_STATE_COOKIE = "vcv_linkedin_oauth_state";

export type LinkedInIdentity = {
  sub: string;
  name: string;
  givenName?: string;
  familyName?: string;
  email?: string;
  emailVerified?: boolean;
  picture?: string;
  authenticatedAt: string;
};

type OAuthStatePayload = {
  nonce: string;
  next: string;
};

export function getLinkedInRedirectUri() {
  return `${getAppUrl()}/api/auth/linkedin/callback`;
}

export function isSafeNextPath(next: string | null | undefined): next is string {
  if (!next) return false;
  if (!next.startsWith("/")) return false;
  if (next.startsWith("//")) return false;
  if (next.includes("://")) return false;
  if (next.includes("\\")) return false;
  return true;
}

export function sanitizeNextPath(next: string | null | undefined, fallback = "/studio") {
  return isSafeNextPath(next) ? next : fallback;
}

function cookieSecure() {
  return process.env.NODE_ENV === "production";
}

function cookieDomain() {
  if (process.env.VERCEL_ENV !== "production") return undefined;
  return ".verifiedcv.app";
}

export function isApexVerifiedCvHost(host: string) {
  return host === "verifiedcv.app";
}

export function createOAuthState(next: string) {
  const nonce = crypto.randomUUID();
  const payload: OAuthStatePayload = { nonce, next: sanitizeNextPath(next) };
  return { nonce, state: Buffer.from(JSON.stringify(payload)).toString("base64url") };
}

export function parseOAuthState(state: string | null): OAuthStatePayload | null {
  if (!state) return null;
  try {
    const parsed = JSON.parse(Buffer.from(state, "base64url").toString("utf8")) as OAuthStatePayload;
    if (!parsed?.nonce || !isSafeNextPath(parsed.next)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function applyOAuthStateCookie(response: NextResponse, nonce: string) {
  response.cookies.set(LINKEDIN_OAUTH_STATE_COOKIE, nonce, {
    httpOnly: true,
    sameSite: "lax",
    secure: cookieSecure(),
    path: "/",
    maxAge: 10 * 60,
    ...(cookieDomain() ? { domain: cookieDomain() } : {})
  });
}

export function clearOAuthStateCookie(response: NextResponse) {
  response.cookies.set(LINKEDIN_OAUTH_STATE_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: cookieSecure(),
    path: "/",
    maxAge: 0,
    ...(cookieDomain() ? { domain: cookieDomain() } : {})
  });
}

export function clearLinkedInSessionCookie(response: NextResponse) {
  response.cookies.set(LINKEDIN_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: cookieSecure(),
    path: "/",
    maxAge: 0,
    ...(cookieDomain() ? { domain: cookieDomain() } : {})
  });
}

export function applyLinkedInSessionCookie(response: NextResponse, identity: LinkedInIdentity) {
  response.cookies.set(LINKEDIN_SESSION_COOKIE, encodeURIComponent(JSON.stringify(identity)), {
    httpOnly: true,
    sameSite: "lax",
    secure: cookieSecure(),
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    ...(cookieDomain() ? { domain: cookieDomain() } : {})
  });
}

export function getLinkedInSessionFromRequest(req: NextRequest): LinkedInIdentity | null {
  const raw = req.cookies.get(LINKEDIN_SESSION_COOKIE)?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as LinkedInIdentity;
    if (!parsed?.sub) return null;
    if (!parsed.name) parsed.name = parsed.email?.split("@")[0] || "LinkedIn member";
    return parsed;
  } catch {
    return null;
  }
}

export function mapUserInfoToIdentity(userInfo: Record<string, unknown>): LinkedInIdentity | null {
  const sub = typeof userInfo.sub === "string" ? userInfo.sub.trim() : "";
  const name =
    (typeof userInfo.name === "string" && userInfo.name.trim()) ||
    [userInfo.given_name, userInfo.family_name]
      .filter((part): part is string => typeof part === "string" && part.trim().length > 0)
      .join(" ")
      .trim() ||
    (typeof userInfo.email === "string" ? userInfo.email.split("@")[0] : "") ||
    "LinkedIn member";

  if (!sub) return null;

  return {
    sub,
    name,
    givenName: typeof userInfo.given_name === "string" ? userInfo.given_name : undefined,
    familyName: typeof userInfo.family_name === "string" ? userInfo.family_name : undefined,
    email: typeof userInfo.email === "string" ? userInfo.email : undefined,
    emailVerified: userInfo.email_verified === true,
    picture: typeof userInfo.picture === "string" ? userInfo.picture : undefined,
    authenticatedAt: new Date().toISOString()
  };
}
