import { NextRequest, NextResponse } from "next/server";
import { extractText } from "unpdf";
import {
  EMPTY_PDF_MESSAGE,
  THIN_RESUME_MESSAGE,
  WORD_RESUME_MESSAGE,
  isWordResumeFile,
  parseComprehensiveResume,
  resumeImportHasContent,
  resumeParseLog
} from "./parseResume";

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
      if (isWordResumeFile(file.name, file.type)) {
        return NextResponse.json({ error: WORD_RESUME_MESSAGE }, { status: 400 });
      }

      const buffer = await file.arrayBuffer();
      const pdf = file.name.toLowerCase().endsWith(".pdf") || file.type.includes("pdf");

      if (pdf) {
        try {
          const { text } = await extractText(new Uint8Array(buffer));
          textContent = Array.isArray(text) ? text.join("\n") : (text || "");
        } catch (pdfErr) {
          console.error("unpdf extraction failed:", pdfErr instanceof Error ? pdfErr.name : "extract");
          return NextResponse.json(
            { error: "Failed to extract text from PDF document." },
            { status: 400 }
          );
        }
      } else {
        textContent = Buffer.from(buffer).toString("utf-8");
      }

      if (!textContent.trim()) {
        return NextResponse.json(
          { error: pdf ? EMPTY_PDF_MESSAGE : "No readable resume content found." },
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
