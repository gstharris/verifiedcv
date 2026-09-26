import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";

export const dynamic = "force-dynamic";

interface ExtractedMilestone {
  id: string;
  company: string;
  role: string;
  period: string;
  calibratedClaim: string;
  isCorroborated: boolean;
}

// Deterministic semantic parser for plain text (never touches binary PDFs)
function parsePlainTextResume(rawText: string): {
  fullName: string;
  headline: string;
  milestones: ExtractedMilestone[];
} {
  const clean = rawText
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[\u2010\u2011\u2012\u2013\u2014\u2015\u2212]/g, " — ")
    .replace(/\t/g, " ")
    .trim();

  // Split on double linebreaks or distinct company/role paragraphs
  const chunks = clean.split(/\n\s*\n/).map((c) => c.trim()).filter((c) => c.length > 25);

  let fullName = "Graham Harris";
  let headline = "Product Leader • AI Platforms";

  const firstLines = clean.split("\n").map((l) => l.trim()).filter(Boolean);
  if (firstLines.length > 0 && firstLines[0].length < 40 && !/\d{4}/.test(firstLines[0])) {
    fullName = firstLines[0];
  }
  if (firstLines.length > 1 && firstLines[1].length < 75 && !/\d{4}/.test(firstLines[1])) {
    headline = firstLines[1];
  }

  const dateRangeRegex = /(?:(?:\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*)?\b(19\d{2}|20\d{2})\b\s*(?:—|-|–|to)\s*(?:\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*)?\b(19\d{2}|20\d{2})\b|\b(19\d{2}|20\d{2})\b\s*(?:—|-|–|to)\s*(?:Present|Current)|(?:\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+)?\b(19\d{2}|20\d{2})\b)/i;

  const milestones: ExtractedMilestone[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const lines = chunk.split("\n").map((l) => l.trim()).filter(Boolean);
    const headerLine = lines[0] || "";

    // Skip generic resume section headers
    if (/^(EXPERIENCE|PROFESSIONAL EXPERIENCE|WORK HISTORY|SUMMARY|EDUCATION|SKILLS)$/i.test(headerLine)) {
      continue;
    }

    const dateMatch = chunk.match(dateRangeRegex);
    const period = dateMatch ? dateMatch[0].trim() : "Tenure";

    let company = "";
    let role = "";

    const parts = headerLine.replace(period, "").replace(/[|•()–—,-]/g, " ").split(/\s{2,}|\t/).filter(Boolean);

    if (parts.length >= 2) {
      company = parts[0];
      role = parts[1];
    } else if (parts.length === 1) {
      company = parts[0];
      role = lines.length > 1 && lines[1].length < 50 && !lines[1].startsWith("•") ? lines[1] : "Key Leader";
    } else {
      company = `Career Chapter ${milestones.length + 1}`;
      role = "Executive / Leader";
    }

    const claimLines = lines
      .filter((l) => l !== headerLine && !l.includes(period))
      .map((l) => l.replace(/^[•\-\*–]\s*/, "").trim())
      .filter(Boolean);

    milestones.push({
      id: `m-parsed-${Date.now()}-${milestones.length}`,
      company: company.slice(0, 45),
      role: role.slice(0, 45),
      period,
      calibratedClaim: claimLines.join(" ").replace(/\s{2,}/g, " ").trim() || chunk,
      isCorroborated: false
    });
  }

  return { fullName, headline, milestones };
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const pastedText = formData.get("text") as string | null;

    if (!file && (!pastedText || pastedText.trim().length === 0)) {
      return NextResponse.json({ error: "No resume input received." }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    // 1. TIER A: GEMINI MULTIMODAL INGESTION
    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        let contents: any[] = [];

        const promptText = `
You are the senior ingestion engine for VerifiedCV (verifiedcv.app).
Extract the candidate's career track record losslessly into structured, atomic milestones.

STRICT INSTRUCTIONS:
1. Every distinct job, company, or multi-year era MUST be its own separate milestone object.
2. DO NOT combine different career eras or organizations into one entry.
3. 'company': Clean organization name.
4. 'role': Professional title.
5. 'period': Date range (e.g. "2010 — 2024" or "2024 — Present").
6. 'calibratedClaim': Comprehensive paragraph detailing accomplishments, platform scale, technical execution, and outcomes. Remove bullet characters.
`;

        if (file) {
          const buffer = Buffer.from(await file.arrayBuffer());
          const base64Data = buffer.toString("base64");
          const mimeType = file.type || (file.name.endsWith(".pdf") ? "application/pdf" : "text/plain");

          contents = [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType
              }
            },
            promptText
          ];
        } else if (pastedText) {
          contents = [
            promptText,
            `Candidate Resume Content:\n"""\n${pastedText}\n"""`
          ];
        }

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                fullName: { type: Type.STRING },
                headline: { type: Type.STRING },
                milestones: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      company: { type: Type.STRING },
                      role: { type: Type.STRING },
                      period: { type: Type.STRING },
                      calibratedClaim: { type: Type.STRING }
                    },
                    required: ["company", "role", "period", "calibratedClaim"]
                  }
                }
              },
              required: ["fullName", "milestones"]
            }
          }
        });

        const parsedJson = JSON.parse(response.text || "{}");

        if (parsedJson.milestones && Array.isArray(parsedJson.milestones) && parsedJson.milestones.length > 0) {
          const milestones: ExtractedMilestone[] = parsedJson.milestones.map((m: any, idx: number) => ({
            id: `m-gemini-${Date.now()}-${idx}`,
            company: m.company || "Career Chapter",
            role: m.role || "Executive / Leader",
            period: m.period || "Confirmed Tenure",
            calibratedClaim: m.calibratedClaim || "",
            isCorroborated: false
          }));

          return NextResponse.json({
            success: true,
            engine: "gemini-2.5-flash",
            fullName: parsedJson.fullName || "Graham Harris",
            headline: parsedJson.headline || "Product Leader • AI Platforms",
            milestones
          });
        }
      } catch (geminiError: any) {
        console.error("Gemini Ingress Error:", geminiError);
        if (file) {
          return NextResponse.json(
            { error: `Gemini parsing failed on this document: ${geminiError?.message || "Invalid response"}. Please paste your resume text directly.` },
            { status: 502 }
          );
        }
      }
    }

    // 2. TIER B: PLAIN TEXT FALLBACK
    // If user uploaded a binary PDF without GEMINI_API_KEY configured, do NOT run binary string readers!
    if (file && (file.name.endsWith(".pdf") || file.type.includes("pdf"))) {
      return NextResponse.json(
        {
          error: "PDF parsing requires GEMINI_API_KEY to be configured in your environment. To continue without an API key, please open your resume, copy all text (Cmd+A -> Cmd+C), and paste it directly into Candidate Studio."
        },
        { status: 400 }
      );
    }

    if (pastedText) {
      const fallbackResult = parsePlainTextResume(pastedText);
      return NextResponse.json({
        success: true,
        engine: "plaintext-segmenter",
        fullName: fallbackResult.fullName,
        headline: fallbackResult.headline,
        milestones: fallbackResult.milestones
      });
    }

    return NextResponse.json({ error: "Could not parse input. Please paste your career text directly." }, { status: 422 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Parse error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}