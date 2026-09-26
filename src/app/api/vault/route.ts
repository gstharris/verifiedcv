import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Global singleton to persist across Next.js dev server worker recycling
const globalVault = globalThis as unknown as {
  __VERIFIED_CV_VAULT__?: Record<string, any>;
};

if (!globalVault.__VERIFIED_CV_VAULT__) {
  globalVault.__VERIFIED_CV_VAULT__ = {};
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const handle = (body.candidateHandle || "gharris").toLowerCase();

    const record = {
      ...body,
      candidateHandle: handle,
      updatedAt: new Date().toISOString(),
    };

    globalVault.__VERIFIED_CV_VAULT__![handle] = record;

    return NextResponse.json({
      success: true,
      message: "Dossier anchored to Vault.",
      handle,
      data: record,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to persist to Vault" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const handle = (searchParams.get("handle") || "gharris").toLowerCase();

  const record = globalVault.__VERIFIED_CV_VAULT__![handle] || null;

  return NextResponse.json(
    {
      success: true,
      data: record,
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}