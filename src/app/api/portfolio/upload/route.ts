import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/zip",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation"
]);

function safeName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").slice(0, 80) || "file";
}

export async function POST(req: NextRequest) {
  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({ error: "File storage is not configured. Paste a public URL instead." }, { status: 500 });
  }

  const form = await req.formData();
  const file = form.get("file");
  const handle = String(form.get("handle") || "").toLowerCase().trim().replace(/[^a-z0-9-]/g, "");

  if (!(file instanceof File) || !handle) {
    return NextResponse.json({ error: "A file and portfolio handle are required." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Keep uploads under 10 MB, or host the file and paste the URL." }, { status: 400 });
  }
  if (file.type && !ALLOWED.has(file.type)) {
    return NextResponse.json({ error: "Upload a PDF, image, zip, or presentation — or paste a public URL." }, { status: 400 });
  }

  const path = `${handle}/${Date.now()}-${safeName(file.name)}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await admin.storage.from("portfolio-assets").upload(path, buffer, {
    contentType: file.type || "application/octet-stream",
    upsert: false
  });

  if (error) {
    return NextResponse.json(
      { error: "Could not store that file yet. Paste a public URL, or run the portfolio_assets migration." },
      { status: 500 }
    );
  }

  const { data } = admin.storage.from("portfolio-assets").getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
}
