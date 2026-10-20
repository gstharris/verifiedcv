import { NextRequest, NextResponse } from "next/server";
import { extractText } from "unpdf";
import {
  EMPTY_PDF_MESSAGE,
  THIN_RESUME_MESSAGE,
  parseComprehensiveResume,
  resumeImportHasContent,
  resumeParseLog
} from "./parseResume";
import {
  UNREADABLE_RESUME_MESSAGE,
  extractResumeFileText
} from "@/lib/resumeFileText";
import { UNSUPPORTED_RESUME_MESSAGE, resumeFileKind } from "@/lib/resumeFileKind";

export const dynamic = "force-dynamic";

export type {
  CandidateContactInfo,
  ExtractedEducation,
  ExtractedMilestone,
  ParsedDossierPayload
} from "./parseResume";

export { normalizeTenurePeriod, parseComprehensiveResume } from "./parseResume";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const pastedText = formData.get("text") as string | null;

    let textContent = pastedText || "";

    if (file) {
      const kind = resumeFileKind(file.name, file.type);
      if (kind === "unsupported") {
        return NextResponse.json({ error: UNSUPPORTED_RESUME_MESSAGE }, { status: 400 });
      }

      const bytes = new Uint8Array(await file.arrayBuffer());

      if (kind === "pdf") {
        try {
          const { text } = await extractText(bytes);
          textContent = Array.isArray(text) ? text.join("\n") : (text || "");
        } catch (pdfErr) {
          console.error("unpdf extraction failed:", pdfErr instanceof Error ? pdfErr.name : "extract");
          return NextResponse.json(
            { error: "Failed to extract text from PDF document." },
            { status: 400 }
          );
        }
      } else {
        const extracted = await extractResumeFileText(kind, bytes);
        if ("error" in extracted) {
          return NextResponse.json({ error: extracted.error }, { status: 400 });
        }
        textContent = extracted.text;
      }

      if (!textContent.trim()) {
        return NextResponse.json(
          { error: kind === "pdf" ? EMPTY_PDF_MESSAGE : UNREADABLE_RESUME_MESSAGE },
          { status: 400 }
        );
      }
    } else if (!textContent.trim()) {
      return NextResponse.json({ error: "No readable resume content found." }, { status: 400 });
    }

    const result = parseComprehensiveResume(textContent);
    console.info(JSON.stringify(resumeParseLog(result)));
    if (!resumeImportHasContent(result)) {
      return NextResponse.json({ error: THIN_RESUME_MESSAGE }, { status: 422 });
    }

    return NextResponse.json({
      success: true,
      engine: "verifiedcv-canonical-parser",
      fullName: result.fullName,
      headline: result.headline,
      summaryStatement: result.summaryStatement,
      highlights: result.highlights,
      contact: result.contact,
      skills: result.skills,
      education: result.education,
      milestones: result.milestones
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Parse error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
