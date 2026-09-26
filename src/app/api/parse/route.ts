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

// Resilient line-by-line parser that does NOT rely on double linebreaks
function segmentPlainTextLosslessly(rawText: string): {
  fullName: string;
  headline: string;
  milestones: ExtractedMilestone[];
} {
  const clean = rawText
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[\u2010\u2011\u2012\u2013\u2014\u2015\u2212]/g, " — ")
    .replace(/[\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]/g, " ")
    .replace(/\t/g, "  ");

  const lines = clean.split("\n").map((l) => l.trim()).filter(Boolean);

  let fullName = "Graham Harris";
  let headline = "Product Leader • Personalization & AI Platforms";

  if (lines.length > 0 && lines[0].length < 40 && !/\d{4}/.test(lines[0])) {
    fullName = lines[0].replace(/[|•,]/g, "").trim();
  }
  if (lines.length > 1 && lines[1].length < 75 && !/\d{4}/.test(lines[1])) {
    headline = lines[1].replace(/[|•]/g, "").trim();
  }

  // Matches any tenure range: "2010 — 2024", "Jan 2018 - Present", "2018 — 2023", "05/2014 - 08/2022"
  const dateRegex = /(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*)?(?:\d{1,2}\/)?\b(19\d{2}|20\d{2})\b\s*(?:—|-|–|to)\s*(?:(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*)?(?:\d{1,2}\/)?\b(19\d{2}|20\d{2})\b|present|current)/i;

  const milestones: ExtractedMilestone[] = [];
  let currentCompany = "";
  let currentRole = "";
  let currentPeriod = "";
  let currentBullets: string[] = [];

  const flush = () => {
    if (currentCompany || currentRole || currentBullets.length > 0) {
      const claim = currentBullets
        .join(" ")
        .replace(/^[•\-\*–]\s*/g, "")
        .replace(/\s{2,}/g, " ")
        .trim();

      milestones.push({
        id: `m-parsed-${Date.now()}-${milestones.length}`,
        company: currentCompany || "Career Chapter",
        role: currentRole || "Leader",
        period: currentPeriod || "Confirmed Tenure",
        calibratedClaim: claim || "Led strategic roadmaps, technical execution, and operational delivery.",
        isCorroborated: false
      });

      currentCompany = "";
      currentRole = "";
      currentPeriod = "";
      currentBullets = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip section headers
    if (/^(EXPERIENCE|PROFESSIONAL EXPERIENCE|WORK EXPERIENCE|EMPLOYMENT HISTORY|SUMMARY|EDUCATION|SKILLS)$/i.test(line)) {
      continue;
    }

    const match = line.match(dateRegex);

    if (match) {
      // Date found - flush the prior role
      flush();

      currentPeriod = match[0].trim();
      const textWithoutDate = line.replace(currentPeriod, "").replace(/[|•()–—,-]/g, " ").trim();
      const parts = textWithoutDate.split(/\s{2,}|\t/).filter(Boolean);

      if (parts.length >= 2) {
        currentCompany = parts[0].trim();
        currentRole = parts[1].trim();
      } else if (parts.length === 1) {
        currentCompany = parts[0].trim();
        // Check if previous line had a title
        if (i > 0 && lines[i - 1].length < 60 && !lines[i - 1].startsWith("•")) {
          currentRole = lines[i - 1];
        } else {
          currentRole = "Executive / Leader";
        }
      } else {
        if (i > 0 && lines[i - 1].length < 75 && !lines[i - 1].startsWith("•")) {
          if (i > 1 && lines[i - 2].length < 75 && !lines[i - 2].startsWith("•")) {
            currentCompany = lines[i - 2];
            currentRole = lines[i - 1];
          } else {
            currentCompany = lines[i - 1];
            currentRole = "Leader";
          }
        } else {
          currentCompany = "Career Chapter";
          currentRole = "Leader";
        }
      }
    } else if (line.startsWith("•") || line.startsWith("-") || line.startsWith("*") || line.startsWith("–")) {
      currentBullets.push(line.replace(/^[•\-\*–]\s*/, "").trim());
    } else {
      if (currentBullets.length === 0 && line.length < 60 && !line.endsWith(".")) {
        if (!currentCompany) currentCompany = line;
        else if (!currentRole) currentRole = line;
        else currentBullets.push(line);
      } else {
        currentBullets.push(line);
      }
    }
  }

  flush();

  // If no date range was found, divide into logical 4-5 line blocks
  if (milestones.length === 0 && lines.length > 0) {
    const chunkSize = 5;
    for (let i = 0; i < lines.length; i += chunkSize) {
      const slice = lines.slice(i, i + chunkSize);
      milestones.push({
        id: `m-chunk-${Date.now()}-${milestones.length}`,
        company: slice[0].slice(0, 45),
        role: "Leader / Contributor",
        period: "Tenure",
        calibratedClaim: slice.slice(1).join(" ").trim() || slice[0],
        isCorroborated: false
      });
    }
  }

  return { fullName, headline, milestones };
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const pastedText = formData.get("text") as string | null;

    if (!file && (!pastedText || pastedText.trim().length === 0)) {
      return NextResponse.json({ error: "No resume input provided." }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    // 1. TIER A: GEMINI MULTIMODAL EXTRACTION
    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        let contents: any[] = [];

        const prompt = `
You are the senior ingestion engine for VerifiedCV (verifiedcv.app).
Extract the candidate's career track record losslessly into structured, atomic milestones.

STRICT INSTRUCTIONS:
1. Every distinct role, company, or multi-year era MUST be its own separate milestone object.
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
            prompt
          ];
        } else if (pastedText) {
          contents = [
            prompt,
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
        console.error("[VerifiedCV Ingress] Gemini parsing error:", geminiError);
        if (file) {
          return NextResponse.json(
            { error: `Gemini parsing failed on this PDF: ${geminiError?.message || "Unknown error"}. Please copy all text from your resume and use 'Paste Career Text'.` },
            { status: 502 }
          );
        }
      }
    }

    // 2. HARD DEFENSE: DO NOT RUN STRING DECODING ON BINARY PDFS
    if (file && (file.name.endsWith(".pdf") || file.type.includes("pdf"))) {
      return NextResponse.json(
        {
          error: "Binary PDF uploads require a configured GEMINI_API_KEY. To continue immediately without an API key, please open your resume document, copy the text (Cmd+A -> Cmd+C), and paste it into 'Paste Career Text'."
        },
        { status: 400 }
      );
    }

    // 3. TIER B: DETERMINISTIC PLAINTEXT SEGMENTER
    if (pastedText) {
      const fallbackResult = segmentPlainTextLosslessly(pastedText);
      return NextResponse.json({
        success: true,
        engine: "deterministic-line-segmenter",
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