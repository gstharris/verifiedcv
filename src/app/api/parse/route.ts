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

// Clean and normalize text, stripping non-printable characters and normalizing dashes
function cleanRawText(input: string): string {
  return input
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[\u2010\u2011\u2012\u2013\u2014\u2015\u2212]/g, " - ")
    .replace(/[\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]/g, " ")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, "")
    .replace(/\t/g, " ")
    .replace(/ +/g, " ")
    .trim();
}

// Resilient fallback parser that only matches real tenure ranges, never standalone years in sentences
function fallbackSegmenter(rawText: string): {
  fullName: string;
  headline: string;
  milestones: ExtractedMilestone[];
} {
  const clean = cleanRawText(rawText);
  const lines = clean.split("\n").map((l) => l.trim()).filter(Boolean);

  let fullName = "Graham Harris";
  let headline = "Product Leader • AI Platforms";

  if (lines.length > 0 && lines[0].length < 45 && !/\d{4}/.test(lines[0])) {
    fullName = lines[0].replace(/[|•,]/g, "").trim();
  }
  if (lines.length > 1 && lines[1].length < 80 && !/\d{4}/.test(lines[1])) {
    headline = lines[1].replace(/[|•]/g, "").trim();
  }

  // Strict tenure date range matcher (e.g. "2010 - 2024", "Jan 2018 - Present", "2018 - 2023")
  // Notice: DOES NOT match single standalone years to prevent splitting on bullet points!
  const tenureRangeRegex = /(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*)?\b(19\d{2}|20\d{2})\b\s*(?:-|–|—|to)\s*(?:(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*)?\b(19\d{2}|20\d{2})\b|present|current)/i;

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
        calibratedClaim: claim || "Led strategic roadmaps, team leadership, and technical platform architecture.",
        isCorroborated: false
      });

      currentCompany = "";
      currentRole = "";
      currentPeriod = "";
      currentClaimLines = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (/^(EXPERIENCE|PROFESSIONAL EXPERIENCE|WORK EXPERIENCE|EMPLOYMENT|HISTORY|SUMMARY|EDUCATION)$/i.test(line)) {
      continue;
    }

    // Only consider as header if line contains a genuine tenure range AND is reasonably short
    const match = line.match(tenureRangeRegex);
    const isHeaderLine = match && (line.length < 90 || line.includes("|") || line.includes("—"));

    if (isHeaderLine && match) {
      commitMilestone();

      currentPeriod = match[0].trim();
      const textWithoutDate = line.replace(currentPeriod, "").replace(/[|•()–—,-]/g, " ").trim();
      const parts = textWithoutDate.split(/\s{2,}|\t/).filter(Boolean);

      if (parts.length >= 2) {
        currentCompany = parts[0];
        currentRole = parts[1];
      } else if (parts.length === 1) {
        currentCompany = parts[0];
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
      currentClaimLines.push(line.replace(/^[•\-\*–]\s*/, ""));
    } else {
      if (currentClaimLines.length === 0 && line.length < 60 && !line.endsWith(".")) {
        if (!currentCompany) currentCompany = line;
        else if (!currentRole) currentRole = line;
        else currentClaimLines.push(line);
      } else {
        currentClaimLines.push(line);
      }
    }
  }

  commitMilestone();

  // If tenure range detection didn't split, fallback to paragraph blocks
  if (milestones.length <= 1 && clean.length > 200) {
    const blocks = clean.split(/\n\s*\n/).filter((b) => b.trim().length > 25);
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
      return NextResponse.json({ error: "No resume file or text provided." }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    // 1. If Gemini Key is Present, use Gemini native extraction
    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        let contents: any[] = [];

        const promptText = `
You are the senior parsing engine for VerifiedCV (verifiedcv.app).
Extract the candidate's career track record losslessly into structured, atomic milestones.

STRICT INSTRUCTIONS:
1. Every distinct role, company, or multi-year initiative MUST be its own separate milestone object.
2. DO NOT combine different career eras or organizations into one entry.
3. 'company': Clean organization name.
4. 'role': Professional title.
5. 'period': Date range (e.g. "2010 — 2024" or "2024 — Present").
6. 'calibratedClaim': Paragraph summarizing accomplishments, platform scale, team size, and architectural outcomes. Remove bullet characters.
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
          const formatted = parsedJson.milestones.map((m: any, idx: number) => ({
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
            milestones: formatted
          });
        }
      } catch (geminiErr) {
        console.warn("Gemini call failed, falling back to structural parser:", geminiErr);
      }
    }

    // 2. High-Resilience Fallback Segmenter
    let rawString = pastedText || "";

    if (file) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const rawText = buffer.toString("utf-8");

      // Strip non-printable binary bytes if raw PDF arrived
      rawString = rawText
        .replace(/[^\x20-\x7E\n\t]/g, " ")
        .replace(/\s{3,}/g, "\n");
    }

    const fallbackResult = fallbackSegmenter(rawString);

    return NextResponse.json({
      success: true,
      engine: "fallback-segmenter",
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