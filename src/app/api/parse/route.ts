import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";
import pdfParse from "pdf-parse";

export const dynamic = "force-dynamic";

interface ExtractedMilestone {
  id: string;
  company: string;
  role: string;
  period: string;
  calibratedClaim: string;
  isCorroborated: boolean;
}

// 1. Text Sanitizer
function cleanExtractedText(raw: string): string {
  return raw
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[\u2010\u2011\u2012\u2013\u2014\u2015\u2212]/g, " - ")
    .replace(/[\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]/g, " ")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, "")
    .replace(/\t/g, " ")
    .replace(/ +/g, " ")
    .trim();
}

// 2. High-Accuracy Structural Segmenter (Local Engine)
function segmentTextIntoMilestones(cleanedText: string): {
  fullName: string;
  headline: string;
  milestones: ExtractedMilestone[];
} {
  const lines = cleanedText.split("\n").map((l) => l.trim()).filter(Boolean);

  let fullName = "Graham Harris";
  let headline = "Product Leader • AI Platforms";

  if (lines.length > 0 && lines[0].length < 45 && !/\d{4}/.test(lines[0])) {
    fullName = lines[0].replace(/[|•,]/g, "").trim();
  }
  if (lines.length > 1 && lines[1].length < 80 && !/\d{4}/.test(lines[1])) {
    headline = lines[1].replace(/[|•]/g, "").trim();
  }

  // Matches genuine employment date ranges
  const dateRangeRegex = /(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*)?\b(19\d{2}|20\d{2})\b\s*(?:-|–|—|to)\s*(?:(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*)?\b(19\d{2}|20\d{2})\b|present|current)/i;

  const milestones: ExtractedMilestone[] = [];
  let currentCompany = "";
  let currentRole = "";
  let currentPeriod = "";
  let currentBullets: string[] = [];

  const commitMilestone = () => {
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
        calibratedClaim: claim || "Led key strategic initiatives, product development, and operational scale.",
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

    if (/^(EXPERIENCE|PROFESSIONAL EXPERIENCE|WORK EXPERIENCE|EMPLOYMENT|HISTORY|SUMMARY|EDUCATION)$/i.test(line)) {
      continue;
    }

    const match = line.match(dateRangeRegex);
    const isRoleHeader = match && (line.length < 90 || line.includes("|") || line.includes("—") || line.includes(" - "));

    if (isRoleHeader && match) {
      commitMilestone();

      currentPeriod = match[0].trim();
      const sanitized = line.replace(currentPeriod, "").replace(/[|•()–—,-]/g, " ").trim();
      const tokens = sanitized.split(/\s{2,}|\t/).filter(Boolean);

      if (tokens.length >= 2) {
        currentCompany = tokens[0];
        currentRole = tokens[1];
      } else if (tokens.length === 1) {
        currentCompany = tokens[0];
        currentRole = "Executive / Leader";
      } else {
        if (i > 0 && lines[i - 1].length < 75 && !lines[i - 1].startsWith("•")) {
          currentCompany = lines[i - 1];
          currentRole = "Key Leader";
        } else {
          currentCompany = "Career Chapter";
          currentRole = "Leader";
        }
      }
    } else if (line.startsWith("•") || line.startsWith("-") || line.startsWith("*") || line.startsWith("–")) {
      currentBullets.push(line.replace(/^[•\-\*–]\s*/, ""));
    } else {
      if (currentBullets.length === 0 && line.length < 65 && !line.endsWith(".")) {
        if (!currentCompany) currentCompany = line;
        else if (!currentRole) currentRole = line;
        else currentBullets.push(line);
      } else {
        currentBullets.push(line);
      }
    }
  }

  commitMilestone();

  // If date-matching only found 1 milestone, split on multi-line paragraph boundaries
  if (milestones.length <= 1 && cleanedText.length > 250) {
    const chunks = cleanedText.split(/\n\s*\n/).filter((c) => c.trim().length > 30);
    if (chunks.length > 1) {
      const fallbackList: ExtractedMilestone[] = [];
      chunks.forEach((chunk, idx) => {
        const cLines = chunk.trim().split("\n").filter(Boolean);
        const header = cLines[0] || `Role ${idx + 1}`;
        const rest = cLines.slice(1).join(" ").trim() || header;
        fallbackList.push({
          id: `m-block-${Date.now()}-${idx}`,
          company: header.slice(0, 45),
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
      return NextResponse.json({ error: "No resume file or text received." }, { status: 400 });
    }

    let extractedPlaintext = "";

    // 1. EXTRACT REAL PLAINTEXT FROM PDF OR TXT
    if (file) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      if (file.name.endsWith(".pdf") || file.type.includes("pdf")) {
        try {
          const pdfData = await pdfParse(buffer);
          extractedPlaintext = pdfData.text;
        } catch (pdfErr) {
          console.warn("pdf-parse extraction failed, falling back to ASCII stream reader:", pdfErr);
          extractedPlaintext = buffer.toString("utf-8").replace(/[^\x20-\x7E\n\t]/g, " ");
        }
      } else {
        extractedPlaintext = buffer.toString("utf-8");
      }
    } else if (pastedText) {
      extractedPlaintext = pastedText;
    }

    const cleanContent = cleanExtractedText(extractedPlaintext);

    // 2. TIER A: IF GEMINI API KEY IS CONFIGURED, USE LLM SCHEMA EXTRACTION
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    if (apiKey && cleanContent.length > 30) {
      try {
        const ai = new GoogleGenAI({ apiKey });

        const promptText = `
You are the senior parsing engine for VerifiedCV (verifiedcv.app).
Extract the candidate's career track record losslessly into structured, atomic milestones.

STRICT INSTRUCTIONS:
1. Every distinct role, company, or multi-year era MUST be its own separate milestone object.
2. DO NOT combine different career eras or organizations into one entry.
3. 'company': Clean organization name.
4. 'role': Professional title.
5. 'period': Date range (e.g. "2010 — 2024" or "2024 — Present").
6. 'calibratedClaim': Paragraph summarizing accomplishments, platform scale, technical execution, and outcomes. Remove bullet characters.

RESUME CONTENT:
"""
${cleanContent}
"""
`;

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [promptText],
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
      } catch (geminiError) {
        console.warn("Gemini call failed; falling back to local structural parser:", geminiError);
      }
    }

    // 3. TIER B: DETERMINISTIC LOCAL STRUCTURAL PARSER (100% OFFLINE / ZERO API KEY DEPENDENCY)
    const fallbackResult = segmentTextIntoMilestones(cleanContent);

    return NextResponse.json({
      success: true,
      engine: "pdf-parse-local",
      fullName: fallbackResult.fullName,
      headline: fallbackResult.headline,
      milestones: fallbackResult.milestones
    });
  } catch (err: unknown) {
    console.error("Critical parse route error:", err);
    const message = err instanceof Error ? err.message : "Parse error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}