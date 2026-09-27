import { NextRequest, NextResponse } from "next/server";
import {
  applyLinkedInSessionCookie,
  clearOAuthStateCookie,
  getLinkedInRedirectUri,
  LINKEDIN_OAUTH_STATE_COOKIE,
  mapUserInfoToIdentity,
  parseOAuthState
} from "@/lib/linkedin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function redirectWithStatus(req: NextRequest, next: string, status: "success" | "error") {
  const destination = new URL(next, req.nextUrl.origin);
  destination.searchParams.set("linkedin_auth", status);
  const response = NextResponse.redirect(destination);
  clearOAuthStateCookie(response);
  return response;
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get("code");
  const rawState = searchParams.get("state");
  const oauthError = searchParams.get("error");

  const parsedState = parseOAuthState(rawState);
  const next = parsedState?.next || "/studio";
  const storedNonce = req.cookies.get(LINKEDIN_OAUTH_STATE_COOKIE)?.value;

  if (oauthError || !code || !parsedState || !storedNonce || storedNonce !== parsedState.nonce) {
    return redirectWithStatus(req, next, "error");
  }

  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return redirectWithStatus(req, next, "error");
  }

  try {
    const tokenRes = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: getLinkedInRedirectUri()
      })
    });

    const tokenPayload = await tokenRes.json();
    if (!tokenRes.ok || !tokenPayload.access_token) {
      console.error("LinkedIn token exchange failed:", tokenPayload);
      return redirectWithStatus(req, next, "error");
    }

    const userInfoRes = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenPayload.access_token}` },
      cache: "no-store"
    });
    const userInfo = await userInfoRes.json();
    const identity = mapUserInfoToIdentity(userInfo);

    if (!userInfoRes.ok || !identity) {
      console.error("LinkedIn userinfo failed:", userInfo);
      return redirectWithStatus(req, next, "error");
    }

    const destination = new URL(next, req.nextUrl.origin);
    destination.searchParams.set("linkedin_auth", "success");
    const response = NextResponse.redirect(destination);
    clearOAuthStateCookie(response);
    applyLinkedInSessionCookie(response, identity);
    return response;
  } catch (error) {
    console.error("LinkedIn OAuth callback error:", error);
    return redirectWithStatus(req, next, "error");
  }
}
