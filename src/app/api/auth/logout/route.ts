import { NextResponse } from "next/server";
import { clearHandleOwnerCookie } from "@/lib/handleOwner";

export const dynamic = "force-dynamic";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  clearHandleOwnerCookie(response);
  return response;
}
