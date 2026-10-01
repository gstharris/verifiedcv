import { createHash, randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";

export const HANDLE_OWNER_COOKIE = "vcv_handle_owner";

export type HandleOwnerCookie = {
  handle: string;
  token: string;
};

export type VaultWriteDecision =
  | { ok: true; tokenToSet: string; isNewClaim: boolean }
  | { ok: false; error: string };

function cookieSecure() {
  return process.env.NODE_ENV === "production";
}

function cookieDomain() {
  if (process.env.VERCEL_ENV !== "production") return undefined;
  return ".verifiedcv.app";
}

export function createOwnerToken() {
  return randomBytes(32).toString("hex");
}

export function hashOwnerToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function emailsMatch(left?: string | null, right?: string | null) {
  const a = String(left || "").toLowerCase().trim();
  const b = String(right || "").toLowerCase().trim();
  return Boolean(a && b && a === b);
}

export function serializeHandleOwnerCookie(payload: HandleOwnerCookie) {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

export function parseHandleOwnerCookie(raw: string | undefined | null): HandleOwnerCookie | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(Buffer.from(raw, "base64url").toString("utf8")) as HandleOwnerCookie;
    const handle = String(parsed?.handle || "").toLowerCase().trim();
    const token = String(parsed?.token || "").trim();
    if (!handle || !token) return null;
    return { handle, token };
  } catch {
    return null;
  }
}

export function getHandleOwnerFromRequest(req: NextRequest): HandleOwnerCookie | null {
  return parseHandleOwnerCookie(req.cookies.get(HANDLE_OWNER_COOKIE)?.value);
}

export function applyHandleOwnerCookie(response: NextResponse, payload: HandleOwnerCookie) {
  response.cookies.set(HANDLE_OWNER_COOKIE, serializeHandleOwnerCookie(payload), {
    httpOnly: true,
    sameSite: "lax",
    secure: cookieSecure(),
    path: "/",
    maxAge: 60 * 60 * 24 * 400,
    ...(cookieDomain() ? { domain: cookieDomain() } : {})
  });
}

export function ownerCookieMatches(cookie: HandleOwnerCookie | null, handle: string, tokenHash?: string | null) {
  if (!cookie || !tokenHash) return false;
  if (cookie.handle !== handle.toLowerCase().trim()) return false;
  return hashOwnerToken(cookie.token) === tokenHash;
}

export function authorizeVaultWrite(opts: {
  handle: string;
  incomingEmail: string;
  existing?: { email?: string | null; owner_token_hash?: string | null } | null;
  cookie: HandleOwnerCookie | null;
}): VaultWriteDecision {
  const handle = opts.handle.toLowerCase().trim();

  if (!opts.existing) {
    return { ok: true, tokenToSet: createOwnerToken(), isNewClaim: true };
  }

  if (opts.existing.owner_token_hash) {
    if (ownerCookieMatches(opts.cookie, handle, opts.existing.owner_token_hash)) {
      return { ok: true, tokenToSet: opts.cookie!.token, isNewClaim: false };
    }
    return {
      ok: false,
      error: "This handle is already claimed. If it is yours, email a restore code to the address on the account."
    };
  }

  if (emailsMatch(opts.existing.email, opts.incomingEmail)) {
    return { ok: true, tokenToSet: createOwnerToken(), isNewClaim: true };
  }

  if (opts.cookie?.handle === handle) {
    return { ok: true, tokenToSet: opts.cookie.token, isNewClaim: false };
  }

  return {
    ok: false,
    error: "This handle is already claimed. If it is yours, email a restore code to the address on the account."
  };
}
