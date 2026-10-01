import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { extractText } from "unpdf";
import { getSupabase } from "@/lib/supabase";
import { matchEmploymentDocument } from "@/lib/documentProof";
import { getHandleOwnerFromRequest, ownerCookieMatches } from "@/lib/handleOwner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 8 * 1024 * 1024;

function getGroqClient(): OpenAI | null {
  const apiKey = process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  return new OpenAI({
    apiKey,
    baseURL: process.env.GROQ_API_KEY ? "https://api.groq.com/openai/v1" : undefined
  });
}

function isPdf(file: File) {
  return file.type.includes("pdf") || file.name.toLowerCase().endsWith(".pdf");
}

async function extractEmployerFromText(text: string): Promise<{ employerName?: string; tenureDates?: string } | null> {
  const groq = getGroqClient();
  if (!groq) return null;

  try {
    const completion = await groq.chat.completions.create({
      model: process.env.GROQ_API_KEY ? "llama-3.3-70b-versatile" : "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Extract the employer legal name and any employment or tax years from this employment document text. Return JSON only with keys employerName and tenureDates."
        },
        {
          role: "user",
          content: text.slice(0, 8000)
        }
      ],
      temperature: 0
    });

    const raw = completion.choices[0]?.message?.content || "{}";
    const jsonStart = raw.indexOf("{");
    const jsonEnd = raw.lastIndexOf("}");
    const parsed = JSON.parse(jsonStart >= 0 ? raw.slice(jsonStart, jsonEnd + 1) : raw) as {
      employerName?: string;
      tenureDates?: string;
    };
    return parsed;
  } catch {
    return null;
  }
}

function missingColumn(error: { message?: string } | null, column: string) {
  return Boolean(error?.message && error.message.toLowerCase().includes(column.toLowerCase()));
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const company = String(formData.get("company") || formData.get("expectedEntity") || "").trim();
    const period = String(formData.get("period") || formData.get("tenureDates") || "").trim();
    const candidateName = String(formData.get("candidateName") || "").trim();
    const handle = String(formData.get("handle") || "").toLowerCase().trim();
    const milestoneId = String(formData.get("milestoneId") || formData.get("experienceId") || "").trim();

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ success: false, matched: false, error: "Upload a PDF of the offer letter, contract, or W-2." }, { status: 400 });
    }
    if (!company || !period) {
      return NextResponse.json({ success: false, matched: false, error: "Company and dates for this chapter are required." }, { status: 400 });
    }
    if (!handle || !milestoneId) {
      return NextResponse.json({ success: false, matched: false, error: "Save your portfolio before attaching a document." }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ success: false, matched: false, error: "That file is larger than 8 MB. Export a smaller PDF." }, { status: 400 });
    }
    if (!isPdf(file)) {
      return NextResponse.json(
        { success: false, matched: false, error: "Upload a PDF. Photos usually cannot be read; export or scan the document to PDF." },
        { status: 400 }
      );
    }

    const supabase = getSupabase();
    let canPersistArtifact = false;
    if (supabase && process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const { data: candidate, error } = await supabase
        .from("candidates")
        .select("handle, owner_token_hash")
        .eq("handle", handle)
        .maybeSingle();

      if (!missingColumn(error, "owner_token_hash")) {
        if (!candidate?.handle) {
          return NextResponse.json({ success: false, matched: false, error: "Save your portfolio before attaching a document." }, { status: 403 });
        }
        if (
          candidate.owner_token_hash &&
          !ownerCookieMatches(getHandleOwnerFromRequest(req), handle, candidate.owner_token_hash)
        ) {
          return NextResponse.json(
            { success: false, matched: false, error: "This handle is claimed in another browser. Restore access first." },
            { status: 403 }
          );
        }
      }

      const { data: milestone } = await supabase
        .from("milestones")
        .select("id, candidate_handle")
        .eq("id", milestoneId)
        .maybeSingle();

      if (milestone && milestone.candidate_handle !== handle) {
        return NextResponse.json({ success: false, matched: false, error: "That chapter is not on this portfolio." }, { status: 400 });
      }
      canPersistArtifact = Boolean(milestone && milestone.candidate_handle === handle);
    }

    let textContent = "";
    try {
      const { text } = await extractText(new Uint8Array(await file.arrayBuffer()));
      textContent = Array.isArray(text) ? text.join("\n") : text || "";
    } catch (pdfErr) {
      console.error("unpdf extraction failed:", pdfErr);
      return NextResponse.json(
        { success: false, matched: false, error: "Could not read text from that PDF." },
        { status: 400 }
      );
    }

    if (!textContent.trim()) {
      return NextResponse.json(
        { success: false, matched: false, error: "That PDF has no readable text. Use a text PDF, not a photo scan." },
        { status: 400 }
      );
    }

    const extracted = await extractEmployerFromText(textContent);
    const match = matchEmploymentDocument({
      text: textContent,
      company,
      period,
      candidateName,
      extractedEmployer: extracted?.employerName
    });

    if (!match.ok) {
      return NextResponse.json({ success: false, matched: false, error: match.reason, data: match }, { status: 400 });
    }

    const artifact = {
      id: `art-${crypto.randomUUID()}`,
      name: "Employment document",
      type: "W-2 / offer letter"
    };

    if (canPersistArtifact && supabase && process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const { error: insertError } = await supabase.from("artifacts").insert({
        id: artifact.id,
        milestone_id: milestoneId,
        name: artifact.name,
        type: artifact.type
      });
      if (insertError) {
        console.error("Artifact insert error:", insertError.message);
        return NextResponse.json({ success: false, matched: false, error: "Matched, but could not save the proof record." }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      matched: true,
      artifact,
      data: {
        employerName: extracted?.employerName || company,
        tenureDates: extracted?.tenureDates || period,
        confidence: "HIGH",
        companyMatched: match.companyMatched,
        yearMatched: match.yearMatched,
        nameMatched: match.nameMatched
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Document scan failed.";
    console.error("Document scan error:", error);
    return NextResponse.json({ success: false, matched: false, error: message }, { status: 500 });
  }
}
