import { NextRequest, NextResponse } from "next/server";
import {
  adminResetAllowlist,
  authorizeAdminReset,
  browserSessionCookieNames,
  logAdminReset,
  parseAdminResetRequest,
  runAdminReset
} from "@/lib/adminReset";
import { createSupabaseResetDatabase } from "@/lib/adminResetSupabase";
import { clearHandleOwnerCookie } from "@/lib/handleOwner";
import { clearLinkedInSessionCookie, clearOAuthStateCookie } from "@/lib/linkedin";
import { getServiceRoleClient } from "@/lib/serviceRole";
import { createClient } from "@/lib/supabase/server";
import { markPrivateNoStore } from "@/lib/httpCache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function callerUser() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return null;
  return { id: user.id, email: user.email || null };
}

function jsonResponse(body: unknown, status: number, req: NextRequest, signOut: boolean) {
  const response = markPrivateNoStore(NextResponse.json(body, { status }));
  if (!signOut) return response;
  clearHandleOwnerCookie(response);
  clearLinkedInSessionCookie(response);
  clearOAuthStateCookie(response);
  for (const name of browserSessionCookieNames(req.cookies.getAll().map((cookie) => cookie.name))) {
    if (!name.startsWith("sb-")) continue;
    response.cookies.set(name, "", {
      path: "/",
      maxAge: 0,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production"
    });
  }
  return response;
}

export async function GET() {
  const caller = await callerUser();
  const access = authorizeAdminReset({
    callerEmail: caller?.email,
    nodeEnv: process.env.NODE_ENV,
    allowlist: adminResetAllowlist(process.env.ADMIN_RESET_EMAILS)
  });
  if (!access.ok) {
    logAdminReset({ phase: "denied", actor: caller?.email || null, status: access.status });
    return markPrivateNoStore(NextResponse.json({ error: access.error }, { status: access.status }));
  }
  return markPrivateNoStore(NextResponse.json({ allowed: true, email: caller?.email || null, userId: caller?.id || null }));
}

export async function POST(req: NextRequest) {
  const caller = await callerUser();
  const access = authorizeAdminReset({
    callerEmail: caller?.email,
    nodeEnv: process.env.NODE_ENV,
    allowlist: adminResetAllowlist(process.env.ADMIN_RESET_EMAILS)
  });
  if (!access.ok) {
    logAdminReset({ phase: "denied", actor: caller?.email || null, status: access.status });
    return markPrivateNoStore(NextResponse.json({ error: access.error }, { status: access.status }));
  }

  const parsed = parseAdminResetRequest(await req.json().catch(() => ({})));
  if (!parsed.ok) return markPrivateNoStore(NextResponse.json({ error: parsed.error }, { status: 400 }));

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const admin = getServiceRoleClient();
  if (!url || !serviceRoleKey || !admin) {
    return markPrivateNoStore(NextResponse.json({ error: "Admin reset storage is not configured." }, { status: 503 }));
  }

  logAdminReset({
    phase: parsed.request.dryRun ? "dry_run" : "execute",
    actor: caller?.email || null,
    targetUserId: parsed.request.userId,
    targetEmail: parsed.request.email,
    deleteAuthUser: parsed.request.deleteAuthUser
  });

  try {
    const result = await runAdminReset(
      createSupabaseResetDatabase(admin, { url, serviceRoleKey }),
      parsed.request,
      caller
    );
    const signOut = Boolean(result.summary?.signOutRequired);
    if (signOut) {
      try {
        const supabase = await createClient();
        await supabase.auth.signOut({ scope: "local" });
      } catch (error) {
        logAdminReset({
          phase: "sign_out_error",
          actor: caller?.email || null,
          error: error instanceof Error ? error.message : "Could not clear the local auth session."
        });
      }
    }
    logAdminReset({
      phase: result.ok ? (parsed.request.dryRun ? "dry_run_result" : "execute_result") : "error",
      actor: caller?.email || null,
      status: result.ok ? 200 : result.status,
      targetUserId: result.summary?.target.userId || parsed.request.userId,
      handles: result.summary?.target.handles || [],
      tables: result.summary?.tables || {},
      storageCount: result.summary?.storageObjects.length || 0,
      authUserDeleted: result.summary?.authUserDeleted || false,
      sessionsRevoked: result.summary?.sessionsRevoked || false,
      signOutRequired: signOut,
      error: result.ok ? undefined : result.error,
      table: result.ok ? undefined : result.table
    });
    if (!result.ok) {
      return jsonResponse({ error: result.error, table: result.table, summary: result.summary }, result.status, req, signOut);
    }
    return jsonResponse(result.summary, 200, req, signOut);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Reset failed.";
    logAdminReset({ phase: "error", actor: caller?.email || null, error: message });
    return markPrivateNoStore(NextResponse.json({ error: message }, { status: 500 }));
  }
}
