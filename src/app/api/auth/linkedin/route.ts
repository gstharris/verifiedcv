import { NextRequest, NextResponse } from "next/server";
import {
  applyOAuthStateCookie,
  createOAuthState,
  getLinkedInRedirectUri,
  isApexVerifiedCvHost,
  sanitizeNextPath
} from "@/lib/linkedin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (isApexVerifiedCvHost(req.nextUrl.hostname)) {
    const www = req.nextUrl.clone();
    www.hostname = "www.verifiedcv.app";
    www.protocol = "https:";
    return NextResponse.redirect(www);
  }

  const clientId = process.env.LINKEDIN_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      { error: "LinkedIn OAuth is not configured. Add LINKEDIN_CLIENT_ID to the environment." },
      { status: 500 }
    );
  }

  const next = sanitizeNextPath(req.nextUrl.searchParams.get("next"));
  const { nonce, state } = createOAuthState(next);
  const redirectUri = getLinkedInRedirectUri();

  const authorizationUrl = new URL("https://www.linkedin.com/oauth/v2/authorization");
  authorizationUrl.searchParams.set("response_type", "code");
  authorizationUrl.searchParams.set("client_id", clientId);
  authorizationUrl.searchParams.set("redirect_uri", redirectUri);
  authorizationUrl.searchParams.set("scope", "openid profile email");
  authorizationUrl.searchParams.set("state", state);

  const response = NextResponse.redirect(authorizationUrl);
  applyOAuthStateCookie(response, nonce);
  return response;
}
