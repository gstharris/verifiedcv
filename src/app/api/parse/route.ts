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

// Robust text cleaner that standardizes all line breaks and Unicode variants
function cleanRawText(input: string): string {
  return input
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[\u2010\u2011\u2012\u2013\u2014\u2015\u2212]/g, " - ")
    .replace(/[\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]/g, " ")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, "")
    .replace(/\t/g, " ")
    .replace(/ +/g, " ");
}

// State-machine parser that extracts discrete roles without dropping chapters
function stateMachineSegmenter(rawText: string): {
  fullName: string;
  headline: string;
  milestones: ExtractedMilestone[];
} {
  const clean = cleanRawText(rawText);
  const lines = clean.split("\n").map((l) => l.trim()).filter(Boolean);

  let fullName = "Graham Harris";
  let headline = "Product Leader • AI Platforms";

  // Check top 2 lines for candidate header info
  if (lines.length > 0 && lines[0].length < 45 && !/\d{4}/.test(lines[0])) {
    fullName = lines[0].replace(/[|•,]/g, "").trim();
  }
  if (lines.length > 1 && lines[1].length < 80 && !/\d{4}/.test(lines[1])) {
    headline = lines[1].replace(/[|•]/g, "").trim();
  }

  // Matches any tenure expression: "2010 - 2024", "Jan 2018 - Present", "05/2014 - 08/2022", "2021"
  const dateRegex = /(?:\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+)?(?:\d{1,2}\/)?\b(19\d{2}|20\d{2})\b\s*(?:-|–|—|to)\s*(?:(?:\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+)?(?:\d{1,2}\/)?\b(19\d{2}|20\d{2})\b|present|current)|\b(19\d{2}|20\d{2})\b/i;

  const milestones: ExtractedMilestone[] = [];
  let currentCompany = "";
  let currentRole = "";
  let currentPeriod = "";
  let currentPoints: string[] = [];

  const commitMilestone = () => {
    if (currentCompany || currentRole || currentPoints.length > 0) {
      const claim = currentPoints
        .join(" ")
        .replace(/\s{2,}/g, " ")
        .replace(/^[•\-\*–]\s*/g, "")
        .trim();

      milestones.push({
        id: `m-parse-${Date.now()}-${milestones.length}`,
        company: currentCompany || "Career Chapter",
        role: currentRole || "Leader",
        period: currentPeriod || "Confirmed Tenure",
        calibratedClaim: claim || "Led strategic execution and architectural roadmaps.",
        isCorroborated: false
      });

      currentCompany = "";
      currentRole = "";
      currentPeriod = "";
      currentPoints = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip section headers
    if (/^(EXPERIENCE|PROFESSIONAL EXPERIENCE|WORK HISTORY|SUMMARY|EDUCATION|SKILLS|AWARDS)$/i.test(line)) {
      continue;
    }

    const match = line.match(dateRegex);

    if (match && (line.length < 100 || line.includes("|") || line.includes("-"))) {
      // New role boundary encountered
      commitMilestone();

      currentPeriod = match[0].trim();
      const sanitizedLine = line.replace(currentPeriod, "").replace(/[|•–—,-]/g, " ").trim();
      const parts = sanitizedLine.split(/\s{2,}|\t/).filter(Boolean);

      if (parts.length >= 2) {
        currentCompany = parts[0].trim();
        currentRole = parts[1].trim();
      } else if (parts.length === 1) {
        currentCompany = parts[0].trim();
        currentRole = "Executive / Leader";
      } else {
        // If line only had the date, inspect previous line for company/title
        if (i > 0 && lines[i - 1].length < 75 && !lines[i - 1].startsWith("•")) {
          currentCompany = lines[i - 1];
          currentRole = "Key Leader";
        } else {
          currentCompany = "Career Chapter";
          currentRole = "Leader";
        }
      }
    } else if (line.startsWith("•") || line.startsWith("-") || line.startsWith("*") || line.startsWith("–")) {
      currentPoints.push(line.replace(/^[•\-\*–]\s*/, "").trim());
    } else {
      if (currentPoints.length === 0 && line.length < 60 && !line.endsWith(".")) {
        if (!currentCompany) currentCompany = line;
        else if (!currentRole) currentRole = line;
        else currentPoints.push(line);
      } else {
        currentPoints.push(line);
      }
    }
  }

  commitMilestone();

  // If strict line parsing found 0 or only 1 item, chunk by multi-line paragraphs
  if (milestones.length <= 1 && clean.length > 250) {
    const blocks = clean.split(/\n\s*\n/).filter((b) => b.trim().length > 25);
    if (blocks.length > 1) {
      const fallbackList: ExtractedMilestone[] = [];
      blocks.forEach((block, idx) => {
        const bLines = block.trim().split("\n").filter(Boolean);
        const header = bLines[0] || `Role ${idx + 1}`;
        const rest = bLines.slice(1).join(" ").trim() || header;
        fallbackList.push({
          id: `m-block-${Date.now()}-${idx}`,
          company: header.slice(0, 40),
          role: "Leader",
          period: "Tenure",
          calibratedClaim: rest,
          isCorroborated: false
        });
      });
      return { fullName, headline, milestones: fallbackList };
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
      return NextResponse.json({ error: "No resume file or text provided." }, { status: 400 });
    }

    // 1. Extract raw string from upload or paste
    let rawTextContent = pastedText || "";

    if (file) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const rawDecoded = buffer.toString("utf-8");

      if (file.name.endsWith(".pdf") || rawDecoded.startsWith("%PDF")) {
        // Strip binary PostScript tokens so printable text survives
        rawTextContent = rawDecoded
          .replace(/%PDF-[\s\S]*?(stream[\s\S]*?endstream)/g, " ")
          .replace(/[^\x20-\x7E\n\t]/g, " ")
          .replace(/\s{3,}/g, "\n");
      } else {
        rawTextContent = rawDecoded;
      }
    }

    const cleanInput = cleanRawText(rawTextContent);

    // 2. Check for Gemini Key
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    if (apiKey && cleanInput.length > 40) {
      try {
        const ai = new GoogleGenAI({ apiKey });

        const prompt = `
You are the senior ingestion engine for VerifiedCV (verifiedcv.app).
Extract the candidate's career history into structured, atomic milestones.

STRICT EXTRACTION RULES:
1. Every distinct company, leadership era, or startup initiative MUST be its own separate milestone object.
2. DO NOT combine multiple jobs or companies into one milestone.
3. 'company': Clean organization name.
4. 'role': Professional title.
5. 'period': Tenure date range (e.g., "2010 — 2024" or "2024 — Present").
6. 'calibratedClaim': Cohesive paragraph detailing quantified accomplishments, platform scale, team size, and architectural outcomes. Remove bullet characters.

RESUME CONTENT:
"""
${cleanInput}
"""
`;

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [prompt],
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
            role: m.role || "Leader",
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
      } catch (geminiError) {
        console.warn("Gemini engine error, falling back to state-machine parser:", geminiError);
      }
    }

    // 3. Guaranteed Deterministic Server Fallback
    const fallback = stateMachineSegmenter(cleanInput);

    return NextResponse.json({
      success: true,
      engine: "state-machine-parser",
      fullName: fallback.fullName,
      headline: fallback.headline,
      milestones: fallback.milestones
    });
  } catch (err: unknown) {
    console.error("Critical Ingress Error:", err);
    const message = err instanceof Error ? err.message : "Ingestion failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}