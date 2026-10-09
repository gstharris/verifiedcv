import { NextRequest, NextResponse } from "next/server";
import { isAllowedPortfolioUpload } from "@/lib/portfolioAssets";
import { getSupabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 10 * 1024 * 1024;
const BUCKET = "portfolio-assets";

function safeName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").slice(0, 80) || "file";
}

function contentTypeFor(file: File) {
  if (file.type && file.type !== "application/octet-stream") return file.type;
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return "application/pdf";
  if (ext === "png") return "image/png";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "webp") return "image/webp";
  if (ext === "ppt") return "application/vnd.ms-powerpoint";
  if (ext === "pptx") return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
  if (ext === "zip" || ext === "key") return "application/zip";
  return "application/octet-stream";
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
    return NextResponse.json({ error: "Keep uploads under 10 MB, or host the file and paste the link." }, { status: 400 });
  }
  if (!isAllowedPortfolioUpload(file.name)) {
    return NextResponse.json({ error: "Upload a PDF, image, deck, Keynote, or zip — or paste a public link." }, { status: 400 });
  }

  const path = `${handle}/${Date.now()}-${safeName(file.name)}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const contentType = contentTypeFor(file);
  let { error } = await admin.storage.from(BUCKET).upload(path, buffer, {
    contentType,
    upsert: false
  });

  if (error && /bucket/i.test(error.message || "")) {
    const created = await admin.storage.createBucket(BUCKET, { public: true });
    if (!created.error) {
      const retry = await admin.storage.from(BUCKET).upload(path, buffer, { contentType, upsert: false });
      error = retry.error;
    }
  }

  if (error) {
    console.error("Portfolio upload failed:", error.message);
    return NextResponse.json(
      { error: "Could not store that file. Paste a public link instead." },
      { status: 500 }
    );
  }

  const { data } = admin.storage.from(BUCKET).getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
}
