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

// 1. Clean and normalize all clipboard / raw text
function normalizeInputText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[\u2010\u2011\u2012\u2013\u2014\u2015\u2212]/g, " - ")
    .replace(/[\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]/g, " ")
    .replace(/\t/g, " ")
    .replace(/ +/g, " ")
    .trim();
}

// 2. High-resilience structural parser (zero regex line-length traps)
function parseResumeStructurally(rawText: string): {
  fullName: string;
  headline: string;
  milestones: ExtractedMilestone[];
} {
  const normalized = normalizeInputText(rawText);
  const rawLines = normalized.split("\n").map((l) => l.trim()).filter(Boolean);

  let fullName = "Graham Harris";
  let headline = "Product Leader • AI Platforms";

  if (rawLines.length > 0 && rawLines[0].length < 50 && !/\d{4}/.test(rawLines[0])) {
    fullName = rawLines[0].replace(/[|•,]/g, "").trim();
  }
  if (rawLines.length > 1 && rawLines[1].length < 80 && !/\d{4}/.test(rawLines[1])) {
    headline = rawLines[1].replace(/[|•]/g, "").trim();
  }

  // Regex matching any year format (e.g. 2010 - 2024, Jan 2018 - Present, 2021)
  const dateRegex = /(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*)?\b(19\d{2}|20\d{2})\b\s*(?:-|–|—|to)\s*(?:(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*)?\b(19\d{2}|20\d{2})\b|present|current)|\b(19\d{2}|20\d{2})\b/i;

  const milestones: ExtractedMilestone[] = [];
  let currentCompany = "";
  let currentRole = "";
  let currentPeriod = "";
  let currentClaimLines: string[] = [];

  const commitMilestone = () => {
    if (currentCompany || currentRole || currentClaimLines.length > 0) {
      const claim = currentClaimLines
        .join(" ")
        .replace(/^[•\-\*–]\s*/g, "")
        .replace(/\s{2,}/g, " ")
        .trim();

      milestones.push({
        id: `m-seg-${Date.now()}-${milestones.length}`,
        company: currentCompany || "Career Chapter",
        role: currentRole || "Leader",
        period: currentPeriod || "Confirmed Tenure",
        calibratedClaim: claim || "Led organizational roadmaps, strategic execution, and platform architecture.",
        isCorroborated: false
      });

      currentCompany = "";
      currentRole = "";
      currentPeriod = "";
      currentClaimLines = [];
    }
  };

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];

    // Skip broad resume header titles
    if (/^(EXPERIENCE|PROFESSIONAL EXPERIENCE|WORK EXPERIENCE|EMPLOYMENT|HISTORY|SUMMARY|EDUCATION)$/i.test(line)) {
      continue;
    }

    const hasDate = dateRegex.test(line);

    if (hasDate) {
      // Date found - flush the previous role
      commitMilestone();

      const dateMatch = line.match(dateRegex);
      currentPeriod = dateMatch ? dateMatch[0].trim() : "Tenure";

      // Look around to find company & role
      const remainingLine = line.replace(currentPeriod, "").replace(/[|•()–—,-]/g, " ").trim();

      if (remainingLine.length > 2) {
        const parts = remainingLine.split(/\s{2,}|\t/).filter(Boolean);
        if (parts.length >= 2) {
          currentCompany = parts[0];
          currentRole = parts[1];
        } else {
          currentCompany = remainingLine;
          currentRole = "Executive / Leader";
        }
      } else {
        // Date was on its own line: inspect previous 1 or 2 lines for title and company
        if (i > 0 && rawLines[i - 1].length < 80 && !rawLines[i - 1].startsWith("•")) {
          if (i > 1 && rawLines[i - 2].length < 80 && !rawLines[i - 2].startsWith("•")) {
            currentCompany = rawLines[i - 2];
            currentRole = rawLines[i - 1];
          } else {
            currentCompany = rawLines[i - 1];
            currentRole = "Leader";
          }
        } else {
          currentCompany = "Career Chapter";
          currentRole = "Leader";
        }
      }
    } else if (line.startsWith("•") || line.startsWith("-") || line.startsWith("*") || line.startsWith("–")) {
      currentClaimLines.push(line.replace(/^[•\-\*–]\s*/, ""));
    } else {
      if (currentClaimLines.length === 0 && line.length < 65 && !line.endsWith(".")) {
        if (!currentCompany) currentCompany = line;
        else if (!currentRole) currentRole = line;
        else currentClaimLines.push(line);
      } else {
        currentClaimLines.push(line);
      }
    }
  }

  commitMilestone();

  // If date detection yielded <= 1 milestone on substantive text, partition by double returns
  if (milestones.length <= 1 && normalized.length > 200) {
    const blocks = normalized.split(/\n\s*\n/).filter((b) => b.trim().length > 20);
    if (blocks.length > 1) {
      const fallbackList: ExtractedMilestone[] = [];
      blocks.forEach((block, idx) => {
        const bLines = block.trim().split("\n").filter(Boolean);
        const header = bLines[0] || `Role ${idx + 1}`;
        const rest = bLines.slice(1).join(" ").trim() || header;
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
      return NextResponse.json({ error: "No input text or file received." }, { status: 400 });
    }

    let rawString = pastedText || "";

    if (file) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const rawText = buffer.toString("utf-8");

      // Extract printable characters from plain text or basic format streams
      rawString = rawText
        .replace(/[^\x20-\x7E\n\t]/g, " ")
        .replace(/\s{3,}/g, "\n");
    }

    const cleanInput = normalizeInputText(rawString);

    // 1. Try Gemini Parsing if API Key is Present
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    if (apiKey && cleanInput.length > 30) {
      try {
        const ai = new GoogleGenAI({ apiKey });

        const prompt = `
You are the senior parsing engine for VerifiedCV (verifiedcv.app).
Extract the candidate's career track record losslessly into atomic, chronological milestones.

Rules:
1. Every distinct role, company, or multi-year initiative MUST be its own separate milestone.
2. DO NOT combine different career eras or organizations into one entry.
3. 'company': Clean organization name.
4. 'role': Professional title.
5. 'period': Date range (e.g. "2010 — 2024" or "2024 — Present").
6. 'calibratedClaim': Comprehensive paragraph detailing accomplishments, platform scale, technical execution, and outcomes. Remove bullet symbols.

Candidate Experience:
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
      } catch (geminiErr) {
        console.warn("Gemini execution failed, engaging structural parser:", geminiErr);
      }
    }

    // 2. High-Resilience Structural Fallback
    const structuralResult = parseResumeStructurally(cleanInput);

    return NextResponse.json({
      success: true,
      engine: "structural-parser",
      fullName: structuralResult.fullName,
      headline: structuralResult.headline,
      milestones: structuralResult.milestones
    });
  } catch (err: unknown) {
    console.error("Parse route failure:", err);
    const message = err instanceof Error ? err.message : "Parse error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}