import { NextRequest, NextResponse } from "next/server";
import { getVaultStore, saveToVaultStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const handle = (searchParams.get("handle") || "").toLowerCase().trim();

  if (!handle) {
    return NextResponse.json({ error: "Handle parameter required." }, { status: 400 });
  }

  const store = getVaultStore();
  const record = store[handle];
  
  if (!record) {
    return NextResponse.json({ error: "Handle not found in Vault." }, { status: 404 });
  }

  return NextResponse.json(record);
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const handle = (payload.handle || "").toLowerCase().trim();

    if (!handle || !payload.fullName) {
      return NextResponse.json(
        { error: "Handle and full name are required to commit to Vault." },
        { status: 400 }
      );
    }

    const dossierRecord = {
      ...payload,
      handle,
      updatedAt: new Date().toISOString()
    };

    saveToVaultStore(handle, dossierRecord);

    return NextResponse.json({
      success: true,
      handle,
      dossierUrl: `https://verifiedcv.app/${handle}`
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Vault commit error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}